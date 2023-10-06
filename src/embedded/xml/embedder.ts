import type { Options } from "prettier";
import { builders, utils } from "prettier/doc";
import { v4 } from "uuid";
import type { Embedder } from "../../types.js";
import { printTemplateExpressions, throwIfPluginIsNotFound } from "../utils.js";
import { name } from "./name.js";

const { label, hardline, line, group, indent } = builders;
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

    const uuid = v4();
    const { node } = path;

    const text = node.quasis
      .map((quasi, index, { length }) =>
        index === length - 1
          ? quasi.value.cooked
          : quasi.value.cooked + `${uuid}-${index}`,
      )
      .join("");

    let leadingWhitespace = "";
    let startIndex = 0;
    const match = /^\s+/.exec(text);
    if (match) {
      startIndex = match.index + match[0].length;
      leadingWhitespace = " ";
    }

    const trailingWhitespace = /\s$/.test(text) ? " " : "";

    const expressionDocs = printTemplateExpressions(path, print);

    // TODO: do we need topLevelCount?
    // https://github.com/prettier/prettier/blob/d4d4b185e0ddc3e0dd839b873e2ee7fe8131b684/src/language-js/embed/html.js#L36-L42
    // const topLevelCount = 2;

    // TODO: work around
    // trim whitespaces as a workaround of
    // https://github.com/SAP/xml-tools/issues/248
    const doc = await textToDoc(text.slice(startIndex), {
      parser: name,
    });

    const contentDoc = mapDoc(doc, (doc) => {
      if (typeof doc !== "string") {
        return doc;
      }
      const parts = [];
      const components = doc.split(new RegExp(uuid + "-(\\d+)", "g"));
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
        : leadingWhitespace && trailingWhitespace
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
        leadingWhitespace,
        group(contentDoc),
        trailingWhitespace,
        "`",
      ]),
    );
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
