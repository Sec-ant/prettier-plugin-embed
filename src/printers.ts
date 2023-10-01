import type { Plugin, Printer, AstPath, Options } from "prettier";
import { builders } from "prettier/doc.js";
import { printers as estreePrinters } from "prettier/plugins/estree.mjs";
import type { Node, TemplateLiteral } from "estree";

import { PluginOptions } from "./options.js";
import printXml from "./embed/xml.js";

const { estree: estreePrinter } = estreePrinters;

interface PrettierOptions extends Options, PluginOptions {}

const embed: Printer["embed"] = function (
  path: AstPath<Node>,
  options: PrettierOptions,
) {
  if (!(options.disableBuiltinBehavior ?? false)) {
    // first check built-ins
    const builtInEmbedder = estreePrinter.embed?.(path, options) ?? undefined;
    if (builtInEmbedder !== undefined) {
      return builtInEmbedder;
    }
  }

  // the rest is handled by this plugin
  const { node } = path;
  if (node.type !== "TemplateLiteral" || hasInvalidCookedValue(node)) {
    return null;
  }

  options.embeddedLanguages?.map((embeddedLanaguage) => {
    let tagName = 
    if (typeof embeddedLanaguage === "string") {
      
    }
    else if (typeof embeddedLanaguage === )
  });

  // todo: the print array should be configurable
  for (const getEmbedder of [printXml]) {
    const embedder = getEmbedder(path as AstPath<TemplateLiteral>);

    if (!embedder) {
      continue;
    }

    if (node.quasis.length === 1 && node.quasis[0].value.raw.trim() === "") {
      return "``";
    }

    return async (...args) => {
      const doc = await (embedder satisfies Function)(...args);
      return doc;
    };
  }

  return null;
};

function hasInvalidCookedValue({ quasis }: TemplateLiteral): boolean {
  return quasis.some(({ value: { cooked } }) => cooked === null);
}

export const printers: Plugin["printers"] = {
  estree: {
    ...estreePrinter,
    embed,
  },
};
