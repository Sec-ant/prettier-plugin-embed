import { type Options, type Doc } from "prettier";
import { builders, utils } from "prettier/doc";
import type { Embedder } from "../../types.js";
import {
  printTemplateExpressions,
  throwIfPluginIsNotFound,
  uuidV4,
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

    // TODO: handle leading and trailing whitespaces
    const leadingWhitespaces = text.match(/^\s+/)?.[0] ?? "";
    const trailingWhitespaces = text.match(/\s+$/)?.[0] ?? "";

    // trim whitespaces as a workaround of
    // https://github.com/SAP/xml-tools/issues/248
    const trimmedText = text.slice(
      leadingWhitespaces.length,
      -trailingWhitespaces.length || undefined,
    );

    const expressionDocs = printTemplateExpressions(path, print);

    const docs: Doc[] = [];
    let sliceIndex = 0;
    do {
      sliceIndex += options.__embeddedXmlFragmentRecoverIndex?.[0] ?? 0;
      const dGroup: Doc[] = [];
      if (sliceIndex > 0 && options.xmlWhitespaceSensitivity !== "strict") {
        dGroup.push(softline);
      }
      // clear recover index holder
      options.__embeddedXmlFragmentRecoverIndex?.splice(
        0,
        options.__embeddedXmlFragmentRecoverIndex.length,
      );
      // print the text fragment from the slice index
      const textFragment = trimmedText.slice(sliceIndex);
      dGroup.push(
        await textToDoc(textFragment, {
          parser: name,
        }),
      );
      docs.push(dGroup);
      // if __embeddedXmlFragmentRecoverIndex is not empty
      // we have to run the next pass
    } while (options.__embeddedXmlFragmentRecoverIndex?.length);

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

function preparePlaceholder() {
  const uuid = uuidV4();
  const stub = `${uuid}-`;
  const createPlaceholder = (index: number) => {
    return `${stub}${index}`;
  };
  const placeholderRegex = new RegExp(`${stub}(\\d+)`, "g");
  return {
    createPlaceholder,
    placeholderRegex,
  };
}

declare module "../types.js" {
  interface EmbeddedEmbedders {
    [name]: typeof embedder;
  }
}
