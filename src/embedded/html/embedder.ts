import type { Options } from "prettier";
import { utils } from "prettier/doc";
import type { Embedder } from "../../types.js";
import {
  preparePlaceholder,
  prepareTemplate,
  printTemplateExpressions,
  wrapEmbeddedDoc,
} from "../utils.js";
import { language } from "./language.js";

const { mapDoc } = utils;

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
    parser: resolvedOptions.embeddedHtmlParser ?? "html",
  });

  const contentDoc = mapDoc(doc, (doc) => {
    if (typeof doc !== "string") {
      return doc;
    }
    const parts = [];
    const components = doc.split(placeholderRegex);
    for (let i = 0; i < components.length; i++) {
      let component = components[i]!;
      if (i % 2 === 0) {
        if (!component) {
          continue;
        }
        component = component.replaceAll(/([\\`]|\${)/g, "\\$1");
        if (resolvedOptions.__embeddedInHtml) {
          component = component.replaceAll(/<\/(?=script\b)/gi, "<\\/");
        }
        parts.push(component);
      } else {
        const placeholderIndex = Number(component);
        parts.push(expressionDocs[placeholderIndex]!);
      }
    }
    return parts;
  });

  return wrapEmbeddedDoc(
    contentDoc,
    resolvedOptions,
    commentOrTag,
    leadingWhitespaces,
    trailingWhitespaces,
    resolvedOptions.htmlWhitespaceSensitivity === "strict" ||
      resolvedOptions.htmlWhitespaceSensitivity === "css",
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
