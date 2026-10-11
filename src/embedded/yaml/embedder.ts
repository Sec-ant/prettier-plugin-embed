import type { Options } from "prettier";
import type { Embedder } from "../../types.js";
import {
  escapeRegExp,
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

  const { node } = path;

  const { createPlaceholder, placeholderRegex } = preparePlaceholder();

  const { trimmedText, leadingWhitespaces, trailingWhitespaces } =
    prepareTemplate(node, createPlaceholder);
  const templateIndent = leadingWhitespaces.slice(
    leadingWhitespaces.lastIndexOf("\n") + 1,
  );

  const expressionDocs = printTemplateExpressions(path, print);

  const dedentedText = templateIndent
    ? trimmedText.replace(
        new RegExp(`(\\r?\\n)${escapeRegExp(templateIndent)}`, "g"),
        "$1",
      )
    : trimmedText;

  const doc = await textToDoc(dedentedText, {
    ...resolvedOptions,
    parser: "yaml",
  });

  const contentDoc = simpleRehydrateDoc(doc, placeholderRegex, expressionDocs);

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
