import type {
  CstElement,
  CstNode,
  ILexingError,
  IRecognitionException,
  IToken,
} from "chevrotain";
import type { Options, Parser } from "prettier";
import { language } from "./language.js";

// Simplified AST node type (matching @prettier/plugin-xml format)
// The AST structure is dynamic based on node type, so we use Record<string, unknown>
type SimplifiedNode = Record<string, unknown>;

/**
 * Transforms a Chevrotain CST node into a simplified AST format
 * that @prettier/plugin-xml's printer expects.
 *
 * This is needed because @xml-tools/parser returns raw CST with
 * node.children.Name[0].image, but the printer expects node.Name.
 *
 * This function mirrors the logic in @prettier/plugin-xml's internal simplifyCST.
 */
function simplifyCST(node: CstNode): SimplifiedNode {
  const children = node.children;

  // Helper to get image from first token
  const getImage = (tokens: IToken[] | undefined): string | null =>
    tokens?.[0]?.image ?? null;

  // Helper to simplify array of CstNodes
  const simplifyArray = (nodes: CstElement[] | undefined): SimplifiedNode[] =>
    nodes?.filter(isCstNode).map(simplifyCST) ?? [];

  // Helper to simplify single CstNode
  const simplifyOne = (
    nodes: CstElement[] | undefined,
  ): SimplifiedNode | null =>
    nodes?.[0] && isCstNode(nodes[0]) ? simplifyCST(nodes[0]) : null;

  switch (node.name) {
    case "document":
      return {
        name: node.name,
        location: node.location,
        prolog: simplifyOne(children.prolog),
        docTypeDecl: simplifyOne(children.docTypeDecl),
        element: simplifyOne(children.element),
        // Filter out misc nodes that only contain SEA_WS (whitespace)
        misc: (children.misc ?? [])
          .filter(
            (child): child is CstNode =>
              isCstNode(child) && !child.children.SEA_WS,
          )
          .map(simplifyCST),
      };
    case "prolog":
      return {
        name: node.name,
        location: node.location,
        XMLDeclOpen: getImage(children.XMLDeclOpen as IToken[] | undefined),
        attribute: simplifyArray(children.attribute),
        SPECIAL_CLOSE: getImage(children.SPECIAL_CLOSE as IToken[] | undefined),
      };
    case "docTypeDecl":
      return {
        name: node.name,
        location: node.location,
        DocType: getImage(children.DocType as IToken[] | undefined),
        Name: getImage(children.Name as IToken[] | undefined),
        externalID: simplifyOne(children.externalID),
        CLOSE: getImage(children.CLOSE as IToken[] | undefined),
      };
    case "externalID":
      return {
        name: node.name,
        location: node.location,
        Public: getImage(children.Public as IToken[] | undefined),
        System: getImage(children.System as IToken[] | undefined),
        PubIDLiteral: getImage(children.PubIDLiteral as IToken[] | undefined),
        SystemLiteral: getImage(children.SystemLiteral as IToken[] | undefined),
      };
    case "element":
      return {
        name: node.name,
        location: node.location,
        OPEN: getImage(children.OPEN as IToken[] | undefined),
        Name: getImage(children.Name as IToken[] | undefined),
        attribute: simplifyArray(children.attribute),
        START_CLOSE: getImage(children.START_CLOSE as IToken[] | undefined),
        content: simplifyOne(children.content),
        SLASH_OPEN: getImage(children.SLASH_OPEN as IToken[] | undefined),
        END_NAME: getImage(children.END_NAME as IToken[] | undefined),
        END: getImage(children.END as IToken[] | undefined),
        SLASH_CLOSE: getImage(children.SLASH_CLOSE as IToken[] | undefined),
      };
    case "attribute":
      return {
        name: node.name,
        location: node.location,
        Name: getImage(children.Name as IToken[] | undefined),
        EQUALS: getImage(children.EQUALS as IToken[] | undefined),
        STRING: getImage(children.STRING as IToken[] | undefined),
      };
    case "content":
      return {
        name: node.name,
        location: node.location,
        chardata: simplifyArray(children.chardata),
        element: simplifyArray(children.element),
        reference: simplifyArray(children.reference),
        // These should remain as IToken arrays (not mapped to .image)
        CData: (children.CData as IToken[] | undefined) ?? [],
        Comment: (children.Comment as IToken[] | undefined) ?? [],
        PROCESSING_INSTRUCTION:
          (children.PROCESSING_INSTRUCTION as IToken[] | undefined) ?? [],
      };
    case "chardata":
      return {
        name: node.name,
        location: node.location,
        SEA_WS: getImage(children.SEA_WS as IToken[] | undefined),
        TEXT: getImage(children.TEXT as IToken[] | undefined),
      };
    case "reference":
      return {
        name: node.name,
        location: node.location,
        EntityRef: getImage(children.EntityRef as IToken[] | undefined),
        CharRef: getImage(children.CharRef as IToken[] | undefined),
      };
    case "misc":
      return {
        name: node.name,
        location: node.location,
        Comment: getImage(children.Comment as IToken[] | undefined),
        PROCESSING_INSTRUCTION: getImage(
          children.PROCESSING_INSTRUCTION as IToken[] | undefined,
        ),
        SEA_WS: getImage(children.SEA_WS as IToken[] | undefined),
      };
    default:
      return {
        name: node.name,
        location: node.location,
        ...Object.fromEntries(
          Object.entries(children).map(([key, value]) => [
            key,
            Array.isArray(value)
              ? value.map((v) =>
                  isCstNode(v) ? simplifyCST(v) : (v as IToken).image,
                )
              : value,
          ]),
        ),
      };
  }
}

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
        line: parseError.token.startLine ?? Number.NaN,
        column: parseError.token.startColumn ?? Number.NaN,
      },
      end: {
        line: parseError.token.endLine ?? Number.NaN,
        column: parseError.token.endColumn ?? Number.NaN,
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

// We return a simplified AST, not the raw Chevrotain CstNode.
// The AST structure matches what @prettier/plugin-xml's printer expects.
export const parser: Parser<SimplifiedNode> = {
  async parse(text: string, options: Options) {
    // Custom parsing - use @xml-tools/parser and simplify CST to AST format
    // that @prettier/plugin-xml's printer expects
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

    // For fragment recovery, simplify the CST to the AST format
    return simplifyCST(cst);
  },
  astFormat: "xml",
  locStart(node: SimplifiedNode) {
    const loc = node.location as { startOffset?: number } | undefined;
    return loc?.startOffset ?? 0;
  },
  locEnd(node: SimplifiedNode) {
    const loc = node.location as { endOffset?: number } | undefined;
    return loc?.endOffset ?? Number.NaN;
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
  return (
    "name" in cstElement && "children" in cstElement && "location" in cstElement
  );
}

declare module "../types.js" {
  interface EmbeddedParsers {
    [language]: Parser;
  }
}
