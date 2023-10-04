import { Expression, Comment, TemplateLiteral } from "estree";
import { AstPath } from "prettier";
import { builders } from "prettier/doc";

const { group, indent, softline, lineSuffixBoundary } = builders;

import { InternalPrintFun } from "../types.js";

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
