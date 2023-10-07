import type { Expression, Comment, TemplateLiteral } from "estree";
import type { AstPath, Options } from "prettier";
import { builders } from "prettier/doc";
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

export function uuidV4() {
  function s(n: number) {
    return h((Math.random() * (1 << (n << 2))) ^ Date.now()).slice(-n);
  }
  function h(n: number) {
    return (n | 0).toString(16);
  }
  return [
    s(4) + s(4),
    s(4),
    "4" + s(3), // UUID version 4
    h(8 | (Math.random() * 4)) + s(3), // {8|9|A|B}xxx
    // s(4) + s(4) + s(4),
    Date.now().toString(16).slice(-10) + s(2), // Use timestamp to avoid collisions
  ].join("-");
}
