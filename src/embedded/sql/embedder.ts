import type { Options } from "prettier";
import { builders, utils } from "prettier/doc";
import type { SqlBaseOptions } from "prettier-plugin-sql";
import { v4 } from "uuid";
import type { Embedder } from "../../types.js";
import { printTemplateExpressions, throwIfPluginIsNotFound } from "../utils.js";
import {
  NODE_SQL_PARSER_DATABASES,
  type NodeSqlParserDataBase,
  SQL_FORMATTER_LANGUAGES,
  type SqlFormatterLanguage,
} from "./option.js";
import { name } from "./name.js";

const { label, hardline, group, line, indent } = builders;
const { mapDoc } = utils;

export const embedder: Embedder<Options> = async (
  textToDoc,
  print,
  path,
  options,
  lang,
  langs,
) => {
  try {
    throwIfPluginIsNotFound("prettier-plugin-sql", options, lang);

    const uuid = "p" + v4().replaceAll("-", "");
    const { node } = path;

    const text = node.quasis
      .map((quasi, index, { length }) =>
        index === length - 1
          ? quasi.value.cooked
          : quasi.value.cooked + `${uuid}${index}`,
      )
      .join("");

    const leadingWhitespace = /^\s/.test(text) ? " " : "";
    const trailingWhitespace = /\s$/.test(text) ? " " : "";

    const expressionDocs = printTemplateExpressions(path, print);

    const optionsOverride = getOptionsOverride(options, lang, langs);
    if (typeof optionsOverride === "undefined") {
      throw new SyntaxError(`Unrecognized language: ${lang}`);
    }

    const doc = await textToDoc(text, {
      parser: "sql",
      ...optionsOverride,
    });

    let multiline = false;
    const contentDoc = mapDoc(doc, (doc) => {
      if (typeof doc !== "string") {
        return doc;
      }
      const parts = [];
      const components = doc.split(new RegExp(uuid + "(\\d+)", "g"));
      for (let i = 0; i < components.length; i++) {
        let component = components[i];
        if (i % 2 == 0) {
          if (!component) {
            continue;
          }
          component = component.replaceAll(/([\\`]|\${)/g, "\\$1");
          component
            .split(/(\n)/)
            .forEach((c) =>
              c === "\n"
                ? ((multiline = true), parts.push(hardline))
                : parts.push(c),
            );
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

type Formatter = Exclude<Options["formatter"], undefined>;

const testFormatterLangs: Record<Formatter, (lang: string) => boolean> = {
  "sql-formatter": (lang: string) =>
    SQL_FORMATTER_LANGUAGES.includes(lang as SqlFormatterLanguage),
  "node-sql-parser": (lang: string) =>
    NODE_SQL_PARSER_DATABASES.includes(lang as NodeSqlParserDataBase),
};

function getOptionsOverrideByFormatters(
  lang: string,
  formatters: Formatter[],
): SqlBaseOptions | undefined {
  for (const formatter of formatters) {
    if (testFormatterLangs[formatter](lang)) {
      return {
        formatter,
        language: lang,
      };
    }
  }
}

function getOptionsOverrideByFormattersWithFallback(
  lang: string,
  langs: string[],
  formatters: Formatter[],
): SqlBaseOptions | undefined {
  let optionsOverride = getOptionsOverrideByFormatters(lang, formatters);
  if (optionsOverride) {
    return optionsOverride;
  }
  const index = langs.indexOf(lang);
  for (let i = index - 1; i >= 0; --i) {
    optionsOverride = getOptionsOverrideByFormatters(langs[i], formatters);
    if (optionsOverride) {
      return optionsOverride;
    }
  }
}

function getOptionsOverride(
  options: Options,
  lang: string,
  langs: string[],
): SqlBaseOptions | undefined {
  if (options.formatter === "sql-formatter") {
    return getOptionsOverrideByFormattersWithFallback(lang, langs, [
      "sql-formatter",
      "node-sql-parser",
    ]);
  } else {
    return getOptionsOverrideByFormattersWithFallback(lang, langs, [
      "node-sql-parser",
      "sql-formatter",
    ]);
  }
}

declare module "../types.js" {
  interface EmbeddedEmbedders {
    [name]: typeof embedder;
  }
}
