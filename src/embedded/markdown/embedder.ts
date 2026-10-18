import type { Options } from "prettier";
import { builders } from "prettier/doc";
import type { Embedder } from "../../types.js";
import {
  preparePlaceholder,
  prepareTemplate,
  printTemplateExpressions,
  removeTemplateIndentation,
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

  const { trimmedText, leadingWhitespaces, trailingWhitespaces } =
    prepareTemplate(node, createPlaceholder);

  const expressionDocs = printTemplateExpressions(path, print);

  // used to rely on the dedent package here but caused issue with semantic indentation when
  // noEmbeddedMultiLineIndentation is on => use a custom indentation removal for now.
  // https://github.com/Sec-ant/prettier-plugin-embed/issues/181
  const dedentedText = removeTemplateIndentation(
    trimmedText,
    leadingWhitespaces,
  );

  const doc = await textToDoc(dedentedText, {
    ...resolvedOptions,
    parser: resolvedOptions.embeddedMarkdownParser ?? "markdown",
    // this will change the code fence delimiter from ``` to ~~~
    // https://github.com/prettier/prettier/blob/1079517b32e5bb145afa7acba448af51f8a7b6e6/src/language-markdown/embed.js#L15
    __inJsTemplate: true,
  });

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
