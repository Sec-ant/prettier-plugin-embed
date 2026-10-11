import type { Options } from "prettier";
import type { Embedder } from "../../types.js";
import {
  printTemplateExpressions,
  randomUUID,
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
    parser: resolvedOptions.embeddedJsonParser ?? "json",
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

function preparePlaceholder() {
  const uuid1 = randomUUID();
  const uuid2 = randomUUID();
  const createPlaceholder = (index: number) => {
    return `'0${uuid1}${index}${uuid2}'`;
  };
  const placeholderRegex = new RegExp(
    `["']?0${uuid1}(\\d+)${uuid2}['"]?`,
    "ig",
  );
  return {
    createPlaceholder,
    placeholderRegex,
  };
}

/**
 * Register the embedder to the EmbeddedEmbedders
 */
declare module "../types.js" {
  interface EmbeddedEmbedders {
    [language]: typeof embedder;
  }
}
