import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { Options, Parser, ParserOptions, Plugin } from "prettier";
import { language } from "./language.js";

type XmlNode = Record<string, unknown>;

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

function positionToOffset(text: string, position?: Position) {
  if (
    !position ||
    !Number.isFinite(position.line) ||
    !Number.isFinite(position.column)
  ) {
    return undefined;
  }
  const lines = text.split("\n");
  return (
    lines
      .slice(0, position.line - 1)
      .reduce((offset, line) => offset + line.length + 1, 0) +
    position.column -
    1
  );
}

export async function parseWithXmlPlugin(
  text: string,
  options: ParserOptions<XmlNode>,
  xmlParser: Parser<XmlNode>,
): Promise<XmlNode> {
  try {
    return await xmlParser.parse(text, options);
  } catch (error) {
    if (!(error instanceof Error)) {
      throw error;
    }
    const { loc } = error as Error & Partial<ErrorOptions>;
    const start = positionToOffset(text, loc?.start);
    const end = positionToOffset(text, loc?.end);
    const embeddedOptions = options as unknown as Options;
    const recordBoundary = (...offsets: number[]) =>
      embeddedOptions.__embeddedXmlFragmentRecoverIndex?.splice(
        0,
        embeddedOptions.__embeddedXmlFragmentRecoverIndex.length,
        ...offsets,
      );
    const expectedOpen = "Expecting token of type --> OPEN <-- but found --> ";
    if (error.message.startsWith(`${expectedOpen}'' <--`)) {
      const ast = await xmlParser.parse(
        `${text}<prettier-embed-fragment />`,
        options,
      );
      if (ast.children) {
        delete (ast.children as Record<string, unknown>).element;
      } else {
        ast.element = null;
      }
      ast.location = {
        ...(ast.location as object),
        endOffset: text.length - 1,
      };
      return ast;
    }
    if (
      start !== undefined &&
      start > 0 &&
      (error.message.startsWith("Expecting token of type --> EOF <--") ||
        error.message.startsWith("Redundant input, expecting EOF but found: "))
    ) {
      recordBoundary(start);
      return parseWithXmlPlugin(text.slice(0, start), options, xmlParser);
    }
    if (
      start !== undefined &&
      end !== undefined &&
      error.message.startsWith(expectedOpen)
    ) {
      recordBoundary(start, end);
      return parseWithXmlPlugin("", options, xmlParser);
    }
    throw error;
  }
}

function getXmlParser(plugin: unknown) {
  if (typeof plugin !== "object" || plugin === null || !("parsers" in plugin)) {
    return undefined;
  }
  return (plugin as Plugin<XmlNode>).parsers?.xml;
}

function getModuleParser(module: unknown) {
  const plugin =
    typeof module === "object" && module !== null && "default" in module
      ? module.default
      : module;
  const xmlParser = getXmlParser(plugin);
  if (!xmlParser)
    throw new Error('The XML plugin must provide the "xml" parser.');
  return xmlParser;
}

export async function loadXmlParser(
  filepath?: string,
  loadDirectly: () => Promise<unknown> = () => import("@prettier/plugin-xml"),
  moduleUrl: string | URL = import.meta.url,
) {
  try {
    return getModuleParser(await loadDirectly());
  } catch (error) {
    for (const scope of [
      moduleUrl,
      filepath ? path.resolve(filepath) : `${process.cwd()}/package.json`,
    ]) {
      try {
        const entry = createRequire(scope).resolve("@prettier/plugin-xml");
        return getModuleParser(await import(pathToFileURL(entry).href));
      } catch {}
    }
    throw new Error(
      'Formatting embedded XML requires the consumer to install and load "@prettier/plugin-xml".',
      { cause: error },
    );
  }
}

export async function parseXml(
  text: string,
  options: ParserOptions<XmlNode>,
  loadParser: (filepath?: string) => Promise<Parser<XmlNode>> = loadXmlParser,
) {
  // The active formatter owns its AST and parser dependencies, including when
  // a shared configuration package supplies the plugin object.
  for (let index = (options.plugins?.length ?? 0) - 1; index >= 0; index--) {
    const xmlParser = getXmlParser(options.plugins![index]);
    if (xmlParser) return parseWithXmlPlugin(text, options, xmlParser);
  }
  const xmlParser = await loadParser((options as unknown as Options).filepath);
  return parseWithXmlPlugin(text, options, xmlParser);
}

export const parser: Parser<XmlNode> = {
  parse: parseXml,
  astFormat: "xml",
  locStart(node) {
    const loc = node.location as { startOffset?: number } | undefined;
    return loc?.startOffset ?? 0;
  },
  locEnd(node) {
    const loc = node.location as { endOffset?: number } | undefined;
    return loc?.endOffset ?? Number.NaN;
  },
};

declare module "../types.js" {
  interface EmbeddedParsers {
    [language]: Parser;
  }
}
