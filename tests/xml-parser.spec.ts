import { describe, expect, it } from "vitest";
import {
  loadXmlToolsParser,
  parser,
  simplifyCST,
} from "../src/embedded/xml/parser.js";

describe("embedded XML parser", () => {
  it("preserves future CST nodes through the generic simplifier fallback", () => {
    const child = {
      name: "futureChild",
      location: { startOffset: 2, endOffset: 4 },
      children: { Text: [{ image: "ok" }] },
    };
    const cst = {
      name: "futureNode",
      location: { startOffset: 0, endOffset: 5 },
      children: {
        Mixed: [{ image: "<" }, child],
        Additional: "future metadata",
      },
    };

    const simplified = simplifyCST(cst as never);

    expect(simplified).toMatchObject({
      name: "futureNode",
      Mixed: ["<", { name: "futureChild", Text: ["ok"] }],
      Additional: "future metadata",
    });
    expect(simplified.children).toBe(cst.children);
  });

  it("converts a complete XML document to the printer AST", async () => {
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
    const parserModule = await loadXmlToolsParser(undefined, async () => {
      throw new Error("not directly resolvable");
    });
    expect(
      (parserModule.parse("<root />") as { cst: { name: string } }).cst.name,
    ).toBe("document");
  });

  it("resolves the XML plugin from the consumer file location", async () => {
    const parserModule = await loadXmlToolsParser(
      new URL(import.meta.url).pathname,
      async () => {
        throw new Error("not directly resolvable");
      },
    );

    expect(
      (parserModule.parse("<root />") as { cst: { name: string } }).cst.name,
    ).toBe("document");
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
      cause: { name: "MismatchedTokenException" },
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

  it("recovers when a fragment starts with text before an element", async () => {
    const options = { __embeddedXmlFragmentRecoverIndex: [] };
    const ast = await parser.parse("text<foo/>", options as never);

    expect(ast.element).toMatchObject({ name: "element", Name: "foo" });
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
