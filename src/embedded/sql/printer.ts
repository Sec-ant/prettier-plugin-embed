import { type Options, type Plugin, type Printer, util } from "prettier";
import { builders } from "prettier/doc";
import { language } from "./language.js";
import type { SqlNode } from "./parser.js";

const { group, indent, join, line } = builders;

// A comment on the template's first line would otherwise follow a node from
// the fragment prefix, which isn't printed
const attachCommentToTemplate = (
  comment: { precedingNode?: SqlNode; followingNode?: SqlNode },
  _text: string,
  _options: unknown,
  { prefixLength = 0 }: SqlNode,
) => {
  if (
    comment.followingNode &&
    comment.precedingNode &&
    comment.precedingNode.range![1] <= prefixLength
  ) {
    util.addLeadingComment(comment.followingNode, comment);
    return true;
  }
  return false;
};

// The printer of the active formatter, including one that a configuration
// overrides
const getSqlCstPrinter = ({
  plugins,
}: Pick<Options, "plugins">): Printer<SqlNode> =>
  plugins!.findLast(
    (plugin): plugin is Plugin =>
      typeof plugin === "object" &&
      "printers" in plugin &&
      plugin.printers?.["sql-cst"] !== undefined,
  )!.printers!["sql-cst"]!;

export const printer: Printer<SqlNode> = {
  print(path, options, print, args) {
    const {
      node,
      root: { prefixLength = 0 },
    } = path;
    // Print only what comes from the template
    if (node.range && node.range[0] < prefixLength) {
      const isFromPrefix = ({ range }: SqlNode) => range![1] <= prefixLength;
      const printOperator = () =>
        Array.isArray(node.operator)
          ? join(
              " ",
              node.operator.map((_, index) => print(["operator", index])),
            )
          : print("operator");
      if (isFromPrefix(node)) {
        throw new Error(`Unexpected "${node.type}" in the SQL fragment.`);
      }
      switch (node.type) {
        case "select_clause":
          if (!node.modifiers!.length) {
            return print("columns");
          }
          break;
        case "from_clause":
          return print("expr");
        case "list_expr":
          if (isFromPrefix(node.items![0]!)) {
            return [
              ", ",
              join(
                [",", line],
                path
                  .map((_, index) => (index ? group(print()) : ""), "items")
                  .slice(1),
              ),
            ];
          }
          break;
        case "binary_expr":
          if (isFromPrefix(node.left!)) {
            return [printOperator(), " ", print("right")];
          }
          break;
        case "join_expr":
          if (isFromPrefix(node.left!) && node.operator !== ",") {
            return group([
              printOperator(),
              " ",
              print("right"),
              node.specification ? indent([line, print("specification")]) : "",
            ]);
          }
      }
    }
    return getSqlCstPrinter(options).print(path, options, print, args);
  },
  embed: (path, options) =>
    getSqlCstPrinter(options).embed?.(path, options) ?? null,
  printComment: (path, options) =>
    getSqlCstPrinter(options).printComment!(path, options),
  canAttachComment: ({ type }) =>
    typeof type === "string" &&
    type !== "line_comment" &&
    type !== "block_comment",
  isBlockComment: ({ type }) => type === "block_comment",
  handleComments: {
    endOfLine: attachCommentToTemplate,
    remaining: attachCommentToTemplate,
  },
};

declare module "../types.js" {
  interface EmbeddedPrinters {
    [language]: Printer;
  }
}
