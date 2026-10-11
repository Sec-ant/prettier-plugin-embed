import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import xmlPlugin from "@prettier/plugin-xml";
import { describe, expect, it } from "vitest";
import {
  loadXmlParser,
  parser,
  parseWithXmlPlugin,
  parseXml,
} from "../src/embedded/xml/parser.js";

describe("embedded XML parser", () => {
  it("uses the last loaded XML parser from a shared configuration", async () => {
    const ast = { name: "consumer XML AST" };
    const options = {
      plugins: [
        xmlPlugin,
        new URL("file:///plugin.js"),
        {},
        { parsers: { xml: { parse: () => ast } } },
      ],
    };
    expect(await parseXml("<root />", options as never)).toBe(ast);
  });

  it("reports missing consumer XML support", async () => {
    const error = new Error("missing consumer XML plugin");
    await expect(
      parseXml(
        "<root />",
        { plugins: [{}, new URL("file:///plugin.js")] } as never,
        async () => {
          throw error;
        },
      ),
    ).rejects.toBe(error);
  });

  it("accepts XML module objects and default exports", async () => {
    for (const plugin of [xmlPlugin, { default: xmlPlugin }, {}]) {
      const loaded = await loadXmlParser(undefined, async () => plugin);
      expect((await loaded.parse("<root />", {} as never)).name).toBe(
        "document",
      );
    }
  });
  const isolatedModuleUrl = pathToFileURL(
    path.join(tmpdir(), "embed-isolated-consumer", "index.js"),
  );
  it.each([
    { text: "<root />", boundary: [] },
    { text: "text<root />", boundary: [0, 3] },
    { text: "<a/><b/>", boundary: [4] },
    { text: "<a/>text", boundary: [4] },
    { text: "<a/>\r\n<b/>", boundary: [6] },
    { text: '<?xml version="1.0"?>', boundary: [] },
    { text: "<!-- only a comment -->", boundary: [] },
  ])("uses the loaded XML parser for $text", async ({ text, boundary }) => {
    const options = { __embeddedXmlFragmentRecoverIndex: [] };
    const ast = await parseWithXmlPlugin(
      text,
      options as never,
      xmlPlugin.parsers!.xml!,
    );
    expect(ast.name).toBe("document");
    expect(options.__embeddedXmlFragmentRecoverIndex).toEqual(boundary);
  });

  it("keeps the loaded XML parser's syntax diagnostics", async () => {
    await expect(
      parseWithXmlPlugin("<root a=>", {} as never, xmlPlugin.parsers!.xml!),
    ).rejects.toMatchObject({ loc: { start: { line: 1, column: 9 } } });
  });

  it("removes the synthetic element from older XML parser ASTs", async () => {
    const xmlParser = {
      parse(text: string) {
        if (text === "") {
          throw new Error(
            "Expecting token of type --> OPEN <-- but found --> '' <--",
          );
        }
        return {
          name: "document",
          children: { element: [{ name: "element" }] },
          location: { startOffset: 0 },
        };
      },
    };
    const ast = await parseWithXmlPlugin("", {} as never, xmlParser as never);
    expect(ast.children).toEqual({});
    expect(ast.location).toEqual({ startOffset: 0, endOffset: -1 });
  });

  it.each([
    "consumer error",
    new Error("consumer error"),
    Object.assign(new Error("Expecting token of type --> EOF <--"), {
      loc: { start: { line: Number.NaN, column: Number.NaN } },
    }),
    Object.assign(new Error("consumer error"), {
      loc: { start: { line: 1, column: Number.NaN } },
    }),
  ])(
    "preserves errors without a recoverable fragment location",
    async (error) => {
      await expect(
        parseWithXmlPlugin(
          "<root>",
          {} as never,
          {
            parse() {
              throw error;
            },
          } as never,
        ),
      ).rejects.toBe(error);
    },
  );
  it("parses a complete XML document with the formatter's native AST", async () => {
    const ast = await parser.parse(
      `<?xml version="1.0"?>
<!DOCTYPE root SYSTEM "root.dtd">
<!-- before -->
<root enabled="true">text &amp; more<![CDATA[ raw ]]><!-- inside --><?pi data?><child/></root>
<!-- after -->`,
      {} as never,
    );

    expect(ast.name).toBe("document");
    expect(ast.prolog).toMatchObject({ name: "prolog" });
    expect(ast.docTypeDecl).toMatchObject({ name: "docTypeDecl" });
    expect(ast.element).toMatchObject({ name: "element", Name: "root" });
    expect(ast.misc).toHaveLength(2);
    expect(parser.locStart(ast)).toBe(0);
    expect(parser.locEnd(ast)).toBeGreaterThan(0);
    expect(parser.locStart({} as never)).toBe(0);
    expect(parser.locEnd({} as never)).toBeNaN();
  });

  it("loads the parser from the XML plugin when direct resolution is unavailable", async () => {
    const xmlParser = await loadXmlParser(undefined, async () => {
      throw new Error("not directly resolvable");
    });
    expect((await xmlParser.parse("<root />", {} as never)).name).toBe(
      "document",
    );
  });

  it("resolves the XML plugin from the consumer file location", async () => {
    const xmlParser = await loadXmlParser(
      fileURLToPath(import.meta.url),
      async () => {
        throw new Error("not directly resolvable");
      },
      isolatedModuleUrl,
    );

    expect((await xmlParser.parse("<root />", {} as never)).name).toBe(
      "document",
    );
  });

  it("reports a missing XML plugin with the original resolution error", async () => {
    const error = new Error("not directly resolvable");
    await expect(
      loadXmlParser(
        fileURLToPath(isolatedModuleUrl),
        async () => {
          throw error;
        },
        isolatedModuleUrl,
      ),
    ).rejects.toMatchObject({
      message: expect.stringContaining('"@prettier/plugin-xml"'),
      cause: error,
    });
  });

  it("reports lexical errors with source locations", async () => {
    await expect(parser.parse("<!--", {} as never)).rejects.toMatchObject({
      message: expect.stringContaining("(1:2)"),
      loc: { start: { line: 1, column: 2 } },
    });
  });

  it("reports unrecoverable parser errors", async () => {
    await expect(parser.parse("<root>", {} as never)).rejects.toMatchObject({
      message: expect.stringContaining("(NaN:NaN)"),
    });
  });

  it("reports parser error locations when the XML parser has token positions", async () => {
    await expect(parser.parse("<root a=>", {} as never)).rejects.toMatchObject({
      message: expect.stringContaining("(1:9)"),
      loc: {
        start: { line: 1, column: 9 },
        end: { line: 1, column: 9 },
      },
    });
  });

  it("records text-plus-element fragment boundaries", async () => {
    const options = { __embeddedXmlFragmentRecoverIndex: [] };
    await parser.parse("text<foo/>", options as never);
    expect(options.__embeddedXmlFragmentRecoverIndex).toEqual([0, 3]);
  });

  it("records the boundary between adjacent element fragments", async () => {
    const options = { __embeddedXmlFragmentRecoverIndex: [] };
    await parser.parse("<a/><b/>", options as never);
    expect(options.__embeddedXmlFragmentRecoverIndex).toEqual([4]);
  });

  it("returns the text fragment before parsing the next element", async () => {
    const options = { __embeddedXmlFragmentRecoverIndex: [] };
    const ast = await parser.parse("text<foo/>", options as never);

    expect(ast.element).toBeNull();
    expect(options.__embeddedXmlFragmentRecoverIndex).toEqual([0, 3]);
  });

  it("retains prolog and comment nodes in fragments without elements", async () => {
    const prolog = await parser.parse('<?xml version="1.0"?>', {} as never);
    const misc = await parser.parse("<!-- only a comment -->", {} as never);

    expect(prolog.prolog).toMatchObject({ name: "prolog" });
    expect(prolog.element).toBeNull();
    expect(misc.misc).toMatchObject([
      { name: "misc", Comment: "<!-- only a comment -->" },
    ]);
  });

  it("records redundant trailing fragments for a later parse pass", async () => {
    const options = { __embeddedXmlFragmentRecoverIndex: [] };
    await parser.parse("<a/>text", options as never);

    expect(options.__embeddedXmlFragmentRecoverIndex).toEqual([4]);
  });
});
