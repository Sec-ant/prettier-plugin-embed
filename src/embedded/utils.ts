import type { Comment, Expression, TemplateLiteral } from "estree";
import type { AstPath, Doc, Options } from "prettier";
import { builders, utils } from "prettier/doc";
import type {
  LiteralUnion,
  OmitIndexSignature,
  UnionToIntersection,
} from "../type-utils.js";
import type { InternalPrintFun } from "../types.js";

const {
  group,
  indent,
  line,
  softline,
  lineSuffixBoundary,
  addAlignmentToDoc,
  align,
  hardline,
} = builders;
const { mapDoc, replaceEndOfLine } = utils;

export function prepareTemplate(
  node: TemplateLiteral,
  createPlaceholder: (index: number) => string,
) {
  const text = node.quasis
    .map((quasi, index, { length }) =>
      index === length - 1
        ? quasi.value.cooked
        : quasi.value.cooked + createPlaceholder(index),
    )
    .join("");

  const leadingWhitespaces = text.match(/^\s+/)?.[0] ?? "";
  const trailingWhitespaces = text.match(/\s+$/)?.[0] ?? "";

  const trimmedText = text.slice(
    leadingWhitespaces.length,
    -trailingWhitespaces.length || undefined,
  );
  return { trimmedText, leadingWhitespaces, trailingWhitespaces };
}

export function wrapEmbeddedDoc(
  contentDoc: Doc,
  options: {
    preserveEmbeddedExteriorWhitespaces?: string[];
    noEmbeddedMultiLineIndentation?: string[];
  },
  commentOrTag: string,
  leadingWhitespaces: string,
  trailingWhitespaces: string,
  preserveBoundaryWhitespace = false,
): Doc {
  const preserveExterior =
    options.preserveEmbeddedExteriorWhitespaces?.includes(commentOrTag);
  const noIndent =
    options.noEmbeddedMultiLineIndentation?.includes(commentOrTag);
  const content = group(contentDoc);

  if (preserveExterior) {
    return group([
      "`",
      leadingWhitespaces,
      noIndent ? content : indent([content]),
      trailingWhitespaces,
      "`",
    ]);
  }

  // Whitespace-sensitive markup preserves whether each boundary has whitespace,
  // while still allowing its indentation to be formatted. Only break around the
  // whole template when both boundaries already contain whitespace.
  if (
    preserveBoundaryWhitespace &&
    (!leadingWhitespaces || !trailingWhitespaces)
  ) {
    return group([
      "`",
      leadingWhitespaces ? " " : "",
      content,
      trailingWhitespaces ? " " : "",
      "`",
    ]);
  }

  const leadingLineBreak = leadingWhitespaces.length ? line : softline;
  const trailingLineBreak = trailingWhitespaces.length ? line : softline;

  return group([
    "`",
    noIndent
      ? [leadingLineBreak, content]
      : indent([leadingLineBreak, content]),
    trailingLineBreak,
    "`",
  ]);
}

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
  // Get all the leading whitespaces after the last newline
  const lastLine = value.slice(lastNewlineIndex + 1);
  const leadingWhitespace = /^[\t ]*/.exec(lastLine)![0];
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
  const previousQuasiText = templateLiteral.quasis[i]!.value.raw;

  if (previousQuasiText.includes("\n")) {
    return {
      indentSize: getIndentSize(previousQuasiText, tabWidth),
      previousQuasiText,
    };
  }

  while (i-- > 0) {
    const text = templateLiteral.quasis[i]!.value.raw;
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
  preserveIndentation = true,
  knownIndentSize?: number,
) {
  const { node } = path;
  let printed = print();
  if (node?.comments?.length) {
    printed = group([indent([softline, printed]), softline]);
  }

  if (!preserveIndentation) {
    return group(["${", printed, lineSuffixBoundary, "}"]);
  }

  // Calculate the indentation based on the position of ${} in the template literal
  const { indentSize, previousQuasiText } =
    knownIndentSize === undefined
      ? getTemplateLiteralExpressionIndent(templateLiteral, index, tabWidth)
      : {
          indentSize: knownIndentSize,
          previousQuasiText: templateLiteral.quasis[index]!.value.raw,
        };

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
  preserveIndentation = true,
) {
  const tabWidth = options?.tabWidth ?? 2;
  const templateLiteral = path.node;
  let indentSize = 0;
  return path.map((exprPath, index) => {
    if (preserveIndentation) {
      const text = templateLiteral.quasis[index]!.value.raw;
      if (text.includes("\n")) {
        indentSize = getIndentSize(text, tabWidth);
      }
    }
    return printTemplateExpression(
      exprPath,
      print,
      templateLiteral,
      index,
      tabWidth,
      preserveIndentation,
      indentSize,
    );
  }, "expressions");
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
  lineBreakBeforeExpressions?: ReadonlySet<number>,
  interpolationTabWidth?: number,
  escapeClosingScript = false,
) {
  const restoredExpressions = expressionDocs.length
    ? new Set<number>()
    : undefined;
  const contentDoc = mapDoc(doc, (doc) => {
    if (typeof doc !== "string") {
      return doc;
    }
    const parts: Doc[] = [];
    const components = doc.split(placeholderRegex);
    let lineIndentation = "";
    for (let i = 0; i < components.length; i++) {
      let component = components[i]!;
      if (i % 2 === 0) {
        if (i === 0 || component.includes("\n")) {
          const lastLine = component.slice(component.lastIndexOf("\n") + 1);
          lineIndentation = /^[\t ]*/.exec(lastLine)![0];
        }
        if (!component) {
          continue;
        }
        component = component.replaceAll(/([\\`]|\${)/g, "\\$1");
        if (escapeClosingScript) {
          component = component.replaceAll(/<\/(?=script\b)/gi, "<\\/");
        }
        if (newlineHandling === "literalline") {
          // Use replaceEndOfLine, which emits literalline and preserves literal indentation.
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
        restoredExpressions?.add(placeholderIndex);
        const formattedTextBeforeExpression = components[i - 1]!;
        if (
          lineBreakBeforeExpressions?.has(placeholderIndex) &&
          !/\n[\t ]*$/.test(formattedTextBeforeExpression)
        ) {
          const previousPart = parts.at(-1);
          if (typeof previousPart === "string") {
            parts[parts.length - 1] = previousPart.replace(/[\t ]+$/, "");
          }
          parts.push(hardline);
          if (interpolationTabWidth !== undefined) {
            parts.push(lineIndentation);
          }
        }
        const expressionDoc = expressionDocs[placeholderIndex]!;
        parts.push(
          interpolationTabWidth === undefined
            ? expressionDoc
            : align(
                getAlignmentSize(lineIndentation, interpolationTabWidth),
                expressionDoc,
              ),
        );
      }
    }
    return parts;
  });
  if (expressionDocs.some((_, index) => !restoredExpressions!.has(index))) {
    throw new Error(
      "The embedded formatter changed an expression placeholder.",
    );
  }
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
