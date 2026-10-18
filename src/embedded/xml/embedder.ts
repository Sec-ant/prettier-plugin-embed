import type { Doc, Options } from "prettier";
import { builders } from "prettier/doc";
import type { Embedder } from "../../types.js";
import {
  preparePlaceholder,
  prepareTemplate,
  printTemplateExpressions,
  simpleRehydrateDoc,
  wrapEmbeddedDoc,
} from "../utils.js";
import { language } from "./language.js";

const { softline } = builders;

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

  const { text, leadingWhitespaces, trailingWhitespaces } = prepareTemplate(
    node,
    createPlaceholder,
  );

  const expressionDocs = printTemplateExpressions(path, print);

  const doc: Doc[] = [];
  let sliceIndex: number | undefined = 0;
  while (sliceIndex !== undefined) {
    const textFragment = text.slice(sliceIndex);
    if (textFragment.length === 0) {
      break;
    }
    if (
      sliceIndex > 0 &&
      resolvedOptions.xmlWhitespaceSensitivity !== "strict"
    ) {
      doc.push(softline);
    }
    // clear recover index holder
    resolvedOptions.__embeddedXmlFragmentRecoverIndex?.splice(
      0,
      resolvedOptions.__embeddedXmlFragmentRecoverIndex.length,
    );
    let printedText = await textToDoc(textFragment, {
      ...resolvedOptions,
      parser: language,
    });
    const [i1, i2] = resolvedOptions.__embeddedXmlFragmentRecoverIndex ?? [];
    if (i1 === undefined) {
      sliceIndex = undefined;
    } else if (i2 === undefined) {
      sliceIndex += i1;
    } else {
      printedText = textFragment.slice(i1, i2 + 1);
      sliceIndex += i2 + 1;
    }
    doc.push(printedText);
  }

  const contentDoc = simpleRehydrateDoc(doc, placeholderRegex, expressionDocs);

  return wrapEmbeddedDoc(
    contentDoc,
    resolvedOptions,
    commentOrTag,
    leadingWhitespaces,
    trailingWhitespaces,
    resolvedOptions.xmlWhitespaceSensitivity === "strict",
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
