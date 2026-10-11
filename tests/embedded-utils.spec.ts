import prettier from "prettier";
import { describe, expect, it } from "vitest";
import {
  escapeRegExp,
  insertLanguage,
  makeCommentsOptionName,
  makeIdentifiersOptionName,
  makeParserOptionName,
  makePluginOptionName,
  makeTagsOptionName,
  preparePlaceholder,
  printTemplateExpression,
  printTemplateExpressions,
  randomUUID,
  simpleRehydrateDoc,
  wrapEmbeddedDoc,
} from "../src/embedded/utils.js";

const interpolation = `${"${"}value}`;
const render = (
  doc: Parameters<typeof prettier.doc.printer.printDocToString>[0],
) =>
  prettier.doc.printer.printDocToString(doc, { printWidth: 80, tabWidth: 2 })
    .formatted;

function quasi(raw: string) {
  return { value: { raw, cooked: raw }, tail: false };
}

describe("embedded template wrapper options", () => {
  it("preserves exterior whitespace and honors indentation settings", () => {
    const content = ["alpha", prettier.doc.builders.hardline, "beta"];

    expect(
      render(
        wrapEmbeddedDoc(
          content,
          { preserveEmbeddedExteriorWhitespaces: ["css"] },
          "css",
          " ",
          " ",
        ),
      ),
    ).toBe("` alpha\n  beta `");

    expect(
      render(
        wrapEmbeddedDoc(
          content,
          {
            preserveEmbeddedExteriorWhitespaces: ["css"],
            noEmbeddedMultiLineIndentation: ["css"],
          },
          "css",
          " ",
          " ",
        ),
      ),
    ).toBe("` alpha\nbeta `");
  });

  it("uses soft exterior line breaks when whitespace is not preserved", () => {
    expect(
      render(
        wrapEmbeddedDoc(
          ["alpha"],
          { noEmbeddedMultiLineIndentation: ["other"] },
          "css",
          "",
          "",
        ),
      ),
    ).toBe("`alpha`");

    expect(render(wrapEmbeddedDoc(["alpha"], {}, "css", " ", " "))).toBe(
      "` alpha `",
    );

    expect(
      render(
        wrapEmbeddedDoc(
          ["alpha"],
          { noEmbeddedMultiLineIndentation: ["css"] },
          "css",
          "",
          "",
        ),
      ),
    ).toBe("`alpha`");
  });
});

describe("template expression printing", () => {
  it("aligns expressions to current, earlier, or zero indentation", () => {
    const expression = { type: "Identifier", name: "value" } as never;
    const print = () => "value";

    expect(
      render(
        printTemplateExpression(
          { node: expression } as never,
          print,
          { quasis: [quasi("\n    ")] } as never,
          0,
          4,
        ),
      ),
    ).toBe(interpolation);

    expect(
      render(
        printTemplateExpression(
          { node: expression } as never,
          print,
          { quasis: [quasi("\n\t "), quasi("tail")] } as never,
          1,
          4,
        ),
      ),
    ).toBe(interpolation);

    expect(
      render(
        printTemplateExpression(
          { node: expression } as never,
          print,
          { quasis: [quasi("prefix")] } as never,
          0,
          2,
        ),
      ),
    ).toBe(interpolation);
  });

  it("preserves comment layout and maps expressions through an AstPath", () => {
    const expression = {
      type: "Identifier",
      name: "value",
      comments: [{ type: "Block", value: " note ", leading: true }],
    } as never;
    const template = {
      type: "TemplateLiteral",
      quasis: [quasi("\n  ")],
      expressions: [expression],
    };
    const path = {
      node: template,
      map(callback: (path: { node: unknown }, index: number) => unknown) {
        return template.expressions.map((node, index) =>
          callback({ node }, index),
        );
      },
    };
    const docs = printTemplateExpressions(path as never, () => "value", {
      tabWidth: 2,
    } as never);

    expect(docs).toHaveLength(1);
    expect(render(docs[0] as never)).toBe(interpolation);
  });

  it("finds indentation on an earlier quasi before the expression", () => {
    const expression = { type: "Identifier", name: "value" } as never;
    const template = {
      type: "TemplateLiteral",
      quasis: [quasi("\n\t"), quasi("value"), quasi("tail")],
      expressions: [expression, expression],
    };

    expect(
      render(
        printTemplateExpression(
          { node: expression } as never,
          () => "value",
          template as never,
          1,
          4,
        ),
      ),
    ).toBe(interpolation);
  });

  it("handles earlier quasis without indentation and zero-indent newlines", () => {
    const expression = { type: "Identifier", name: "value" } as never;

    expect(
      render(
        printTemplateExpression(
          { node: expression } as never,
          () => "value",
          {
            quasis: [quasi("plain"), quasi("tail")],
            expressions: [expression],
          } as never,
          1,
          2,
        ),
      ),
    ).toBe(interpolation);

    expect(
      render(
        printTemplateExpression(
          { node: expression } as never,
          () => "value",
          { quasis: [quasi("\n")], expressions: [expression] } as never,
          0,
          2,
        ),
      ),
    ).toBe(interpolation);
  });
});

