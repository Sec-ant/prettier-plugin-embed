import type { TemplateLiteral } from "estree";
import { type Plugin, type Printer, type AstPath, Options } from "prettier";
import { builders } from "prettier/doc";
import { printers as estreePrinters } from "prettier/plugins/estree.mjs";
import type { PrettierNode } from "./types.js";
import { embeddedLanguageNames, embeddedPrinters } from "./embedded/index.js";

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
  for (const name of embeddedLanguageNames) {
    const labels = options[name];
    if (!labels) {
      continue;
    }
    const lang =
      getLangFromComment(path, labels) ?? getLangFromTag(path, labels);
    if (lang === undefined) {
      continue;
    }
    const embeddedPrinter = embeddedPrinters[name];
    const node = path.node as TemplateLiteral;
    if (node.quasis.length === 1 && node.quasis[0].value.raw.trim() === "") {
      return "``";
    }
    return async (...args) => {
      const doc = await embeddedPrinter!(...args, lang);
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
    if (` ${comment} ` === lastNodeComment.value) {
      return comment;
    }
  }
  return;
}

// function to get lang from template literal tags
function getLangFromTag(
  { node, parent }: AstPath<PrettierNode>,
  tags: string[],
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
    if (parent.tag.name === tag) {
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
