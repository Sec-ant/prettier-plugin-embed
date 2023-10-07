import type { TemplateLiteral } from "estree";
import type { Plugin, Printer, AstPath, Options } from "prettier";
import { builders } from "prettier/doc";
import { printers as estreePrinters } from "prettier/plugins/estree.mjs";
import type { PrettierNode } from "./types.js";
import { embeddedNames, embeddedEmbedders } from "./embedded/index.js";

const { estree: estreePrinter } = estreePrinters;

// the embed method in plugin printers
// https://prettier.io/docs/en/plugins.html#optional-embed
// we override the built-in one with this
// so that we can add hooks to support other languages
const embed: Printer["embed"] = function (
  path: AstPath<PrettierNode>,
  options: Options,
) {
  const { node } = path;
  // a quick check
  if (
    node.type !== "TemplateLiteral" ||
    node.quasis.some(({ value: { cooked } }) => cooked === null)
  ) {
    return null;
  }
  for (const embeddedName of embeddedNames) {
    const langs = options[embeddedName];
    if (!langs) {
      continue;
    }
    const lang =
      getLangFromComment(
        path,
        langs,
        options.noEmbeddedDetectionByComment ?? [],
      ) ?? getLangFromTag(path, langs, options.noEmbeddedDetectionByTag ?? []);
    if (lang === undefined) {
      continue;
    }
    const embeddedPrinter = embeddedEmbedders[embeddedName];
    if (!embeddedPrinter) {
      return null;
    }
    const node = path.node as TemplateLiteral;
    if (node.quasis.length === 1 && node.quasis[0].value.raw.trim() === "") {
      return "``";
    }
    return async (...args) => {
      const doc = await embeddedPrinter(...args, lang, langs);
      return builders.label(
        { embed: true, ...(doc as builders.Label).label },
        doc,
      );
    };
  }
  // fall back
  return estreePrinter.embed?.(path, options) ?? null;
};

// function to get lang from template literal comments
function getLangFromComment(
  { node, parent }: AstPath<PrettierNode>,
  comments: string[],
  noDetectionList: string[],
): string | undefined {
  if (comments.length === 0) {
    return;
  }
  if (node.type !== "TemplateLiteral") {
    return;
  }
  const nodeComments = node.comments ?? parent?.comments;
  if (!nodeComments) {
    return;
  }
  const lastNodeComment = nodeComments[nodeComments.length - 1];
  if (lastNodeComment.type !== "Block" || !lastNodeComment.leading) {
    return;
  }
  for (const comment of comments) {
    if (
      ` ${comment} ` === lastNodeComment.value &&
      !noDetectionList.includes(comment)
    ) {
      return comment;
    }
  }
  return;
}

// function to get lang from template literal tags
function getLangFromTag(
  { node, parent }: AstPath<PrettierNode>,
  tags: string[],
  noDetectionList: string[],
): string | undefined {
  if (tags.length === 0) {
    return;
  }
  if (
    node.type !== "TemplateLiteral" ||
    parent?.type !== "TaggedTemplateExpression" ||
    parent.tag.type !== "Identifier"
  ) {
    return;
  }
  for (const tag of tags) {
    if (parent.tag.name === tag && !noDetectionList.includes(tag)) {
      return tag;
    }
  }
  return;
}

// extends estree printer to parse embedded lanaguges in js/ts files
export const printers: Plugin["printers"] = {
  estree: {
    ...estreePrinter,
    embed,
  },
};
