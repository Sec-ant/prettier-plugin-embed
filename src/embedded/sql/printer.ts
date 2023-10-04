import type { Options } from "prettier";
import { builders, utils } from "prettier/doc";
import { SqlBaseOptions } from "prettier-plugin-sql";
import { v4 } from "uuid";
import type { EmbeddedPrinter } from "../../types.js";
import { printTemplateExpressions } from "../utils.js";
import {
  NODE_SQL_PARSER_DATABASES,
  type NodeSqlParserDataBase,
  SQL_FORMATTER_LANGUAGES,
  type SqlFormatterLanguage,
} from "./types.js";

const { label, hardline, group } = builders;
const { mapDoc } = utils;

export const embeddedPrinter: EmbeddedPrinter<Options> = async (
  textToDoc,
  print,
  path,
  options,
  lang,
) => {
  try {
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

    lang = lang.toLowerCase();

    let optionsOverride: SqlBaseOptions = {};

    // TODO: lang auto fallback
    if (options.formatter === "sql-formatter") {
      if (SQL_FORMATTER_LANGUAGES.includes(lang as SqlFormatterLanguage)) {
        optionsOverride = {
          formatter: "sql-formatter",
          language: lang,
        };
      } else if (
        NODE_SQL_PARSER_DATABASES.includes(lang as NodeSqlParserDataBase)
      ) {
        optionsOverride = {
          formatter: "node-sql-parser",
          database: lang,
        };
      } else {
        throw new SyntaxError(`Unrecognized language: ${lang}`);
      }
    } else {
      if (NODE_SQL_PARSER_DATABASES.includes(lang as NodeSqlParserDataBase)) {
        optionsOverride = {
          formatter: "node-sql-parser",
          database: lang,
        };
      } else if (
        SQL_FORMATTER_LANGUAGES.includes(lang as SqlFormatterLanguage)
      ) {
        optionsOverride = {
          formatter: "sql-formatter",
          language: lang,
        };
      } else {
        throw new SyntaxError(`Unrecognized language: ${lang}`);
      }
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
      const components = doc.split(new RegExp(uuid + "(\\d+)", "g"));
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

    // TODO: multiline indentation
    const linebreak = hardline;

    if (linebreak) {
      return group(["`", linebreak, group(contentDoc), linebreak, "`"]);
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
