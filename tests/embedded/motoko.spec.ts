import { readFile } from "node:fs/promises";
import path from "node:path";
import prettier from "prettier";
import { builders, printer } from "prettier/doc";
import { expect, it } from "vitest";
import * as embed from "../../src";
import { embedder } from "../../src/embedded/motoko/embedder.js";

it.each(["babel-ts", "typescript"])(
  "preserves Motoko exterior whitespace with %s",
  async (parser) => {
    const source = await readFile(
      path.join(import.meta.dirname, "../fixtures/motoko/interpolations.ts"),
      "utf8",
    );
    const options = {
      parser,
      plugins: [embed, "prettier-plugin-motoko"],
      preserveEmbeddedExteriorWhitespaces: ["motoko"],
      noEmbeddedMultiLineIndentation: ["motoko"],
      tabWidth: 4,
    };
    const formatted = await prettier.format(source, options);
    expect(await prettier.format(formatted, options)).toBe(formatted);
    expect(formatted).toMatch(/};\n`;/);
    expect(formatted.match(/getFirstValue/g)).toHaveLength(1);
    expect(formatted.match(/getSecondValue/g)).toHaveLength(1);
  },
);

it("handles Motoko documents with ordinary and literal line endings", async () => {
  const path = {
    node: {
      quasis: [{ value: { cooked: "actor {};", raw: "actor {};" } }],
      expressions: [],
    },
    map: () => [],
  };
  for (const content of [
    "actor {};",
    ["actor {};"],
    ["actor {};", builders.line],
    ["actor {};", builders.hardline],
    ["actor {};", builders.literalline],
    [],
  ]) {
    const doc = await embedder(
      async () => content,
      () => "",
      path as never,
      { tabWidth: 2 },
      {
        commentOrTag: "motoko",
        kind: "tag",
        embeddedOverrideOptions: undefined,
      },
    );
    const result = printer.printDocToString(doc, {
      printWidth: 80,
      tabWidth: 2,
      useTabs: false,
    }).formatted;
    expect(result).toContain("`");
    if (content.length) expect(result).toContain("actor {};");
  }
});
