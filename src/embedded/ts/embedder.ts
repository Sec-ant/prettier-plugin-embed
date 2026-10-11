import type { Options } from "prettier";
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

  const { node } = path;

  const { createPlaceholder, placeholderRegex } = preparePlaceholder();

  const { trimmedText, leadingWhitespaces, trailingWhitespaces } =
    prepareTemplate(node, createPlaceholder);

  const expressionDocs = printTemplateExpressions(path, print);

  const doc = await textToDoc(trimmedText, {
    ...resolvedOptions,
    parser: resolvedOptions.embeddedTsParser ?? "typescript",
    // set filepath to undefined to enable jsx auto detection:
    // https://github.com/prettier/prettier/blob/427a84d24203e2d54160cde153a1e6a6390fe65a/src/language-js/parse/typescript.js#L49-L53
    filepath: undefined,
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
