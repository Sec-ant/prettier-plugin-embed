import type { Options, Doc } from "prettier";
import { builders, utils } from "prettier/doc";
import type { Embedder } from "../../types.js";
import {
  printTemplateExpressions,
  throwIfPluginIsNotFound,
  uuidV4,
} from "../utils.js";
import { name } from "./name.js";

const { label, hardline, line, group, indent, softline } = builders;
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
      if (sliceIndex > 0 && options.xmlWhitespaceSensitivity !== "strict") {
        docs.push(softline);
      }
      // clear recover index holder
      options.__embeddedXmlFragmentRecoverIndex?.splice(
        0,
        options.__embeddedXmlFragmentRecoverIndex.length,
      );
      const textFragment = trimmedText.slice(sliceIndex);
      docs.push(
        await textToDoc(textFragment, {
          parser: name,
        }),
      );
    } while (options.__embeddedXmlFragmentRecoverIndex?.length);

    // TODO: do we need top level count?
    // const topLevelCount = docs.length;

    let doc: Doc;
    if (docs.length === 1) {
      doc = docs[0];
    } else {
      doc = group(docs);
    }

    const contentDoc = mapDoc(doc, (doc) => {
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
          // TODO: do we need to support this option?
          // https://github.com/prettier/prettier/blob/d4d4b185e0ddc3e0dd839b873e2ee7fe8131b684/src/language-js/embed/html.js#L58-L60
          // if (options.__embeddedInHtml) {
          //   component = component.replaceAll(/<\/(?=script\b)/gi, "<\\/");
          // }
          parts.push(component);
        } else {
          const placeholderIndex = Number(component);
          parts.push(expressionDocs[placeholderIndex]);
        }
      }
      return parts;
    });

    const linebreak =
      options.xmlWhitespaceSensitivity === "ignore"
        ? hardline
        : leadingWhitespaces && trailingWhitespaces
        ? line
        : null;

    if (linebreak) {
      return group([
        "`",
        indent([linebreak, group(contentDoc)]),
        linebreak,
        "`",
      ]);
    }

    return label(
      { hug: false },
      group([
        "`",
        leadingWhitespaces,
        group(contentDoc),
        trailingWhitespaces,
        "`",
      ]),
    );
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
