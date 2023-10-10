import { type Options, type Doc } from "prettier";
import { builders, utils } from "prettier/doc";
import type { Embedder } from "../../types.js";
import {
  printTemplateExpressions,
  throwIfPluginIsNotFound,
  preparePlaceholder,
} from "../utils.js";
import { name } from "./name.js";

const { line, group, indent, softline } = builders;
const { mapDoc } = utils;

export const embedder: Embedder<Options> = async (
  textToDoc,
  print,
  path,
  options,
  lang,
) => {
  try {
    throwIfPluginIsNotFound("@prettier/plugin-xml", options, lang);

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

    const docs: Doc[] = [];
    let sliceIndex: number | undefined = 0;
    while (sliceIndex !== undefined) {
      const textFragment = trimmedText.slice(sliceIndex);
      if (textFragment.length === 0) {
        break;
      }
      const dGroup: Doc[] = [];
      if (sliceIndex > 0 && options.xmlWhitespaceSensitivity !== "strict") {
        dGroup.push(softline);
      }
      // clear recover index holder
      options.__embeddedXmlFragmentRecoverIndex?.splice(
        0,
        options.__embeddedXmlFragmentRecoverIndex.length,
      );
      let printedText = await textToDoc(textFragment, { parser: name });
      const [i1, i2] = options.__embeddedXmlFragmentRecoverIndex ?? [];
      if (i1 === undefined) {
        sliceIndex = undefined;
      } else if (i2 === undefined) {
        sliceIndex += i1;
      } else {
        printedText = textFragment.slice(i1, i2 + 1);
        sliceIndex += i2 + 1;
      }
      dGroup.push(printedText);
      docs.push(dGroup);
    }

    const contentDocs = docs.map((doc) =>
      mapDoc(doc, (doc) => {
        if (typeof doc !== "string") {
          return doc;
        }
        const parts = [];
        const components = doc.split(placeholderRegex);
        for (let i = 0; i < components.length; i++) {
          let component = components[i];
          if (i % 2 == 0) {
            if (!component) {
              continue;
            }
            component = component.replaceAll(/([\\`]|\${)/g, "\\$1");
            // TODO: do we need the counterpart of options.__embeddedInHtml in xml?
            // https://github.com/prettier/prettier/blob/5cfb76ee50cf286cab267cf3cb7a26e749c995f7/src/language-js/embed/html.js#L58-L60
            parts.push(component);
          } else {
            const placeholderIndex = Number(component);
            parts.push(expressionDocs[placeholderIndex]);
          }
        }
        return parts;
      }),
    );

    if (
      options.xmlWhitespaceSensitivity === "strict" ||
      options.preserveEmbeddedExteriorWhitespaces?.includes(lang)
    ) {
      // TODO: should we label the doc with { hug: false } ?
      // https://github.com/prettier/prettier/blob/5cfb76ee50cf286cab267cf3cb7a26e749c995f7/src/language-js/embed/html.js#L88
      return group([
        "`",
        leadingWhitespaces,
        options.noEmbeddedMultiLineIndentation?.includes(lang)
          ? [group(contentDocs)]
          : indent([group(contentDocs)]),
        trailingWhitespaces,
        "`",
      ]);
    }

    const leadingLineBreak = leadingWhitespaces.length ? line : softline;
    const trailingLineBreak = trailingWhitespaces.length ? line : softline;

    return group([
      "`",
      options.noEmbeddedMultiLineIndentation?.includes(lang)
        ? [leadingLineBreak, group(contentDocs)]
        : indent([leadingLineBreak, group(contentDocs)]),
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
