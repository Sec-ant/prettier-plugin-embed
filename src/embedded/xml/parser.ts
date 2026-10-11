import { createRequire } from "node:module";
import path from "node:path";
import type { Options, Parser, ParserOptions } from "prettier";
import { language } from "./language.js";

// Simplified AST node type (matching @prettier/plugin-xml format)
// The AST structure is dynamic based on node type, so we use Record<string, unknown>
type SimplifiedNode = Record<string, unknown>;

interface CstToken {
  image: string;
}

interface CstNode {
  name: string;
  location: unknown;
  children: Record<string, CstElement[]>;
}

type CstElement = CstNode | CstToken;

interface XmlToolsModule {
  parse: (text: string) => unknown;
}

interface LexingError {
  line: number;
  column: number;
  length: number;
  message: string;
}

interface RecognitionException {
  name: string;
  message: string;
  token: {
    startLine?: number;
    startColumn?: number;
    endLine?: number;
    endColumn?: number;
    startOffset: number;
    endOffset?: number;
  };
}

/**
 * Transforms a Chevrotain CST node into a simplified AST format
 * that @prettier/plugin-xml's printer expects.
 *
 * This is needed because @xml-tools/parser returns raw CST with
 * node.children.Name[0].image, but the printer expects node.Name.
 *
 * This function mirrors the logic in @prettier/plugin-xml's internal simplifyCST.
 */
export function simplifyCST(node: CstNode): SimplifiedNode {
  const simplifiedNode = simplifyCSTNode(node);
  // Older @prettier/plugin-xml releases inspect the original Chevrotain CST.
  // Keep it available without exposing duplicate children to AST traversal.
  Object.defineProperty(simplifiedNode, "children", { value: node.children });
  return simplifiedNode;
}

