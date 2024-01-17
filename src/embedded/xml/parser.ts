import type {
  CstElement,
  CstNode,
  ILexingError,
  IRecognitionException,
} from "chevrotain";
import type { Options, Parser } from "prettier";
import { language } from "./language.js";

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
  async parse(text: string, options: Options) {
    const { parse: xmlToolsParse } = await import("@xml-tools/parser");

    const { lexErrors, parseErrors, cst } = xmlToolsParse(text);

    // If there are any lexical errors, throw the first of them as an error.
    if (lexErrors.length > 0) {
      const lexError = lexErrors[0]!;
      throw createSyntaxErrorFromLexError(lexError);
    }

    // if there are any parse errors, log them and try to fix the cst
    // so the printer can properly handle it.
    if (parseErrors.length > 0) {
      let shouldPruneCst = false;
      for (const parseError of parseErrors) {
        if (
          !["MismatchedTokenException", "NotAllInputParsedException"].includes(
            parseError.name,
          )
        ) {
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
          /Expecting token of type --> EOF <-- but found --> '[\s\S]+' <--/.test(
            parseError.message,
          ) ||
          /Redundant input, expecting EOF but found: /.test(parseError.message)
        ) {
          // multi-element fragments (element + element, element + text)
          // we cannot recover from this error because of the information loss
          // so we parse the available cst for now
          // and attach the error information to the options
          // and reparse the rest in the next pass
          options.__embeddedXmlFragmentRecoverIndex?.splice(
            0,
            options.__embeddedXmlFragmentRecoverIndex.length,
            parseError.token.startOffset,
          );
          break;
        }
        if (
          /Expecting token of type --> OPEN <-- but found --> '[\s\S]+' <--/.test(
            parseError.message,
          )
        ) {
          // multi-element fragments (text + element)
          // we cannot recover from this error because of the information loss
          // so we attach the error information to the options
          // and reparse the rest in the next pass
          if (
            parseError.token.endOffset === undefined ||
            Number.isNaN(parseError.token.endOffset)
          ) {
            // we cannot recover if endOffset is not present
            break;
          }
          options.__embeddedXmlFragmentRecoverIndex?.splice(
            0,
            options.__embeddedXmlFragmentRecoverIndex.length,
            parseError.token.startOffset,
            parseError.token.endOffset,
          );
          // recover from prolog only error
          shouldPruneCst = true;
          break;
        }
        throw createSyntaxErrorFromParseError(parseError);
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
      const cstElement = cstElements[i]!;
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
    [language]: Parser;
  }
}
