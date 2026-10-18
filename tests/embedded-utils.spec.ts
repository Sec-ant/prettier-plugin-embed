import prettier, { type Doc } from "prettier";
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
  prepareTemplate,
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

describe("template margins", () => {
  it.each([
    ["\n- parent\n  - child\n\n    code\n", "- parent\n  - child\n\n    code"],
    [
      "\n  # Heading\n\nParagraph\n\n    code\n",
      "  # Heading\n\nParagraph\n\n    code",
    ],
    [
      "\n    first()\n\nParagraph\n\n    second()\n",
      "    first()\n\nParagraph\n\n    second()",
    ],
    [
      "\n    - parent\n      - child\n\n        code\n",
      "- parent\n  - child\n\n    code",
    ],
    ["\n \talpha\n  beta\n", "\talpha\n beta"],
    ["\r\n    alpha\r\n      beta\r\n", "alpha\r\n  beta"],
    ["  \n\t ", ""],
    ["", ""],
  ])("keeps content indentation in %j", (input, expected) => {
    const prepared = prepareTemplate(
      { quasis: [quasi(input)], expressions: [] } as never,
      () => "placeholder",
    );
    expect(prepared.text).toBe(expected);
  });

  it("separates first-line content indentation from exterior whitespace", () => {
    expect(
      prepareTemplate(
        {
          quasis: [quasi("\n    code\n\nParagraph\n  ")],
          expressions: [],
        } as never,
        () => "placeholder",
      ),
    ).toEqual({
      text: "    code\n\nParagraph",
      leadingWhitespaces: "\n",
      trailingWhitespaces: "\n  ",
    });
    const { leadingWhitespaces, trailingWhitespaces } = prepareTemplate(
      { quasis: [quasi(" \n\t ")], expressions: [] } as never,
      () => "placeholder",
    );
    expect(leadingWhitespaces + trailingWhitespaces).toBe(" \n\t ");
  });

  it("preserves long interior whitespace runs", () => {
    const text = `first\n${" ".repeat(50_000)}last`;
    expect(
      prepareTemplate({ quasis: [quasi(`\n${text}\n`)] } as never, String).text,
    ).toBe(text);
  });

  it.each(["", "  ", "\t "])(
    "keeps same-line trailing whitespace outside the content: %j",
    (trailingWhitespaces) => {
      expect(
        prepareTemplate(
          { quasis: [quasi(`value: 1${trailingWhitespaces}`)] } as never,
          String,
          true,
        ),
      ).toEqual({
        text: "value: 1",
        leadingWhitespaces: "",
        trailingWhitespaces,
      });
    },
  );

  it.each(["\n", "\r\n"])(
    "keeps multiline trailing whitespace as content and its final boundary: %j",
    (newline) => {
      expect(
        prepareTemplate(
          {
            quasis: [
              quasi(
                `${newline}  value: |+${newline}    text${newline}  ${newline}  `,
              ),
            ],
          } as never,
          String,
          true,
        ),
      ).toEqual({
        text: `value: |+${newline}  text${newline}${newline}`,
        leadingWhitespaces: `${newline}  `,
        trailingWhitespaces: `${newline}  `,
      });
    },
  );
});

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
    ).toBe("` alpha\nbeta `");

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
  it("preserves indentation across tabs, earlier quasis and zero-indent newlines", () => {
    const expression = { type: "Identifier", name: "value" };
    const template = {
      quasis: ["prefix", "\n\t ", "tail", "\n", ""].map(quasi),
      expressions: Array.from({ length: 4 }, () => expression),
    };
    const path = {
      node: template,
      map(callback: (path: { node: unknown }, index: number) => unknown) {
        return template.expressions.map((node, index) =>
          callback({ node }, index),
        );
      },
    };
    const print = () => ["first", prettier.doc.builders.hardline, "second"];
    const actual = printTemplateExpressions(path as never, print, {
      tabWidth: 4,
    } as never);
    const expected = template.expressions.map((node, index) =>
      printTemplateExpression(
        { node } as never,
        print,
        template as never,
        index,
        4,
      ),
    );
    expect(actual).toEqual(expected);
  });

  it("scans single-line interpolation quasis in linear time", () => {
    let reads = 0;
    const count = 1000;
    const template = {
      quasis: Array.from({ length: count + 1 }, () => ({
        value: {
          get raw() {
            reads++;
            return ", ";
          },
        },
      })),
      expressions: Array.from({ length: count }, () => ({
        type: "Identifier",
        name: "value",
      })),
    };
    const path = {
      node: template,
      map(callback: (path: { node: unknown }, index: number) => unknown) {
        return template.expressions.map((node, index) =>
          callback({ node }, index),
        );
      },
    };
    expect(printTemplateExpressions(path as never, () => "value")).toHaveLength(
      count,
    );
    expect(reads).toBeLessThanOrEqual(count * 2);
  });

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
  const {
    align,
    conditionalGroup,
    dedentToRoot,
    fill,
    group,
    hardline,
    ifBreak,
    indent,
    indentIfBreak,
    line,
    literalline,
    markAsRoot,
  } = prettier.doc.builders;

  function wrapExpression(doc: Doc, expression: Doc) {
    return render(
      wrapEmbeddedDoc(
        simpleRehydrateDoc(doc, /placeholder(\d+)end/g, [expression]),
        {},
        "html",
        "\n",
        "\n",
      ),
    );
  }

  it("isolates literal roots through every supported layout command", () => {
    const placeholder = "placeholder0end";
    const expression = [
      "${String.raw`one",
      literalline,
      "  two",
      literalline,
      "`}",
    ];
    const groupId = Symbol("conditional-indent");
    const shared = group([placeholder, hardline]);
    const layouts = [
      fill([placeholder, line, "suffix"]),
      ifBreak(placeholder, placeholder),
      conditionalGroup([placeholder, ["prefix", hardline, placeholder]]),
      group(indentIfBreak([hardline, placeholder], { groupId }), {
        id: groupId,
        shouldBreak: true,
      }),
      markAsRoot(align(3, indent(markAsRoot(placeholder)))),
      dedentToRoot(placeholder),
      markAsRoot(dedentToRoot(placeholder)),
      [shared, shared, indent(shared)],
    ];
    for (const layout of layouts) {
      const output = wrapExpression(layout, expression);
      expect(output).toContain("`one\n  two\n`}");
      expect(output).not.toContain("\n    two");
    }
  });

  it("inspects root-sensitive conditional alternatives before taking the fast path", () => {
    const expression = conditionalGroup([
      "a".repeat(200),
      ["first", literalline, "second"],
    ]);
    expect(wrapExpression("placeholder0end", expression)).toContain(
      "first\nsecond",
    );
    expect(
      wrapExpression(
        "placeholder0end",
        dedentToRoot(["${", hardline, "value}"]),
      ),
    ).toContain("${" + "\nvalue}");
  });

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
      { escapeClosingScript: true },
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

  it("preserves literal newlines and their indentation", () => {
    const hardlineDoc = simpleRehydrateDoc("first\nsecond", /never-match/g, []);
    const literalLineDoc = simpleRehydrateDoc(
      "first\n  second",
      /never-match/g,
      [],
    );

    expect(render(hardlineDoc)).toBe("first\nsecond");
    expect(render(literalLineDoc)).toBe("first\n  second");
  });

  it("inserts configured line breaks before expressions without trailing text", () => {
    const doc = simpleRehydrateDoc(
      "pabc0xyz",
      /pabc(\d+)xyz/g,
      [interpolation],
      { lineBreakBeforeExpressions: new Set([0]) },
    );

    expect(render(doc)).toBe(`\n${interpolation}`);
  });

  it.each([
    ["before   ", "before"],
    ["before\t ", "before"],
    ["before\u00a0\t ", "before\u00a0"],
    ["\t ", ""],
  ])("moves configured line breaks after %j", (text, expected) => {
    const doc = simpleRehydrateDoc(
      `${text}pabc0xyz`,
      /pabc(\d+)xyz/g,
      [interpolation],
      { lineBreakBeforeExpressions: new Set([0]) },
    );

    expect(render(doc)).toBe(`${expected}\n${interpolation}`);
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
