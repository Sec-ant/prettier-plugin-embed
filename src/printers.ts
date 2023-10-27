import type { TemplateLiteral } from "estree";
import type { Plugin, Printer, AstPath, Options } from "prettier";
import { builders } from "prettier/doc";
import { printers as estreePrinters } from "prettier/plugins/estree.mjs";
import type { PrettierNode } from "./types.js";
import {
  embeddedLanguages,
  embeddedEmbedders,
  makeIdentifiersOptionName,
} from "./embedded/index.js";

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
  for (const embeddedLanguage of embeddedLanguages) {
    const identifiers = options[makeIdentifiersOptionName(embeddedLanguage)];
    if (!identifiers) {
      continue;
    }
    const identifier =
      getIdentifierFromComment(
        path,
        identifiers,
        options.noEmbeddedIdentificationByComment ?? [],
      ) ??
      getIdentifierFromTag(
        path,
        identifiers,
        options.noEmbeddedIdentificationByTag ?? [],
      );
    if (identifier === undefined) {
      continue;
    }
    const embeddedEmbedder = embeddedEmbedders[embeddedLanguage];
    if (!embeddedEmbedder) {
      return null;
    }
    const node = path.node as TemplateLiteral;
    if (node.quasis.length === 1 && node.quasis[0].value.raw.trim() === "") {
      return "``";
    }

    return async (...args) => {
      try {
        const doc = await embeddedEmbedder(...args, identifier, identifiers);
        return builders.label(
          { embed: true, ...(doc as builders.Label).label },
          doc,
        );
      } catch (e) {
        console.log(e);
        throw e;
      }
    };
  }
  // fall back
  return estreePrinter.embed?.(path, options) ?? null;
};

// TODO: support tags like 'this.html', 'this["html"]'..., if possible
// ideally, the best api to use is https://github.com/estools/esquery

// function to get identifier from template literal comments
function getIdentifierFromComment(
  { node, parent }: AstPath<PrettierNode>,
  comments: string[],
  noIdentificationList: string[],
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
  if (
    ![
      "MultiLine", // meriyah
      "Block", // typescript, acorn, espree, flow
      "CommentBlock", // babel, babel-flow, babel-ts
    ].includes(lastNodeComment.type) ||
    !lastNodeComment.leading
  ) {
    return;
  }
  for (const comment of comments) {
    if (
      ` ${comment} ` === lastNodeComment.value &&
      !noIdentificationList.includes(comment)
    ) {
      return comment;
    }
  }
  return;
}

// function to get identifier from template literal tags
function getIdentifierFromTag(
  { node, parent }: AstPath<PrettierNode>,
  tags: string[],
  noIdentificationList: string[],
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
    if (parent.tag.name === tag && !noIdentificationList.includes(tag)) {
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
