import dedent from "dedent";
import type { Options } from "prettier";
import { builders } from "prettier/doc.js";
import type { Embedder } from "../../types.js";
import {
  preparePlaceholder,
  printTemplateExpressions,
  simpleRehydrateDoc,
} from "../utils.js";
import { language } from "./language.js";

const { line, group, indent, softline, dedentToRoot, literalline } = builders;

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

  const doc = await textToDoc(
    // use `dedent` to fix unstable embedded markdown indentation with the `useTabs` option
    // https://github.com/Sec-ant/prettier-plugin-embed/pull/91#issuecomment-1963760555
    // https://github.com/prettier/prettier/blob/1079517b32e5bb145afa7acba448af51f8a7b6e6/src/language-js/embed/markdown.js#L15-L19
    dedent(trimmedText),
    {
      ...resolvedOptions,
      parser: resolvedOptions.embeddedMarkdownParser ?? "markdown",
      // this will change the code fence delimiter from ``` to ~~~
      // https://github.com/prettier/prettier/blob/1079517b32e5bb145afa7acba448af51f8a7b6e6/src/language-markdown/embed.js#L15
      __inJsTemplate: true,
    },
  );

  const contentDoc = simpleRehydrateDoc(
    doc,
    placeholderRegex,
    expressionDocs,
    "hardline",
  );

  if (
    resolvedOptions.preserveEmbeddedExteriorWhitespaces?.includes(commentOrTag)
  ) {
    // TODO: should we label the doc with { hug: false } ?
    // https://github.com/prettier/prettier/blob/5cfb76ee50cf286cab267cf3cb7a26e749c995f7/src/language-js/embed/html.js#L88
    return group([
      "`",
      leadingWhitespaces,
      resolvedOptions.noEmbeddedMultiLineIndentation?.includes(commentOrTag)
        ? dedentToRoot(group(contentDoc))
        : indent([group(contentDoc)]),
      trailingWhitespaces,
      "`",
    ]);
  }

  const leadingLineBreak = leadingWhitespaces.length ? line : softline;
  const trailingLineBreak = trailingWhitespaces.length ? line : softline;

  // When noEmbeddedMultiLineIndentation is set, use dedentToRoot to prevent
  // any indentation from being added to the markdown content.
  // This matches Prettier's native behavior for markdown in template literals.
  // https://github.com/prettier/prettier/blob/main/src/language-js/embed/markdown.js
  if (resolvedOptions.noEmbeddedMultiLineIndentation?.includes(commentOrTag)) {
    return ["`", literalline, dedentToRoot(contentDoc), softline, "`"];
  }

  return group([
    "`",
    indent([leadingLineBreak, group(contentDoc)]),
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
