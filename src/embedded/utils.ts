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
  dedentToRoot,
  markAsRoot,
  literalline,
  trim,
  label,
} = builders;
const { mapDoc, replaceEndOfLine, traverseDoc, willBreak } = utils;
const EXPRESSION_LABEL = Symbol("embedded-expression");
const EXPRESSIONS_LABEL = Symbol("embedded-expressions");
const LINE_INDENTATION_PATTERN = /^[\t ]*/;
const CONTENT_INDENTATION_PATTERN = /^[\t ]*(?=\S)/gm;
const FINAL_LINE_BREAK_PATTERN = /\r?\n[\t ]*$/;
const EXPRESSION_LINE_BREAK_PATTERN = /\n[\t ]*$/;
const TEMPLATE_ESCAPE_PATTERN = /([\\`]|\${)/g;
const CLOSING_SCRIPT_PATTERN = /<\/(?=script\b)/gi;
const REGEX_ESCAPE_PATTERN = /[-[\]{}()*+?.,\\^$|#\s]/g;

type Indentation = {
  doc: Extract<Doc, { type: "indent" | "align" | "indent-if-break" }> & {
    contents: Doc;
  };
  parent?: Indentation;
};
type Root = { indentation?: Indentation; parent?: Root };
type IndentationContext = { indentation?: Indentation; root?: Root };

function usesLiteralRoot(doc: Doc): boolean {
  if (typeof doc === "string") return false;
  let usesRoot = false;
  traverseDoc(
    doc,
    (part) => {
      if (usesRoot) return false;
      if (part && typeof part === "object" && !Array.isArray(part)) {
        usesRoot = Boolean(
          (part.type === "line" && part.literal) ||
            (part.type === "align" && part.n === Number.NEGATIVE_INFINITY),
        );
      }
    },
    undefined,
    true,
  );
  return usesRoot;
}

// A template's literal root must not leak into its JavaScript expressions.
// Pop the language roots and replay only their layout commands. This restores
// the host root while retaining the expression's current column and group IDs.
function isolateExpressionRoots(doc: Doc): Doc {
  if (
    !doc ||
    typeof doc !== "object" ||
    Array.isArray(doc) ||
    doc.type !== "label" ||
    doc.label !== EXPRESSIONS_LABEL
  )
    return doc;
  const cache = new WeakMap<IndentationContext, Map<object, Doc>>();
  function visit(doc: Doc, context: IndentationContext): Doc {
    if (typeof doc !== "object" || !doc) return doc;
    let docs = cache.get(context);
    if (!docs) {
      docs = new Map();
      cache.set(context, docs);
    }
    const cached = docs.get(doc);
    if (cached !== undefined) return cached;
    const result = visitObject(doc, context);
    docs.set(doc, result);
    return result;
  }
  function visitObject(
    doc: Exclude<Doc, string>,
    context: IndentationContext,
  ): Doc {
    if (Array.isArray(doc)) return doc.map((part) => visit(part, context));
    if (doc.type === "label" && doc.label === EXPRESSION_LABEL) {
      let expression = doc.contents;
      let depth = 0;
      let base: Indentation | undefined;
      for (let root = context.root; root; root = root.parent) {
        depth++;
        base = root.indentation;
      }
      if (depth === 0) return expression;
      for (
        let command = context.indentation;
        command && command !== base;
        command = command.parent
      ) {
        expression = { ...command.doc, contents: expression } as Doc;
      }
      while (depth-- > 0) expression = dedentToRoot(expression);
      return expression;
    }
    if (doc.type === "fill")
      return { ...doc, parts: doc.parts.map((part) => visit(part, context)) };
    if (doc.type === "if-break")
      return {
        ...doc,
        breakContents: visit(doc.breakContents, context),
        flatContents: visit(doc.flatContents, context),
      };
    if (doc.type === "group" && doc.expandedStates) {
      const expandedStates = doc.expandedStates.map((part) =>
        visit(part, context),
      );
      return { ...doc, contents: expandedStates[0]!, expandedStates };
    }
    if (doc.type === "indent-if-break") {
      // Prettier's public type omits this command's runtime contents field.
      const conditional = doc as typeof doc & { contents: Doc };
      return {
        ...conditional,
        contents: visit(conditional.contents, {
          ...context,
          indentation: { doc: conditional, parent: context.indentation },
        }),
      } as Doc;
    }
    if ("contents" in doc) {
      let next = context;
      if (doc.type === "align" && typeof doc.n === "object") {
        next = {
          ...context,
          root: { indentation: context.indentation, parent: context.root },
        };
      } else if (doc.type === "align" && doc.n === Number.NEGATIVE_INFINITY) {
        next = {
          indentation: context.root?.indentation,
          root: context.root?.parent,
        };
      } else if (doc.type === "align" || doc.type === "indent") {
        next = {
          ...context,
          indentation: { doc, parent: context.indentation },
        };
      }
      return { ...doc, contents: visit(doc.contents, next) };
    }
    return doc;
  }
  return visit(doc.contents, { root: {} });
}

export function prepareTemplate(
  node: TemplateLiteral,
  createPlaceholder: (index: number) => string,
  preserveTrailingWhitespace = false,
) {
  const templateText = node.quasis
    .map((quasi, index, { length }) =>
      index === length - 1
        ? quasi.value.cooked
        : quasi.value.cooked + createPlaceholder(index),
    )
    .join("");

  const start = templateText.length - templateText.trimStart().length;
  const end = Math.max(start, templateText.trimEnd().length);
  let leadingWhitespaces = templateText.slice(0, start);
  let trailingWhitespaces = templateText.slice(end);
  let text = templateText.slice(start, end);

  // Find a shared template margin before trimming the first content line.
  // A column-zero line rules out a margin. Compare characters rather than
  // columns so mixed tabs and spaces never consume content indentation.
  const indents = templateText.matchAll(CONTENT_INDENTATION_PATTERN);
  let margin = indents.next().value?.[0] ?? "";
  while (margin) {
    const indentation = indents.next().value?.[0];
    if (indentation === undefined) break;
    let length = 0;
    while (length < margin.length && margin[length] === indentation[length]) {
      length++;
    }
    margin = margin.slice(0, length);
  }
  const marginPattern = margin
    ? new RegExp(`(\\r?\\n)${margin}`, "g")
    : undefined;

  if (text) {
    const firstIndent = leadingWhitespaces.includes("\n")
      ? leadingWhitespaces.slice(leadingWhitespaces.lastIndexOf("\n") + 1)
      : "";
    const contentIndent = firstIndent.slice(margin.length);
    leadingWhitespaces = leadingWhitespaces.slice(
      0,
      leadingWhitespaces.length - contentIndent.length,
    );
    text =
      contentIndent +
      (marginPattern ? text.replace(marginPattern, "$1") : text);
  }

  if (preserveTrailingWhitespace) {
    // In languages such as YAML, blank lines at EOF can belong to a scalar.
    // Parse them as content; the final line break remains the template boundary.
    text += marginPattern
      ? trailingWhitespaces.replace(marginPattern, "$1")
      : trailingWhitespaces;
    trailingWhitespaces =
      FINAL_LINE_BREAK_PATTERN.exec(trailingWhitespaces)?.[0] ?? "";
  }

  return {
    text,
    leadingWhitespaces,
    trailingWhitespaces,
  };
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
  // Whitespace-sensitive markup preserves whether each boundary has whitespace,
  // while still allowing its indentation to be formatted. Only break around the
  // whole template when both boundaries already contain whitespace.
  if (
    !preserveExterior &&
    preserveBoundaryWhitespace &&
    (!leadingWhitespaces || !trailingWhitespaces)
  ) {
    return group([
      "`",
      leadingWhitespaces ? " " : "",
      noIndent ? dedentToRoot(group(contentDoc)) : group(contentDoc),
      trailingWhitespaces ? " " : "",
      "`",
    ]);
  }

  const content = markAsRoot(group(isolateExpressionRoots(contentDoc)));
  if (preserveExterior) {
    const hasLeadingNewline = leadingWhitespaces.includes("\n");
    const indentation = leadingWhitespaces.slice(
      leadingWhitespaces.lastIndexOf("\n") + 1,
    );
    return group([
      "`",
      replaceEndOfLine(leadingWhitespaces),
      dedentToRoot(align(hasLeadingNewline ? indentation : "", content)),
      replaceEndOfLine(trailingWhitespaces),
      "`",
    ]);
  }

  const leadingLineBreak = leadingWhitespaces.length ? line : softline;
  const trailingLineBreak = trailingWhitespaces.length ? line : softline;

  return group(
    [
      "`",
      noIndent
        ? dedentToRoot([leadingLineBreak, content])
        : indent([leadingLineBreak, content]),
      trailingLineBreak,
      "`",
    ],
    { shouldBreak: willBreak(contentDoc) },
  );
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
  const leadingWhitespace = LINE_INDENTATION_PATTERN.exec(lastLine)![0];
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
  {
    lineBreakBeforeExpressions,
    interpolationTabWidth,
    escapeClosingScript = false,
  }: {
    lineBreakBeforeExpressions?: ReadonlySet<number>;
    interpolationTabWidth?: number;
    escapeClosingScript?: boolean;
  } = {},
) {
  let hasRootExpressions = false;
  const expressions = expressionDocs.map((doc) => {
    if (!usesLiteralRoot(doc)) return doc;
    hasRootExpressions = true;
    return label(EXPRESSION_LABEL, doc);
  });
  const restoredExpressions = expressionDocs.length
    ? new Set<number>()
    : undefined;
  const contentDoc = mapDoc(doc, (doc) => {
    if (typeof doc !== "string") {
      return doc;
    }
    if (!expressionDocs.length)
      return literalTextToDoc(doc, escapeClosingScript);
    const components = doc.split(placeholderRegex);
    if (components.length === 1)
      return literalTextToDoc(doc, escapeClosingScript);
    const parts: Doc[] = [];
    let lineIndentation = "";
    for (let i = 0; i < components.length; i++) {
      const component = components[i]!;
      if (i % 2 === 0) {
        if (
          interpolationTabWidth !== undefined &&
          (i === 0 || component.includes("\n"))
        ) {
          const lastLine = component.slice(component.lastIndexOf("\n") + 1);
          lineIndentation = LINE_INDENTATION_PATTERN.exec(lastLine)![0];
        }
        if (!component) {
          continue;
        }
        const literal = literalTextToDoc(component, escapeClosingScript);
        if (Array.isArray(literal)) {
          for (const part of literal) parts.push(part);
        } else parts.push(literal);
      } else {
        const placeholderIndex = Number(component);
        restoredExpressions?.add(placeholderIndex);
        const formattedTextBeforeExpression = components[i - 1]!;
        if (
          lineBreakBeforeExpressions?.has(placeholderIndex) &&
          !EXPRESSION_LINE_BREAK_PATTERN.test(formattedTextBeforeExpression)
        ) {
          const previousPart = parts.at(-1);
          if (typeof previousPart === "string") {
            let end = previousPart.length;
            while (
              previousPart[end - 1] === " " ||
              previousPart[end - 1] === "\t"
            )
              end--;
            parts[parts.length - 1] = previousPart.slice(0, end);
          }
          parts.push(hardline);
          if (interpolationTabWidth !== undefined) {
            parts.push(lineIndentation);
          }
        }
        const expressionDoc = expressions[placeholderIndex]!;
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
  return hasRootExpressions ? label(EXPRESSIONS_LABEL, contentDoc) : contentDoc;
}

function literalTextToDoc(text: string, escapeClosingScript: boolean): Doc {
  text = text.replace(TEMPLATE_ESCAPE_PATTERN, "\\$1");
  if (escapeClosingScript) text = text.replace(CLOSING_SCRIPT_PATTERN, "<\\/");
  if (!text.includes("\n")) return text;
  // Literal lines inherit the template margin, not the language's AST indent.
  const lines = text.split("\n");
  const parts: Doc[] = [lines[0]!];
  for (let i = 1; i < lines.length; i++) {
    // Trim generated margin on empty lines, preserving whitespace in the input.
    if (i > 1 && lines[i - 1] === "") parts.push(trim);
    parts.push(literalline, lines[i]!);
  }
  return parts;
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

const PLACEHOLDER_CHARACTERS = "abcdefghijklmnopqrstuvwxyz0123456789";
export function randomUUID() {
  let id = "";
  for (let i = 0; i < 16; i++) {
    id +=
      PLACEHOLDER_CHARACTERS[
        Math.floor(Math.random() * PLACEHOLDER_CHARACTERS.length)
      ];
  }
  return id;
}

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
  return text.replace(REGEX_ESCAPE_PATTERN, "\\$&");
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
