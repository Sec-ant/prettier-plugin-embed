import type { Parser } from "prettier";
import { parse as xmlToolsParse } from "@xml-tools/parser";
import type { CstElement, CstNode } from "chevrotain";
import { name } from "./name.js";

interface Position {
  line: number;
  column: number;
}

interface Loc {
  start: Position;
  end: Position;
}

interface ErrorOptions {
  loc: Loc;
}

function createError(message: string, options: ErrorOptions) {
  // TODO: Use `Error.prototype.cause` when we drop support for Node.js<18.7.0

  // Construct an error similar to the ones thrown by Prettier.
  const error = new SyntaxError(
    message +
      " (" +
      options.loc.start.line +
      ":" +
      options.loc.start.column +
      ")",
  );

  return Object.assign(error, options);
}

export const parser: Parser<CstNode> = {
  parse(text: string) {
    const { lexErrors, parseErrors, cst } = xmlToolsParse(text);

    // If there are any lexical errors, throw the first of them as an error.
    if (lexErrors.length > 0) {
      const lexError = lexErrors[0];
      throw createError(lexError.message, {
        loc: {
          start: { line: lexError.line, column: lexError.column },
          end: {
            line: lexError.line,
            column: lexError.column + lexError.length,
          },
        },
      });
    }

    // if there are any parse errors, log them and try to fix the cst
    // so the printer can properly handle it.
    if (parseErrors.length > 0) {
      // TODO: check error type when recover
      // code may be lost if we recover from any error
      // only recover from errors to support xml fragments
      // console.warn(parseErrors);
      // try to deal with prolog only fragments
      pruneAst(cst);
      // TODO: deal with multi-element fragments
    }

    // Otherwise return the CST.
    return cst;
  },
  astFormat: "xml",
  locStart(node: CstNode) {
    return node.location!.startOffset;
  },
  locEnd(node: CstNode) {
    return node.location!.endOffset ?? NaN;
  },
};

function pruneAst(cstNode: CstNode) {
  const cstNodeChildren = cstNode.children;
  for (const name in cstNodeChildren) {
    const cstElements = cstNodeChildren[name] ?? [];
    for (let i = cstElements.length - 1; i >= 0; --i) {
      const cstElement = cstElements[i];
      if (!isCstNode(cstElement)) {
        continue;
      }
      if (Object.keys(cstElement.children).length === 0) {
        cstElements.splice(i, 1);
        if (cstElements.length === 0) {
          delete cstNodeChildren[name];
        }
        continue;
      }
      pruneAst(cstElement);
    }
  }
}

function isCstNode(cstElement: CstElement): cstElement is CstNode {
  if (
    "name" in cstElement &&
    "children" in cstElement &&
    "location" in cstElement
  ) {
    return true;
  }
  return false;
}

declare module "../types.js" {
  interface EmbeddedParsers {
    [name]: Parser;
  }
}
