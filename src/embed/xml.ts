import type { AstPath, Options, Doc } from "prettier";
import { builders, utils } from "prettier/doc.js";
import type { Comment, Expression, TemplateLiteral } from "estree";
import { v4 } from "uuid";
import type { InternalPrintFun } from "./types.js";

const { label, softline, hardline, line, group, indent, lineSuffixBoundary } =
  builders;
const { mapDoc } = utils;

interface PrettierPluginXmlOptions extends Options {
  xmlSelfClosingSpace?: boolean;
  xmlWhitespaceSensitivity?: "strict" | "preserve" | "ignore";
  xmlSortAttributesByKey?: boolean;
  xmlQuoteAttributes?: "preserve" | "single" | "double";
}

const UUID = v4();
const PLACEHOLDER_REGEX = new RegExp(UUID + "-(\\d+)", "g");

async function printEmbedXml(
  textToDoc: (text: string, options: Options) => Promise<Doc>,
  print: InternalPrintFun,
  path: AstPath<TemplateLiteral>,
  options: PrettierPluginXmlOptions,
): Promise<Doc> {
  const { node } = path;
  const text = node.quasis
    .map((quasi, index, { length }) =>
      index === length - 1
        ? quasi.value.cooked
        : quasi.value.cooked + makePlaceholder(index),
    )
    .join("");

  const expressionDocs = printTemplateExpressions(path, print);

  // todo: topLevelCount
  const topLevelCount = 0;
  const doc = await textToDoc(text, {
    parser: "xml",
  });

  const contentDoc = mapDoc(doc, (doc) => {
    if (typeof doc !== "string") {
      return doc;
    }
    const parts = [];
    const components = doc.split(PLACEHOLDER_REGEX);
    for (let i = 0; i < components.length; i++) {
      let component = components[i];
      if (i % 2 == 0) {
        if (!component) {
          continue;
        }
        component = component.replaceAll(/([\\`]|\${)/g, "\\$1");
        // todo: __embeddedInHtml
        if (options.__embeddedInHtml) {
          component = component.replaceAll(/<\/(?=script\b)/gi, "<\\/");
        }
        parts.push(component);
      }
      const placeholderIndex = Number(
        component.match(PLACEHOLDER_REGEX)?.[1] ?? "NaN",
      );
      if (Number.isNaN(placeholderIndex)) {
        throw new TypeError("Cannot find component index number.");
      }
      parts.push(expressionDocs[placeholderIndex]);
    }
    return parts;
  });

  const leadingWhitespace = /^\s/.test(text) ? " " : "";
  const trailingWhitespace = /\s$/.test(text) ? " " : "";

  const linebreak =
    options.xmlWhitespaceSensitivity === "ignore"
      ? hardline
      : leadingWhitespace && trailingWhitespace
      ? line
      : null;

  if (linebreak) {
    return group(["`", indent([linebreak, group(contentDoc)]), linebreak, "`"]);
  }

  return label(
    { hug: false },
    group([
      "`",
      leadingWhitespace,
      topLevelCount > 1 ? indent(group(contentDoc)) : group(contentDoc),
      trailingWhitespace,
      "`",
    ]),
  );
}

function makePlaceholder(index: number) {
  return UUID + "-" + index;
}

function printTemplateExpression(
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

function printTemplateExpressions(
  path: AstPath<TemplateLiteral>,
  print: InternalPrintFun,
) {
  return path.map(
    (path) => printTemplateExpression(path, print),
    "expressions",
  );
}

export default printEmbedXml;
