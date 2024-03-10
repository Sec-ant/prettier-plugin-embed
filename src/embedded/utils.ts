import type { Comment, Expression, TemplateLiteral } from "estree";
import type { AstPath, Doc } from "prettier";
import { builders, utils } from "prettier/doc";
import type {
  LiteralUnion,
  OmitIndexSignature,
  UnionToIntersection,
} from "type-fest";
import type { InternalPrintFun } from "../types.js";

const { group, indent, softline, hardline, lineSuffixBoundary } = builders;
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
  replaceLiteralNewlinesToHardlines = false,
) {
  const contentDoc = mapDoc(doc, (doc) => {
    if (typeof doc !== "string") {
      return doc;
    }
    const parts = [];
    const components = doc.split(placeholderRegex);
    for (let i = 0; i < components.length; i++) {
      let component = components[i]!;
      if (i % 2 === 0) {
        if (!component) {
          continue;
        }
        component = component.replaceAll(/([\\`]|\${)/g, "\\$1");
        if (replaceLiteralNewlinesToHardlines) {
          for (const c of component.split(/(\n)/)) {
            c === "\n" ? parts.push(hardline) : parts.push(c);
          }
        } else {
          parts.push(component);
        }
      } else {
        const placeholderIndex = Number(component);
        parts.push(expressionDocs[placeholderIndex]!);
      }
    }
    return parts;
  });
  return contentDoc;
}

export function insertLanguage(
  languages: string[],
  language: string,
  firstLanguage: string,
) {
  if (language === firstLanguage) {
    languages.unshift(language);
    return;
  }
  let low = 0;
  let high = languages.length;
  while (low < high) {
    const mid = (low + high) >>> 1;
    if (languages[mid] === firstLanguage) {
      languages.push(language);
      return;
    }
    if (languages[mid]! < language) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  languages.splice(low, 0, language);
}

export const randomUUID = (() => {
  const dict = [...Array(26).keys()]
    .map((key) => String.fromCharCode(key + 97))
    .concat([...Array(10).keys()].map((key) => `${key}`));
  return () => {
    const uuidLength = 16;
    let id = "";
    for (let i = 0; i < uuidLength; ++i) {
      id +=
        dict[
          Number.parseInt((Math.random() * dict.length).toFixed(0), 10) %
            dict.length
        ];
    }
    return id;
  };
})();

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
    "ig",
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

export function makeCommentsOptionName<T extends string>(language: T) {
  return `${language}Comments` as const;
}

export function makeTagsOptionName<T extends string>(language: T) {
  return `${language}Tags` as const;
}

export function makePluginOptionName<T extends string>(language: T) {
  return `${language}Plugin` as const;
}

export function makeParserOptionName<T extends string>(language: T) {
  return `${language}Parser` as const;
}

export type AutocompleteStringList<T extends string> = LiteralUnion<
  T,
  string
>[];

export type StringListToInterfaceKey<T extends readonly string[]> = {
  [key in T[number]]: undefined;
};

export type Satisfies<U, T extends U> = T;

export type NormalizeOptions<T> = OmitIndexSignature<{
  [k in keyof UnionToIntersection<T>]?: k extends keyof T
    ? T[k]
    : UnionToIntersection<T>[k];
}>;

export const fallbackIndicator = "9ff2b366e8ca4c97b9aed1a29b5b94ed";
