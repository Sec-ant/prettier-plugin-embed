import type { Doc, Options } from "prettier";
import type { Embedder } from "../../types.js";
import {
  preparePlaceholder,
  prepareTemplate,
  printTemplateExpressions,
  simpleRehydrateDoc,
  wrapEmbeddedDoc,
} from "../utils.js";
import { language } from "./language.js";

const EXPRESSION_LINE_BREAK_PATTERN = /\n[\t ]*$/;

export const embedder: Embedder<Options> = async (
  textToDoc,
  print,
  path,
  options,
  { commentOrTag, embeddedOverrideOptions },
) => {
  const resolvedOptions = {
    ...options,
    ...embeddedOverrideOptions,
  };

  const hasParser = (parser: string) =>
    resolvedOptions.plugins?.some(
      (plugin) =>
        typeof plugin === "object" &&
        plugin !== null &&
        "parsers" in plugin &&
        plugin.parsers?.[parser],
    );
  const plugin =
    resolvedOptions.embeddedSqlPlugin ??
    (!hasParser("sql") &&
    hasParser(resolvedOptions.embeddedSqlParser ?? "sqlite")
      ? "prettier-plugin-sql-cst"
      : "prettier-plugin-sql");

  const { node } = path;

  const { createPlaceholder, placeholderRegex } = preparePlaceholder();

  const { text, leadingWhitespaces, trailingWhitespaces } = prepareTemplate(
    node,
    createPlaceholder,
  );

  const expressionDocs = printTemplateExpressions(
    path,
    print,
    resolvedOptions,
    false,
  );
  let contentDoc: Doc;

  if (plugin === "prettier-plugin-sql-cst") {
    const doc = await textToDoc(text, {
      ...resolvedOptions,
      parser: resolvedOptions.embeddedSqlParser ?? "sqlite",
    });
    contentDoc = simpleRehydrateDoc(doc, placeholderRegex, expressionDocs);
  } else {
    const lineBreakBeforeExpressions = new Set<number>();
    for (let index = 0; index < node.expressions.length; index++) {
      if (EXPRESSION_LINE_BREAK_PATTERN.test(node.quasis[index]!.value.raw)) {
        lineBreakBeforeExpressions.add(index);
      }
    }
    const doc = await textToDoc(text, {
      ...resolvedOptions,
      parser: "sql",
    });
    contentDoc = simpleRehydrateDoc(doc, placeholderRegex, expressionDocs, {
      lineBreakBeforeExpressions,
      interpolationTabWidth: resolvedOptions.tabWidth ?? 2,
    });
  }

  return wrapEmbeddedDoc(
    contentDoc,
    resolvedOptions,
    commentOrTag,
    leadingWhitespaces,
    trailingWhitespaces,
  );
};

/**
 * Register the embedder to the EmbeddedEmbedders
 */
declare module "../types.js" {
  interface EmbeddedEmbedders {
    [language]: typeof embedder;
  }
}