function simplifyCSTNode(node: CstNode): SimplifiedNode {
  const children = node.children;

  // Helper to get image from first token
  const getImage = (tokens: CstToken[] | undefined): string | null =>
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
        XMLDeclOpen: getImage(children.XMLDeclOpen as CstToken[] | undefined),
        attribute: simplifyArray(children.attribute),
        SPECIAL_CLOSE: getImage(
          children.SPECIAL_CLOSE as CstToken[] | undefined,
        ),
      };
    case "docTypeDecl":
      return {
        name: node.name,
        location: node.location,
        DocType: getImage(children.DocType as CstToken[] | undefined),
        Name: getImage(children.Name as CstToken[] | undefined),
        externalID: simplifyOne(children.externalID),
        CLOSE: getImage(children.CLOSE as CstToken[] | undefined),
      };
    case "externalID":
      return {
        name: node.name,
        location: node.location,
        Public: getImage(children.Public as CstToken[] | undefined),
        System: getImage(children.System as CstToken[] | undefined),
        PubIDLiteral: getImage(children.PubIDLiteral as CstToken[] | undefined),
        SystemLiteral: getImage(
          children.SystemLiteral as CstToken[] | undefined,
        ),
      };
    case "element":
      return {
        name: node.name,
        location: node.location,
        OPEN: getImage(children.OPEN as CstToken[] | undefined),
        Name: getImage(children.Name as CstToken[] | undefined),
        attribute: simplifyArray(children.attribute),
        START_CLOSE: getImage(children.START_CLOSE as CstToken[] | undefined),
        content: simplifyOne(children.content),
        SLASH_OPEN: getImage(children.SLASH_OPEN as CstToken[] | undefined),
        END_NAME: getImage(children.END_NAME as CstToken[] | undefined),
        END: getImage(children.END as CstToken[] | undefined),
        SLASH_CLOSE: getImage(children.SLASH_CLOSE as CstToken[] | undefined),
      };
    case "attribute":
      return {
        name: node.name,
        location: node.location,
        Name: getImage(children.Name as CstToken[] | undefined),
        EQUALS: getImage(children.EQUALS as CstToken[] | undefined),
        STRING: getImage(children.STRING as CstToken[] | undefined),
      };
    case "content":
      return {
        name: node.name,
        location: node.location,
        chardata: simplifyArray(children.chardata),
        element: simplifyArray(children.element),
        reference: simplifyArray(children.reference),
        // These should remain as token arrays (not mapped to .image)
        CData: (children.CData as CstToken[] | undefined) ?? [],
        Comment: (children.Comment as CstToken[] | undefined) ?? [],
        PROCESSING_INSTRUCTION:
          (children.PROCESSING_INSTRUCTION as CstToken[] | undefined) ?? [],
      };
    case "chardata":
      return {
        name: node.name,
        location: node.location,
        SEA_WS: getImage(children.SEA_WS as CstToken[] | undefined),
        TEXT: getImage(children.TEXT as CstToken[] | undefined),
      };
    case "reference":
      return {
        name: node.name,
        location: node.location,
        EntityRef: getImage(children.EntityRef as CstToken[] | undefined),
        CharRef: getImage(children.CharRef as CstToken[] | undefined),
      };
    case "misc":
      return {
        name: node.name,
        location: node.location,
        Comment: getImage(children.Comment as CstToken[] | undefined),
        PROCESSING_INSTRUCTION: getImage(
          children.PROCESSING_INSTRUCTION as CstToken[] | undefined,
        ),
        SEA_WS: getImage(children.SEA_WS as CstToken[] | undefined),
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
                  isCstNode(v) ? simplifyCST(v) : (v as CstToken).image,
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

export async function loadXmlToolsParser(
  filepath?: string,
  loadDirectly: () => Promise<XmlToolsModule> = () =>
    import("@xml-tools/parser"),
) {
  try {
    return (await loadDirectly()) as XmlToolsModule;
  } catch (error) {
    // pnpm keeps transitive dependencies private to their owning package.
    // The XML formatter already brings this parser when XML support is used.
    try {
      const consumerRequire = createRequire(
        filepath ? path.resolve(filepath) : `${process.cwd()}/package.json`,
      );
      const xmlPluginEntry = consumerRequire.resolve("@prettier/plugin-xml");
      const xmlPluginRequire = createRequire(xmlPluginEntry);
      return xmlPluginRequire("@xml-tools/parser") as XmlToolsModule;
    } catch {
      throw new Error(
        'Formatting embedded XML requires the consumer to install "@prettier/plugin-xml".',
        { cause: error },
      );
    }
  }
}

function createSyntaxErrorFromLexError(lexError: LexingError) {
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

function createSyntaxErrorFromParseError(parseError: RecognitionException) {
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
  async parse(text: string, options: ParserOptions<SimplifiedNode>) {
    const embeddedOptions = options as unknown as Options;
    // Custom parsing - use @xml-tools/parser and simplify CST to AST format
    // that @prettier/plugin-xml's printer expects
    const { parse: xmlToolsParse } = await loadXmlToolsParser(
      embeddedOptions.filepath,
    );
    const { lexErrors, parseErrors, cst } = xmlToolsParse(text) as unknown as {
      cst: CstNode;
      lexErrors: LexingError[];
      parseErrors: RecognitionException[];
    };

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
          // Surface unsupported parser errors with their source location.
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
          // Parse the available CST, record the fragment boundary, and parse the remainder on the next pass.
          embeddedOptions.__embeddedXmlFragmentRecoverIndex?.splice(
            0,
            embeddedOptions.__embeddedXmlFragmentRecoverIndex.length,
            parseError.token.startOffset,
          );
          break;
        }
        if (
          /Expecting token of type --> OPEN <-- but found --> '[\s\S]+' <--/.test(
            parseError.message,
          )
        ) {
          // Record the fragment boundary and parse the remainder on the next pass.
          if (
            parseError.token.endOffset === undefined ||
            Number.isNaN(parseError.token.endOffset)
          ) {
            // An end offset identifies where the next fragment begins.
            break;
          }
          embeddedOptions.__embeddedXmlFragmentRecoverIndex?.splice(
            0,
            embeddedOptions.__embeddedXmlFragmentRecoverIndex.length,
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
    const cstElements = cstNodeChildren[name]!;
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
