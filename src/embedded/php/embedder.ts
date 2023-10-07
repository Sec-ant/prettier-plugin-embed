import type { Options } from "prettier";
import { builders, utils } from "prettier/doc";
import type { Embedder } from "../../types.js";
import {
  printTemplateExpressions,
  throwIfPluginIsNotFound,
  uuidV4,
} from "../utils.js";
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
    throwIfPluginIsNotFound("@prettier/plugin-php", options, lang);

    const uuid = "$p" + uuidV4().replaceAll("-", "");
    const { node } = path;

    const text = node.quasis
      .map((quasi, index, { length }) =>
        index === length - 1
          ? quasi.value.cooked
          : quasi.value.cooked + `${uuid}${index}`,
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

    const doc = await textToDoc(text.slice(startIndex), {
      parser: "php",
    });

    let multiline = false;
    const contentDoc = mapDoc(doc, (doc) => {
      if (typeof doc !== "string") {
        if (!Array.isArray(doc)) {
          if (doc.type === "group" && doc.break) {
            multiline = true;
          } else if (doc.type === "line" && (doc.hard || doc.literal)) {
            multiline = true;
          }
        }
        return doc;
      }
      const parts = [];
      const components = doc.split(new RegExp("\\" + uuid + "(\\d+)", "g"));
      for (let i = 0; i < components.length; i++) {
        let component = components[i];
        if (i % 2 == 0) {
          if (!component) {
            continue;
          }
          component = component.replaceAll(/([\\`]|\${)/g, "\\$1");
          parts.push(component);
        } else {
          const placeholderIndex = Number(component);
          parts.push(expressionDocs[placeholderIndex]);
        }
      }
      return parts;
    });

    const linebreak = multiline
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
        group([contentDoc]),
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
