import dedent from "dedent";
import type { Options } from "prettier";
import type { builders } from "prettier/doc";
import type { Embedder } from "../../types.js";
import {
  preparePlaceholder,
  prepareTemplate,
  printTemplateExpressions,
  simpleRehydrateDoc,
  wrapEmbeddedDoc,
} from "../utils.js";
import { language } from "./language.js";

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

  const plugin = resolvedOptions.embeddedSqlPlugin ?? "prettier-plugin-sql";

  const { node } = path;

  const { createPlaceholder, placeholderRegex } = preparePlaceholder();

  const { trimmedText, leadingWhitespaces, trailingWhitespaces } =
    prepareTemplate(node, createPlaceholder);

  const expressionDocs = printTemplateExpressions(
    path,
    print,
    resolvedOptions,
    false,
  );
  let contentDoc: builders.Doc[] | builders.DocCommand;

  if (plugin === "prettier-plugin-sql-cst") {
    const doc = await textToDoc(trimmedText, {
      ...resolvedOptions,
      parser: resolvedOptions.embeddedSqlParser ?? "sqlite",
    });
    contentDoc = simpleRehydrateDoc(doc, placeholderRegex, expressionDocs);
  } else {
    const lineBreakBeforeExpressions = new Set(
      node.quasis
        .slice(0, -1)
        .flatMap((quasi, index) =>
          /\n[\t ]*$/.test(quasi.value.raw) ? [index] : [],
        ),
    );
    const doc = await textToDoc(dedent(trimmedText), {
      ...resolvedOptions,
      parser: "sql",
    });
    contentDoc = simpleRehydrateDoc(
      doc,
      placeholderRegex,
      expressionDocs,
      "hardline",
      lineBreakBeforeExpressions,
      resolvedOptions.tabWidth ?? 2,
    );
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
