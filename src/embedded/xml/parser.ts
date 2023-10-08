import type { Parser } from "prettier";
import { parse as xmlToolsParse } from "@xml-tools/parser";
import type {
  CstElement,
  CstNode,
  ILexingError,
  IRecognitionException,
} from "chevrotain";
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

function createSyntaxErrorFromLexError(lexError: ILexingError) {
  const options: ErrorOptions = {
    loc: {
      start: {
        line: lexError.line,
        column: lexError.column,
      },
      end: {
        line: lexError.line,
        column: lexError.column + lexError.length,
      },
    },
  };
  const error = new SyntaxError(
    `${lexError.message} (${options.loc.start.line}:${options.loc.start.column})`,
    {
      cause: lexError,
    },
  );
  Object.assign(error, options);
  return error;
}

function createSyntaxErrorFromParseError(parseError: IRecognitionException) {
  const options: ErrorOptions = {
    loc: {
      start: {
        line: parseError.token.startLine ?? NaN,
        column: parseError.token.startColumn ?? NaN,
      },
      end: {
        line: parseError.token.endLine ?? NaN,
        column: parseError.token.endColumn ?? NaN,
      },
    },
  };
  const error = new SyntaxError(
    `${parseError.message} (${options.loc.start.line}:${options.loc.start.column})`,
    {
      cause: parseError,
    },
  );
  Object.assign(error, options);
  return error;
}

export const parser: Parser<CstNode> = {
  parse(text: string) {
    const { lexErrors, parseErrors, cst } = xmlToolsParse(text);

    // If there are any lexical errors, throw the first of them as an error.
    if (lexErrors.length > 0) {
      const lexError = lexErrors[0];
      throw createSyntaxErrorFromLexError(lexError);
    }

    // if there are any parse errors, log them and try to fix the cst
    // so the printer can properly handle it.
    if (parseErrors.length > 0) {
      let shouldPruneCst = false;
      for (const parseError of parseErrors) {
        if (parseError.name !== "MismatchedTokenException") {
          // we cannot recover from other types of error
          // so we throw it
          throw createSyntaxErrorFromParseError(parseError);
        }
        if (
          parseError.message ===
          "Expecting token of type --> OPEN <-- but found --> '' <--"
        ) {
          // recover from prolog only error
          shouldPruneCst = true;
          continue;
        }
        if (
          parseError.message ===
          "Expecting token of type --> EOF <-- but found --> '<' <--"
        ) {
          // multi-element fragments
          // we cannot recover from this error because of the information loss
          // so we throw it with informations and reparse the rest in the next pass
          throw createSyntaxErrorFromParseError(parseError);
        }
      }
      if (shouldPruneCst) {
        pruneCst(cst);
      }
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

function pruneCst(cstNode: CstNode) {
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
      pruneCst(cstElement);
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
