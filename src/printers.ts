import type { Plugin, Printer, AstPath, Options } from "prettier";
import { printers as estreePrinters } from "prettier/plugins/estree.mjs";
import type { Node, TemplateLiteral } from "estree";

import type { PluginOptions } from "./options.js";
import { Embedder, embedders } from "./embed/index.js";

const { estree: estreePrinter } = estreePrinters;

interface PrettierOptions extends Options, PluginOptions {}

const embed: Printer["embed"] = function (
  path: AstPath<Node>,
  options: PrettierOptions,
) {
  const { node } = path;

  // a quick check
  if (
    node.type !== "TemplateLiteral" ||
    node.quasis.some(({ value: { cooked } }) => cooked === null)
  ) {
    return null;
  }

  // test against registered options
  for (const { comment, tag, embedder } of options.embeddedLanguages ?? []) {
    const comments = typeof comment === "string" ? [comment] : comment;
    const tags = typeof tag === "string" ? [tag] : tag;
    if (
      !checkAgainstComments(path, comments) &&
      !checkAgainstTags(path, tags)
    ) {
      continue;
    }
    let embedderFun: Embedder | null;
    if (typeof embedder === "string") {
      embedderFun = embedders[embedder];
    } else {
      embedderFun = embedder;
    }
    const node = path.node as TemplateLiteral;
    if (node.quasis.length === 1 && node.quasis[0].value.raw.trim() === "") {
      return "``";
    }
    // todo: should we label the doc as in https://github.com/prettier/prettier/blob/f4491b1274d0697f38f9110116a7dd8d7c295e84/src/language-js/embed/index.js#L39
    return embedderFun;
  }

  // fall back
  return estreePrinter.embed?.(path, options) ?? null;
};

// todo: add check against comments
function checkAgainstComments(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _path: AstPath<Node>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _comments: string[],
): boolean {
  return false;
}

function checkAgainstTags(
  { node, parent }: AstPath<Node>,
  tags: string[],
): boolean {
  for (const tag of tags) {
    if (
      node.type === "TemplateLiteral" &&
      parent?.type === "TaggedTemplateExpression" &&
      parent.tag.type === "Identifier" &&
      parent.tag.name === tag
    ) {
      return true;
    }
  }
  return false;
}

export const printers: Plugin["printers"] = {
  estree: {
    ...estreePrinter,
    embed,
  },
};
