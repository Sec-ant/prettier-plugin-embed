import type { Comment, Expression, TemplateLiteral } from "estree";
import type { AstPath, Doc, Options } from "prettier";
import { builders, utils } from "prettier/doc.js";
import type {
  LiteralUnion,
  OmitIndexSignature,
  UnionToIntersection,
} from "type-fest";
import type { InternalPrintFun } from "../types.js";

const {
  group,
  indent,
  softline,
  lineSuffixBoundary,
  addAlignmentToDoc,
  align,
  hardline,
} = builders;
const { mapDoc, replaceEndOfLine } = utils;

/**
 * Get the alignment size for a string (counting tabs as tabWidth spaces).
 */
function getAlignmentSize(text: string, tabWidth: number): number {
  let size = 0;
  for (const char of text) {
    if (char === "\t") {
      // Tabs behave in a way that they are aligned to the nearest
      // multiple of tabWidth:
      // 0 -> 4, 1 -> 4, 2 -> 4, 3 -> 4
      // 4 -> 8, 5 -> 8, 6 -> 8, 7 -> 8 ...
      size = size + tabWidth - (size % tabWidth);
    } else {
      size++;
    }
  }
  return size;
}

/**
 * Get the indentation size for a template literal expression.
 * This calculates the indentation based on the position of ${} in the template literal.
 */
function getIndentSize(value: string, tabWidth: number): number {
  const lastNewlineIndex = value.lastIndexOf("\n");
  if (lastNewlineIndex === -1) {
    return 0;
  }

  // Get all the leading whitespaces after the last newline
  const lastLine = value.slice(lastNewlineIndex + 1);
  const leadingWhitespace = lastLine.match(/^[\t ]*/)?.[0] ?? "";
  return getAlignmentSize(leadingWhitespace, tabWidth);
}

/**
 * Compute the indent size for the expression at `index` inside `templateLiteral`.
 *
 * Strategy (on-demand): look at the quasi immediately preceding the expression;
 * if it contains a newline, use the indentation after the last newline. If not,
 * walk backwards to find the most recent newline in earlier quasis. This avoids
 * keeping a global cache and keeps the logic local and simple.
 */
function getTemplateLiteralExpressionIndent(
  templateLiteral: TemplateLiteral,
  index: number,
  tabWidth: number,
): { indentSize: number; previousQuasiText: string } {
  let i = index;
  const precedingQuasi = templateLiteral.quasis[i];
  const previousQuasiText = precedingQuasi?.value.raw ?? "";

  if (previousQuasiText.includes("\n")) {
    return {
      indentSize: getIndentSize(previousQuasiText, tabWidth),
      previousQuasiText,
    };
  }

  while (i-- > 0) {
    const q = templateLiteral.quasis[i];
    if (!q) break;
    const text = q.value.raw;
    if (text.includes("\n")) {
      return { indentSize: getIndentSize(text, tabWidth), previousQuasiText };
    }
  }

  return { indentSize: 0, previousQuasiText };
}

export function printTemplateExpression(
  path: AstPath<Expression & { comments?: Comment[] }>,
  print: InternalPrintFun,
  templateLiteral: TemplateLiteral,
  index: number,
  tabWidth: number,
) {
  const { node } = path;
  let printed = print();
  if (node?.comments?.length) {
    printed = group([indent([softline, printed]), softline]);
  }

  // Calculate the indentation based on the position of ${} in the template literal
  const { indentSize, previousQuasiText } = getTemplateLiteralExpressionIndent(
    templateLiteral,
    index,
    tabWidth,
  );

  // Apply alignment based on the indentation
  let expressionDoc: Doc = printed;
  expressionDoc =
    indentSize === 0 && previousQuasiText.endsWith("\n")
      ? align(Number.NEGATIVE_INFINITY, expressionDoc)
      : addAlignmentToDoc(expressionDoc, indentSize, tabWidth);

  return group(["${", expressionDoc, lineSuffixBoundary, "}"]);
}

export function printTemplateExpressions(
  path: AstPath<TemplateLiteral>,
  print: InternalPrintFun,
  options?: Options,
) {
  const tabWidth = options?.tabWidth ?? 2;
  const templateLiteral = path.node;
  return path.map(
    (exprPath, index) =>
      printTemplateExpression(
        exprPath,
        print,
        templateLiteral,
        index,
        tabWidth,
      ),
    "expressions",
  );
}

export function simpleRehydrateDoc(
  doc: Doc,
  placeholderRegex: RegExp,
  expressionDocs: Doc[],
  /**
   * How to handle newlines in the formatted content:
   * - false: keep newlines as-is (default)
   * - "hardline": replace newlines with hardline (adds indentation)
   * - "literalline": replace newlines with literalline via replaceEndOfLine (preserves original indentation)
   */
  newlineHandling: false | "hardline" | "literalline" = false,
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
        if (newlineHandling === "literalline") {
          // Use replaceEndOfLine which uses literalline (doesn't add indentation)
          // This is useful for languages like CSS where the formatter already
          // produces correctly indented output (e.g., in multi-line comments)
          parts.push(replaceEndOfLine(component));
        } else if (newlineHandling === "hardline") {
          // Use hardline (adds indentation based on current indent level)
          // This is useful for languages like SQL where the formatter produces
          // output starting from column 0 and needs re-indentation
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
