import { Expression, Comment, TemplateLiteral } from "estree";
import { AstPath, Options } from "prettier";
import { builders } from "prettier/doc";
import { InternalPrintFun } from "../types.js";

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
      options.plugins?.map((p) => (p as { name?: string }).name) ?? []
    ).includes(pluginName)
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
