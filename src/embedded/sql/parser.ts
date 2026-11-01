import type { Options, Parser, Plugin } from "prettier";
import { language } from "./language.js";

export interface SqlNode {
  type: string;
  range?: [number, number];
  clauses?: SqlNode[];
  columns?: SqlNode;
  items?: SqlNode[];
  left?: SqlNode;
  modifiers?: SqlNode[];
  operator?: string | SqlNode | SqlNode[];
  prefixLength?: number;
  specification?: SqlNode;
  statements?: SqlNode[];
}

// Tried in order, each completes a kind of fragment in every dialect:
// conditions and column lists, clauses and select list continuations, joins
const FRAGMENT_PREFIXES = ["SELECT ", "SELECT 1 ", "SELECT * FROM _ "];

export const parser: Parser<SqlNode> = {
  async parse(text, options) {
    const dialect =
      (options as unknown as Options).embeddedSqlParser ?? "sqlite";
    const sqlParser: Parser<SqlNode> | undefined = options.plugins.findLast(
      (plugin): plugin is Plugin =>
        typeof plugin === "object" &&
        "parsers" in plugin &&
        plugin.parsers?.[dialect] !== undefined,
    )?.parsers?.[dialect];
    if (!sqlParser) {
      throw new Error(`Couldn't resolve parser "${dialect}".`);
    }
    // The CST formatter reads its dialect from `parser`, also while printing
    options.parser = dialect;
    try {
      return await sqlParser.parse(text, options);
    } catch (error) {
      if (!(options as unknown as Options).embeddedSqlFormatFragments) {
        throw error;
      }
      // A template that isn't a whole statement may parse after a prefix,
      // whose nodes the printer then leaves out. That parse is a guess, so
      // keywords are never added or removed: `id int` may be a column
      // definition rather than an alias
      for (const prefix of FRAGMENT_PREFIXES) {
        try {
          const ast = await sqlParser.parse(prefix + text, {
            ...options,
            sqlCanonicalSyntax: false,
            sqlFinalSemicolon: false,
          });
          const [statement, ...rest] = ast.statements!;
          if (
            statement?.type === "select_stmt" &&
            rest.every(({ type }) => type === "empty")
          ) {
            const columns = statement.clauses!.find(
              ({ type }) => type === "select_clause",
            )?.columns;
            // A stripped trailing empty column leaves its comma in the list's range.
            if (
              columns &&
              columns.range![1] > columns.items!.at(-1)!.range![1]
            ) {
              continue;
            }
            statement.clauses = statement.clauses!.filter(
              ({ range }) => range![1] > prefix.length,
            );
            options.originalText = prefix + text;
            return { ...ast, prefixLength: prefix.length };
          }
        } catch {}
      }
      throw error;
    }
  },
  astFormat: language,
  // Canonicalization can add nodes without source ranges.
  locStart: (node) => node.range?.[0] as number,
  locEnd: (node) => node.range?.[1] as number,
};

declare module "../types.js" {
  interface EmbeddedParsers {
    [language]: Parser;
  }
}
