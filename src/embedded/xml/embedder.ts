import { type Options, type Doc } from "prettier";
import { builders } from "prettier/doc";
import type { Embedder } from "../../types.js";
import {
  printTemplateExpressions,
  throwIfPluginIsNotFound,
  preparePlaceholder,
  simpleRehydrateDoc,
  parseEmbeddedOverrideOptions,
} from "../utils.js";
import { embeddedLanguage } from "./embedded-language.js";

const { line, group, indent, softline } = builders;

export const embedder: Embedder<Options> = async (
  textToDoc,
  print,
  path,
  options,
  identifier,
) => {
  throwIfPluginIsNotFound("@prettier/plugin-xml", options, identifier);

  options = {
    ...options,
    ...(await parseEmbeddedOverrideOptions(
      options.embeddedOverrides,
      identifier,
      options.filepath,
    )),
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

  const doc: Doc[] = [];
  let sliceIndex: number | undefined = 0;
  while (sliceIndex !== undefined) {
    const textFragment = trimmedText.slice(sliceIndex);
    if (textFragment.length === 0) {
      break;
    }
    if (sliceIndex > 0 && options.xmlWhitespaceSensitivity !== "strict") {
      doc.push(softline);
    }
    // clear recover index holder
    options.__embeddedXmlFragmentRecoverIndex?.splice(
      0,
      options.__embeddedXmlFragmentRecoverIndex.length,
    );
    let printedText = await textToDoc(textFragment, {
      ...options,
      parser: embeddedLanguage,
    });
    const [i1, i2] = options.__embeddedXmlFragmentRecoverIndex ?? [];
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

  if (
    options.xmlWhitespaceSensitivity === "strict" ||
    options.preserveEmbeddedExteriorWhitespaces?.includes(identifier)
  ) {
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

declare module "../types.js" {
  interface EmbeddedEmbedders {
    [embeddedLanguage]: typeof embedder;
  }
}
