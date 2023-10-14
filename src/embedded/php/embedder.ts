import type { Options } from "prettier";
import { builders } from "prettier/doc";
import type { Embedder } from "../../types.js";
import {
  printTemplateExpressions,
  throwIfPluginIsNotFound,
  preparePlaceholder,
  simpleRehydrateDoc,
} from "../utils.js";
import { name } from "./name.js";

const { line, group, indent, softline } = builders;

export const embedder: Embedder<Options> = async (
  textToDoc,
  print,
  path,
  options,
  lang,
) => {
  try {
    throwIfPluginIsNotFound("@prettier/plugin-php", options, lang);

    const { node } = path;

    const { createPlaceholder, placeholderRegex } = preparePlaceholder("$p");

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
      parser: "php",
    });

    const contentDoc = simpleRehydrateDoc(
      doc,
      placeholderRegex,
      expressionDocs,
    );

    if (options.preserveEmbeddedExteriorWhitespaces?.includes(lang)) {
      // TODO: should we label the doc with { hug: false } ?
      // https://github.com/prettier/prettier/blob/5cfb76ee50cf286cab267cf3cb7a26e749c995f7/src/language-js/embed/html.js#L88
      return group([
        "`",
        leadingWhitespaces,
        options.noEmbeddedMultiLineIndentation?.includes(lang)
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
      options.noEmbeddedMultiLineIndentation?.includes(lang)
        ? [leadingLineBreak, group(contentDoc)]
        : indent([leadingLineBreak, group(contentDoc)]),
      trailingLineBreak,
      "`",
    ]);
  } catch (e) {
    console.error(e);
    throw e;
  }
};

declare module "../types.js" {
  interface EmbeddedEmbedders {
    [name]: typeof embedder;
  }
}
