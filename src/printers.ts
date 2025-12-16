import type { Node, TemplateLiteral } from "estree";
import type {
  AstPath,
  Options,
  Parser,
  ParserOptions,
  Plugin,
  Printer,
} from "prettier";
import { printers as estreePrinters } from "prettier/plugins/estree.mjs";
import { embeddedLanguages } from "./embedded/index.js";
import { parsers } from "./parsers.js";
import {
  assumeAs,
  compareTagExpressionToTagString,
  createCommentsInOptionsGenerator,
  createEmbeddedDoc,
  createTagsInOptionsGenerator,
  parseCommentFromTemplateLiteralAstPath,
  parseTagFromTemplateLiteralAstPath,
} from "./utils.js";

const { estree: estreePrinter } = estreePrinters;
const { embed: builtInEmbed } = estreePrinter;

// the embed method in plugin printers
// https://prettier.io/docs/en/plugins.html#optional-embed
// we override the built-in one with this
// so that we can add hooks to support other languages
const embed: Printer["embed"] = (path: AstPath<Node>, options: Options) => {
  const { node } = path;
  // skip all non-template-literal nodes
  if (
    node.type !== "TemplateLiteral" ||
    node.quasis.some(({ value: { cooked } }) => cooked === null)
  ) {
    return null;
  }

  assumeAs<{ node: TemplateLiteral }>(path);

  // check if the template literal node has a leading block comment,
  // if it does, the inner value of the block comment is returned,
  // if it does not, `undefined` is returned.
  const comment = parseCommentFromTemplateLiteralAstPath(path);

  // template literal node has a leading comment block
  if (typeof comment === "string") {
    const commentsInOptionsGenerator = createCommentsInOptionsGenerator(
      options,
      comment,
    );

    for (const embeddedLanguage of embeddedLanguages) {
      let hit = false;

      for (const commentInOptions of commentsInOptionsGenerator(
        embeddedLanguage,
      )) {
        if (comment === commentInOptions) {
          hit = true;
          break;
        }
      }

      if (!hit) {
        continue;
      }

      return createEmbeddedDoc(
        node,
        embeddedLanguage,
        comment,
        "comment",
        options,
      );
    }

    // unknown comment block
    // fallback to built-in behavior
    return builtInEmbed?.(path, options) ?? null;
  }

  // check if the template literal node has a tag,
  // if it does and the tag is a simple identifier, the identifier name is returned as a string
  // if it does but the tag is a complex expression, the expression is returned as an expression node
  // if it does not, `undefined` is returned.
  const tag = parseTagFromTemplateLiteralAstPath(path);

  // template literal node has a simple identifier tag
  if (typeof tag === "string") {
    const tagsInOptionsGenerator = createTagsInOptionsGenerator(options, tag);

    for (const embeddedLanguage of embeddedLanguages) {
      let hit = false;

      for (const tagInOptions of tagsInOptionsGenerator(embeddedLanguage)) {
        if (tag === tagInOptions) {
          hit = true;
          break;
        }
      }

      if (!hit) {
        continue;
      }

      return createEmbeddedDoc(node, embeddedLanguage, tag, "tag", options);
    }

    // unknown tag
    // fallback to built-in behavior
    return builtInEmbed?.(path, options) ?? null;
  }

  // template literal node has a complex expression tag
  if (tag !== undefined) {
    const parse = (text: string) =>
      (parsers[options.parser as keyof typeof parsers] as Parser<Node>).parse(
        text,
        options as ParserOptions<Node>,
      );

    const tagsInOptionsGenerator = createTagsInOptionsGenerator(options);

    for (const embeddedLanguage of embeddedLanguages) {
      let stringFormTag: string | undefined;

      for (const tagInOptions of tagsInOptionsGenerator(embeddedLanguage)) {
        if (compareTagExpressionToTagString(tag, tagInOptions, parse)) {
          stringFormTag = tagInOptions;
          break;
        }
      }

      if (stringFormTag === undefined) {
        continue;
      }

      return createEmbeddedDoc(
        node,
        embeddedLanguage,
        stringFormTag,
        "tag",
        options,
      );
    }
  }

  // fallback to built-in behavior
  return builtInEmbed?.(path, options) ?? null;
};

// extends estree printer to parse embedded lanaguges in js/ts files
export const printers: Plugin["printers"] = {
  estree: {
    ...estreePrinter,
    embed,
  },
};
