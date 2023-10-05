import { Expression, Comment, TemplateLiteral } from "estree";
import { AstPath, Options } from "prettier";
import { builders } from "prettier/doc";

import { InternalPrintFun } from "../types.js";
import { name as embeddedNopName } from "./nop/index.js";

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

export function compareNames(name1: string, name2: string) {
  return name1 === embeddedNopName
    ? -1
    : name2 === embeddedNopName
    ? 1
    : name1 < name2
    ? -1
    : name1 > name2
    ? 1
    : 0;
}