describe("rehydrating embedded documents", () => {
  it("detects expressions discarded by a language formatter", () => {
    expect(() =>
      simpleRehydrateDoc("plain text", /pabc(\d+)xyz/g, [interpolation]),
    ).toThrow("The embedded formatter changed an expression placeholder.");
  });

  it("escapes closing script tags in embedded HTML contexts", () => {
    const doc = simpleRehydrateDoc(
      "<script>value</SCRIPT>",
      /never-match/g,
      [],
      false,
      undefined,
      undefined,
      true,
    );
    expect(render(doc)).toBe("<script>value<\\/SCRIPT>");
  });

  it("restores expressions and escapes template literal text", () => {
    const placeholder = "pabc0xyz";
    const doc = simpleRehydrateDoc(`raw ${placeholder} \\ `, /pabc(\d+)xyz/g, [
      interpolation,
    ]);

    expect(render(doc)).toBe(`raw ${interpolation} \\\\ `);
  });

  it("supports hardline and literal-line newline handling", () => {
    const hardlineDoc = simpleRehydrateDoc(
      "first\nsecond",
      /never-match/g,
      [],
      "hardline",
    );
    const literalLineDoc = simpleRehydrateDoc(
      "first\n  second",
      /never-match/g,
      [],
      "literalline",
    );

    expect(render(hardlineDoc)).toBe("first\nsecond");
    expect(render(literalLineDoc)).toBe("first\n  second");
  });

  it("inserts configured line breaks before expressions without trailing text", () => {
    const doc = simpleRehydrateDoc(
      "pabc0xyz",
      /pabc(\d+)xyz/g,
      [interpolation],
      false,
      new Set([0]),
    );

    expect(render(doc)).toBe(`\n${interpolation}`);
  });

  it("moves configured line breaks after existing text", () => {
    const doc = simpleRehydrateDoc(
      "before   pabc0xyz",
      /pabc(\d+)xyz/g,
      [interpolation],
      false,
      new Set([0]),
    );

    expect(render(doc)).toBe(`before\n${interpolation}`);
  });
});

describe("embedded language utilities", () => {
  it("keeps the first language first and inserts others in order", () => {
    const languages = ["css", "html", "typescript"];
    insertLanguage(languages, "embeddedHtml", "embeddedHtml");
    expect(languages[0]).toBe("embeddedHtml");

    insertLanguage(languages, "zzzz", "html");
    expect(languages.at(-1)).toBe("zzzz");

    const sorted: string[] = [];
    insertLanguage(sorted, "markdown", "embeddedHtml");
    insertLanguage(sorted, "css", "embeddedHtml");
    insertLanguage(sorted, "embeddedHtml", "embeddedHtml");
    expect(sorted).toEqual(["embeddedHtml", "css", "markdown"]);
  });

  it("creates valid placeholders and option names", () => {
    const { createPlaceholder, placeholderRegex } = preparePlaceholder(
      "start(",
      ")end+",
    );
    const placeholder = createPlaceholder(12);

    expect(randomUUID()).toMatch(/^[a-z0-9]{16}$/);
    expect(placeholder).toMatch(placeholderRegex);
    expect(escapeRegExp("a+b c")).toBe("a\\+b\\ c");
    expect(makeIdentifiersOptionName("embeddedHtml")).toBe(
      "embeddedHtmlIdentifiers",
    );
    expect(makeCommentsOptionName("embeddedHtml")).toBe("embeddedHtmlComments");
    expect(makeTagsOptionName("embeddedHtml")).toBe("embeddedHtmlTags");
    expect(makePluginOptionName("embeddedHtml")).toBe("embeddedHtmlPlugin");
    expect(makeParserOptionName("embeddedHtml")).toBe("embeddedHtmlParser");
  });
});
