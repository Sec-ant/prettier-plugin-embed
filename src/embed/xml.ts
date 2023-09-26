import type { AstPath, Printer, Options, Doc } from "prettier";
import type { TaggedTemplateExpression, TemplateLiteral } from "estree";

import { builders } from "prettier/doc.js";
const { label, softline, literalline, dedentToRoot } = builders;

async function printEmbedXml(
  textToDoc: (text: string, options: Options) => Promise<Doc>,
  print: (
    selector?:
      | string
      | number
      | Array<string | number>
      | AstPath<TemplateLiteral>,
  ) => Doc,
  path: AstPath<TemplateLiteral>,
  options: Options,
): Promise<Doc | undefined> {
  const { node } = path;
  return undefined;
}

function printXml(path: AstPath<TemplateLiteral>) {
  if (isXml(path)) {
    return printEmbedXml;
  }
}

function isXml({
  node,
  parent,
}: AstPath<TemplateLiteral | TaggedTemplateExpression> & {
  node: TemplateLiteral;
}) {
  return (
    parent?.type === "TaggedTemplateExpression" &&
    node.quasis.length === 1 &&
    parent.tag.type === "Identifier" &&
    (parent.tag.name === "xml" || parent.tag.name === "opf")
  );
}

export default printXml;
