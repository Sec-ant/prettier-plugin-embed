import type { Options } from "prettier";
import { builders } from "prettier/doc";
import type { Embedder } from "../../types.js";
import {
  preparePlaceholder,
  printTemplateExpressions,
  simpleRehydrateDoc,
} from "../utils.js";
import { language } from "./language.js";

const { line, group, indent, softline } = builders;

export const embedder: Embedder<Options> = async (
  textToDoc,
  print,
  path,
  options,
  { identifier, embeddedOverrideOptions },
) => {
  options = {
    ...options,
    ...embeddedOverrideOptions,
  };

  const { node } = path;

  const { createPlaceholder, placeholderRegex } = preparePlaceholder();

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
    ...options,
    parser: options.embeddedTsParser ?? "typescript",
    // set filepath to undefined to enable jsx auto detection:
    // https://github.com/prettier/prettier/blob/427a84d24203e2d54160cde153a1e6a6390fe65a/src/language-js/parse/typescript.js#L49-L53
    filepath: undefined,
  });

  const contentDoc = simpleRehydrateDoc(doc, placeholderRegex, expressionDocs);

  if (options.preserveEmbeddedExteriorWhitespaces?.includes(identifier)) {
    // TODO: should we label the doc with { hug: false } ?
    // https://github.com/prettier/prettier/blob/5cfb76ee50cf286cab267cf3cb7a26e749c995f7/src/language-js/embed/html.js#L88
    return group([
      "`",
      leadingWhitespaces,
      options.noEmbeddedMultiLineIndentation?.includes(identifier)
        ? [group(contentDoc)]
        : indent([group(contentDoc)]),
      trailingWhitespaces,
      "`",
    ]);
  }

  const leadingLineBreak = leadingWhitespaces.length ? line : softline;
  const trailingLineBreak = trailingWhitespaces.length ? line : softline;

  return group([
    "`",
    options.noEmbeddedMultiLineIndentation?.includes(identifier)
      ? [leadingLineBreak, group(contentDoc)]
      : indent([leadingLineBreak, group(contentDoc)]),
    trailingLineBreak,
    "`",
  ]);
};

/**
 * Register the embedder to the EmbeddedEmbedders
 */
declare module "../types.js" {
  interface EmbeddedEmbedders {
    [language]: typeof embedder;
  }
}
