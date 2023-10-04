import type { Parser } from "prettier";
import { parse as xmlToolsParse } from "@xml-tools/parser";

type CstNode = ReturnType<typeof xmlToolsParse>["cst"];

interface Position {
  line: number;
  column: number;
}

interface Loc {
  start: Position;
  end: Position;
}

interface ErrorOptions {
  loc: Loc;
}

function createError(message: string, options: ErrorOptions) {
  // TODO: Use `Error.prototype.cause` when we drop support for Node.js<18.7.0

  // Construct an error similar to the ones thrown by Prettier.
  const error = new SyntaxError(
    message +
      " (" +
      options.loc.start.line +
      ":" +
      options.loc.start.column +
      ")",
  );

  return Object.assign(error, options);
}

export const embeddedParser: Parser<CstNode> = {
  parse(text: string) {
    const { lexErrors, parseErrors, cst } = xmlToolsParse(text);

    // If there are any lexical errors, throw the first of them as an error.
    if (lexErrors.length > 0) {
      const lexError = lexErrors[0];
      throw createError(lexError.message, {
        loc: {
          start: { line: lexError.line, column: lexError.column },
          end: {
            line: lexError.line,
            column: lexError.column + lexError.length,
          },
        },
      });
    }

    // TODO: recover from some errors to support xml fragments

    // If there are any parse errors, throw the first of them as an error.
    if (parseErrors.length > 0) {
      const parseError = parseErrors[0];
      throw createError(parseError.message, {
        loc: {
          start: {
            line: parseError.token.startLine ?? NaN,
            column: parseError.token.startColumn ?? NaN,
          },
          end: {
            line: parseError.token.endLine ?? NaN,
            column: parseError.token.endColumn ?? NaN,
          },
        },
      });
    }

    // Otherwise return the CST.
    return cst;
  },
  astFormat: "xml",
  locStart(node: CstNode) {
    return node.location!.startOffset;
  },
  locEnd(node: CstNode) {
    return node.location!.endOffset ?? NaN;
  },
};
