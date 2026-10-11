import type { Options } from "prettier";
import prettier from "prettier";
import { expect, it } from "vitest";
import * as plugin from "../src";
import { printers } from "../src/printers.js";

const embed = printers!.estree!.embed!;

it("falls back to Prettier for untagged template literals", async () => {
  const result = await prettier.format(
    "const value = `plain text`; const other = unknown`plain text`;",
    { parser: "babel", plugins: [plugin] },
  );

  expect(result).toContain("const value = `plain text`;");
  expect(result).toContain("unknown`plain text`");
});

it("falls back for unmatched complex expression tags", async () => {
  const result = await prettier.format("const value = getTag()`plain text`;", {
    parser: "babel",
    plugins: [plugin],
  });

  expect(result).toContain("getTag()`plain text`");
});

it("ignores non-template and invalid cooked template nodes", () => {
  expect(
    embed(
      { node: { type: "Identifier", name: "value" } } as never,
      { parser: "babel" } as Options,
    ),
  ).toBeNull();

  expect(
    embed(
      {
        node: {
          type: "TemplateLiteral",
          quasis: [{ value: { cooked: null, raw: "\\u" } }],
          expressions: [],
        },
      } as never,
      { parser: "babel" } as Options,
    ),
  ).toBeNull();
});
