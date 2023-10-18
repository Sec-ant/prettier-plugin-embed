import type { Options } from "prettier";
import { builders } from "prettier/doc";
import type { Embedder } from "../../types.js";
import {
  printTemplateExpressions,
  throwIfPluginIsNotFound,
  preparePlaceholder,
  simpleRehydrateDoc,
} from "../utils.js";
import { embeddedLanguage } from "./embedded-language.js";
import {
  RUBY_PARSER_IDENTIFIERS,
  RBS_PARSER_IDENTIFIERS,
  HAML_PARSER_IDENTIFIERS,
  type RubyParserIdentifier,
  type RbsParserIdentifier,
  type HamlParserIdentifier,
  type RubyParser,
} from "./options.js";

const { line, group, indent, softline } = builders;

export const embedder: Embedder<Options> = async (
  textToDoc,
  print,
  path,
  options,
  identifier,
  identifiers,
) => {
  try {
    throwIfPluginIsNotFound("@prettier/plugin-ruby", options, identifier);

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

    const parser = getParser(identifier, identifiers);
    if (typeof parser === "undefined") {
      throw new SyntaxError(`Unrecognized identifier: ${identifier}`);
    }

    const doc = await textToDoc(trimmedText, {
      parser,
    });

    const contentDoc = simpleRehydrateDoc(
      doc,
      placeholderRegex,
      expressionDocs,
    );

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
  } catch (e) {
    console.error(e);
    throw e;
  }
};

declare module "../types.js" {
  interface EmbeddedEmbedders {
    [embeddedLanguage]: typeof embedder;
  }
}

function getParser(
  identifier: string,
  identifiers: string[],
): RubyParser | undefined {
  const index = identifiers.indexOf(identifier);
  for (let i = index; i >= 0; --i) {
    if (isRubyParserIdentifier(identifier)) {
      return RUBY_PARSER_IDENTIFIERS[0];
    }
    if (isRbsParserIdentifier(identifier)) {
      return RBS_PARSER_IDENTIFIERS[0];
    }
    if (isHamlParserIdentifier(identifier)) {
      return HAML_PARSER_IDENTIFIERS[0];
    }
  }
}

function isRubyParserIdentifier(identifier: string): boolean {
  return RUBY_PARSER_IDENTIFIERS.includes(identifier as RubyParserIdentifier);
}

function isRbsParserIdentifier(identifier: string): boolean {
  return RBS_PARSER_IDENTIFIERS.includes(identifier as RbsParserIdentifier);
}

function isHamlParserIdentifier(identifier: string): boolean {
  return HAML_PARSER_IDENTIFIERS.includes(identifier as HamlParserIdentifier);
}
