import type { TemplateLiteral } from "estree";
import type { AstPath, Options, Plugin, Printer } from "prettier";
import { builders } from "prettier/doc";
import { printers as estreePrinters } from "prettier/plugins/estree.mjs";
import {
  embeddedEmbedders,
  embeddedLanguages,
  makeIdentifiersOptionName,
} from "./embedded/index.js";
import type { PrettierNode } from "./types.js";
import {
  getIdentifierFromComment,
  getIdentifierFromTag,
  resolveEmbeddedOverrideOptions,
} from "./utils.js";

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
    return async (textToDoc, print, path, options) => {
      const embeddedOverrideOptions = await resolveEmbeddedOverrideOptions(
        options.embeddedOverrides,
        identifier,
        options.filepath,
      );
      try {
        const doc = await embeddedEmbedder(textToDoc, print, path, options, {
          identifier,
          identifiers,
          embeddedOverrideOptions,
        });
        return builders.label(
          { embed: true, ...(doc as builders.Label).label },
          doc,
        );
      } catch (e) {
        console.error(e);
        throw e;
      }
    };
  }
  // fall back
  return estreePrinter.embed?.(path, options) ?? null;
};

// extends estree printer to parse embedded lanaguges in js/ts files
export const printers: Plugin["printers"] = {
  estree: {
    ...estreePrinter,
    embed,
  },
};
