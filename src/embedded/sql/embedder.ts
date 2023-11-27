import type { Options } from "prettier";
import type { SqlBaseOptions } from "prettier-plugin-sql";
import { builders, utils } from "prettier/doc";
import type { Embedder } from "../../types.js";
import {
  preparePlaceholder,
  printTemplateExpressions,
  throwIfPluginIsNotFound,
} from "../utils.js";
import { embeddedLanguage } from "./embedded-language.js";
import {
  NODE_SQL_PARSER_DATABASES,
  SQL_FORMATTER_LANGUAGES,
  type NodeSqlParserDataBase,
  type SqlFormatterLanguage,
} from "./options.js";

const { hardline, group, line, softline, indent } = builders;
const { mapDoc } = utils;

export const embedder: Embedder<Options> = async (
  textToDoc,
  print,
  path,
  options,
  { identifier, identifiers, embeddedOverrideOptions },
) => {
  throwIfPluginIsNotFound("prettier-plugin-sql", options, identifier);

  options = {
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

  const expressionDocs = printTemplateExpressions(path, print);

  const optionsOverride = getOptionsOverride(options, identifier, identifiers);
  if (typeof optionsOverride === "undefined") {
    throw new SyntaxError(`Unrecognized identifier: ${identifier}`);
  }

  const doc = await textToDoc(text, {
    ...options,
    parser: "sql",
    ...optionsOverride,
    ...embeddedOverrideOptions,
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
          .forEach((c) => (c === "\n" ? parts.push(hardline) : parts.push(c)));
      } else {
        const placeholderIndex = Number(component);
        parts.push(expressionDocs[placeholderIndex]);
      }
    }
    return parts;
  });

  if (options.preserveEmbeddedExteriorWhitespaces?.includes(identifier)) {
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

type Formatter = Exclude<Options["formatter"], undefined>;

const testFormatterIdentifiers: Record<
  Formatter,
  (identifier: string) => boolean
> = {
  "sql-formatter": (identifier: string) =>
    SQL_FORMATTER_LANGUAGES.includes(identifier as SqlFormatterLanguage),
  "node-sql-parser": (identifier: string) =>
    NODE_SQL_PARSER_DATABASES.includes(identifier as NodeSqlParserDataBase),
  // TODO: This seems not implemented yet
  "sql-cst": (identifier: string) =>
    SQL_FORMATTER_LANGUAGES.includes(identifier as SqlFormatterLanguage),
};

function getOptionsOverrideByFormatters(
  identifier: string,
  formatters: Formatter[],
): SqlBaseOptions | undefined {
  for (const formatter of formatters) {
    if (testFormatterIdentifiers[formatter](identifier)) {
      switch (formatter) {
        case "sql-formatter":
          return {
            formatter,
            language: identifier,
          };
        case "node-sql-parser":
          return {
            formatter,
            database: identifier,
          };
      }
    }
  }
}

function getOptionsOverrideByFormattersWithFallback(
  identifier: string,
  identifiers: string[],
  formatters: Formatter[],
): SqlBaseOptions | undefined {
  let optionsOverride = getOptionsOverrideByFormatters(identifier, formatters);
  if (optionsOverride) {
    return optionsOverride;
  }
  const index = identifiers.indexOf(identifier);
  for (let i = index - 1; i >= 0; --i) {
    optionsOverride = getOptionsOverrideByFormatters(
      identifiers[i],
      formatters,
    );
    if (optionsOverride) {
      return optionsOverride;
    }
  }
}

function getOptionsOverride(
  options: Options,
  identifier: string,
  identifiers: string[],
): SqlBaseOptions | undefined {
  const formatter = options.formatter ?? "sql-formatter";
  switch (formatter) {
    case "sql-formatter":
      return getOptionsOverrideByFormattersWithFallback(
        identifier,
        identifiers,
        ["sql-formatter", "node-sql-parser"],
      );
    case "node-sql-parser":
      return getOptionsOverrideByFormattersWithFallback(
        identifier,
        identifiers,
        ["node-sql-parser", "sql-formatter"],
      );
    case "sql-cst":
      // TODO: This seems not implemented yet
      return getOptionsOverrideByFormattersWithFallback(
        identifier,
        identifiers,
        ["sql-formatter", "node-sql-parser"],
      );
    default:
      // guard
      formatter satisfies never;
      // by falling back to the sql-formatter
      // we use a rather forgiving strategy
      // to parse the options
      return getOptionsOverrideByFormattersWithFallback(
        identifier,
        identifiers,
        ["sql-formatter", "node-sql-parser"],
      );
  }
}

declare module "../types.js" {
  interface EmbeddedEmbedders {
    [embeddedLanguage]: typeof embedder;
  }
}
