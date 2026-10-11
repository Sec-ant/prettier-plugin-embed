import type { Options } from "prettier";
import type { Embedder } from "../../types.js";
import {
  preparePlaceholder,
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

  // https://github.com/prettier/prettier/blob/3bfabd012873e5022f341aca75566966d91870f1/src/language-css/utils/index.js#L206-L208
  const { createPlaceholder, placeholderRegex } = preparePlaceholder(
    "@prettier-placeholder",
  );

  const text = node.quasis
    .map((quasi, index, { length }) =>
      index === length - 1
        ? quasi.value.cooked
        : quasi.value.cooked + createPlaceholder(index),
    )
    .join("");

  const leadingWhitespaces = text.match(/^\s+/)?.[0] ?? "";
  const trailingWhitespaces = text.match(/\s+$/)?.[0] ?? "";

  const trimmedText = text.slice(
    leadingWhitespaces.length,
    -trailingWhitespaces.length || undefined,
  );

  const expressionDocs = printTemplateExpressions(path, print);

  const doc = await textToDoc(trimmedText, {
    ...resolvedOptions,
    parser: resolvedOptions.embeddedCssParser ?? "scss",
  });

  const contentDoc = simpleRehydrateDoc(
    doc,
    placeholderRegex,
    expressionDocs,
    // Use literalline to preserve original indentation in CSS comments
    // https://github.com/prettier/prettier/blob/3bfabd012873e5022f341aca75566966d91870f1/src/language-js/embed/css.js#L52
    "literalline",
  );

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
