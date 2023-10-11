import type { Options } from "prettier";
import { builders, utils } from "prettier/doc";
import type { SqlBaseOptions } from "prettier-plugin-sql";
import type { Embedder } from "../../types.js";
import {
  printTemplateExpressions,
  throwIfPluginIsNotFound,
  preparePlaceholder,
} from "../utils.js";
import {
  NODE_SQL_PARSER_DATABASES,
  type NodeSqlParserDataBase,
  SQL_FORMATTER_LANGUAGES,
  type SqlFormatterLanguage,
} from "./options.js";
import { name } from "./name.js";

const { hardline, group, line, softline, indent } = builders;
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

    const expressionDocs = printTemplateExpressions(path, print);

    const optionsOverride = getOptionsOverride(options, lang, langs);
    if (typeof optionsOverride === "undefined") {
      throw new SyntaxError(`Unrecognized language: ${lang}`);
    }

    const doc = await textToDoc(text, {
      parser: "sql",
      ...optionsOverride,
    });

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
          component
            .split(/(\n)/)
            .forEach((c) =>
              c === "\n" ? parts.push(hardline) : parts.push(c),
            );
        } else {
          const placeholderIndex = Number(component);
          parts.push(expressionDocs[placeholderIndex]);
        }
      }
      return parts;
    });

    if (options.preserveEmbeddedExteriorWhitespaces?.includes(lang)) {
      // TODO: should we label the doc with { hug: false } ?
      // https://github.com/prettier/prettier/blob/5cfb76ee50cf286cab267cf3cb7a26e749c995f7/src/language-js/embed/html.js#L88
      return group([
        "`",
        leadingWhitespaces,
        options.noEmbeddedMultiLineIndentation?.includes(lang)
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
      options.noEmbeddedMultiLineIndentation?.includes(lang)
        ? [leadingLineBreak, group(contentDoc)]
        : indent([leadingLineBreak, group(contentDoc)]),
      trailingLineBreak,
      "`",
    ]);
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
      switch (formatter) {
        case "sql-formatter":
          return {
            formatter,
            language: lang,
          };
        case "node-sql-parser":
          return {
            formatter,
            database: lang,
          };
      }
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
  const formatter = options.formatter ?? "sql-formatter";
  switch (formatter) {
    case "sql-formatter":
      return getOptionsOverrideByFormattersWithFallback(lang, langs, [
        "sql-formatter",
        "node-sql-parser",
      ]);
    case "node-sql-parser":
      return getOptionsOverrideByFormattersWithFallback(lang, langs, [
        "node-sql-parser",
        "sql-formatter",
      ]);
    default:
      // guard
      formatter satisfies never;
      // by falling back to the sql-formatter
      // we use a rather forgiving strategy
      // to parse the options
      return getOptionsOverrideByFormattersWithFallback(lang, langs, [
        "sql-formatter",
        "node-sql-parser",
      ]);
  }
}

declare module "../types.js" {
  interface EmbeddedEmbedders {
    [name]: typeof embedder;
  }
}
