import type { Expression, Comment, TemplateLiteral } from "estree";
import type { AstPath, Options } from "prettier";
import { builders } from "prettier/doc";
import ShortUniqueId from "short-unique-id";
import type { InternalPrintFun } from "../types.js";

const { group, indent, softline, lineSuffixBoundary } = builders;

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

export function throwIfPluginIsNotFound(
  pluginName: string,
  options: Options,
  lang: string,
) {
  if (
    !(
      options.plugins?.some(
        (p) => (p as { name?: string }).name?.includes(pluginName) ?? false,
      ) ?? false
    )
  ) {
    throw new Error(
      `Cannot format embedded language "${lang}" because plugin "${pluginName}" is not loaded.`,
    );
  }
}

export function insertEmbeddedLanguageName(
  names: string[],
  name: string,
  headName: string,
) {
  if (name === headName) {
    names.unshift(name);
    return;
  }
  let low = 0;
  let high = names.length;
  while (low < high) {
    const mid = (low + high) >>> 1;
    if (names[mid] === headName) {
      names.push(name);
      return;
    }
    if (names[mid] < name) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  names.splice(low, 0, name);
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

// this weird generic can provide autocomplete prompts of type T[number] to users
// while also accepts any string
export type MakeOptionLangType<T extends readonly string[]> =
  | (T[number][] & string[])
  | string[];

export type MakeLangsHolderType<T extends readonly string[]> = {
  [key in T[number]]: void;
};
