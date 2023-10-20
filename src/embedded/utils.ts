import type { Expression, Comment, TemplateLiteral } from "estree";
import type { AstPath, Options, Doc } from "prettier";
import { builders, utils } from "prettier/doc";
import ShortUniqueId from "short-unique-id";
import type { InternalPrintFun } from "../types.js";

const { group, indent, softline, lineSuffixBoundary } = builders;
const { mapDoc } = utils;

export function printTemplateExpression(
  path: AstPath<Expression & { comments?: Comment[] }>,
  print: InternalPrintFun,
) {
  const { node } = path;
  let printed = print();
  if (node?.comments?.length) {
    printed = group([indent([softline, printed]), softline]);
  }
  return ["${", printed, lineSuffixBoundary, "}"];
}

export function printTemplateExpressions(
  path: AstPath<TemplateLiteral>,
  print: InternalPrintFun,
) {
  return path.map(
    (path) => printTemplateExpression(path, print),
    "expressions",
  );
}

export function simpleRehydrateDoc(
  doc: Doc,
  placeholderRegex: RegExp,
  expressionDocs: Doc[],
) {
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
        parts.push(component);
      } else {
        const placeholderIndex = Number(component);
        parts.push(expressionDocs[placeholderIndex]);
      }
    }
    return parts;
  });
  return contentDoc;
}

export function throwIfPluginIsNotFound(
  pluginName: string,
  options: Options,
  identifier: string,
) {
  if (
    !(
      options.plugins?.some(
        (p) => (p as { name?: string }).name?.includes(pluginName) ?? false,
      ) ?? false
    )
  ) {
    throw new Error(
      `Cannot format embedded language identified by "${identifier}", because plugin "${pluginName}" is not loaded.`,
    );
  }
}

export function insertEmbeddedLanguage(
  embeddedLanguages: string[],
  embeddedLanguage: string,
  firstEmbeddedLanguage: string,
) {
  if (embeddedLanguage === firstEmbeddedLanguage) {
    embeddedLanguages.unshift(embeddedLanguage);
    return;
  }
  let low = 0;
  let high = embeddedLanguages.length;
  while (low < high) {
    const mid = (low + high) >>> 1;
    if (embeddedLanguages[mid] === firstEmbeddedLanguage) {
      embeddedLanguages.push(embeddedLanguage);
      return;
    }
    if (embeddedLanguages[mid] < embeddedLanguage) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  embeddedLanguages.splice(low, 0, embeddedLanguage);
}

export const { randomUUID } = new ShortUniqueId({
  length: 16,
  dictionary: "alphanum_lower",
});

export function preparePlaceholder(leading = "p", trailing = "") {
  const uuid1 = randomUUID();
  const uuid2 = randomUUID();
  const escapedLeading = escapeRegExp(leading);
  const escapedTrailing = escapeRegExp(trailing);
  const createPlaceholder = (index: number) => {
    return `${leading}${uuid1}${index}${uuid2}${trailing}`;
  };
  const placeholderRegex = new RegExp(
    `${escapedLeading}${uuid1}(\\d+)${uuid2}${escapedTrailing}`,
    "g",
  );
  return {
    createPlaceholder,
    placeholderRegex,
  };
}

export function escapeRegExp(text: string) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

export function makeIdentifiersOptionName<T extends string>(language: T) {
  return `${language}Identifiers` as const;
}

export function makeParserOptionName<T extends string>(language: T) {
  return `${language}Parser` as const;
}

// this weird generic can provide autocomplete prompts of type T[number] to users
// while also accepts any string
export type AutocompleteStringList<T extends readonly string[]> =
  | (T[number][] & string[])
  | string[];

export type StringListToInterfaceKey<T extends readonly string[]> = {
  [key in T[number]]: void;
};

export type Satisfies<U, T extends U> = T;
