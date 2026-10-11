import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
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

it.each(["babel", "typescript", "espree", "meriyah", "flow"])(
  "matches simple and member tags with regular expressions using %s",
  async (parser) => {
    const options: Options = {
      parser,
      plugins: [plugin],
      embeddedJsonTags: ["/query$/i"],
    };
    const source =
      'const a = Query`{"value":1}`; const b = db.query`{"value":2}`;';
    const formatted = await prettier.format(source, options);
    expect(formatted).toContain('Query`{ "value": 1 }`');
    expect(formatted).toContain('db.query`{ "value": 2 }`');
    expect(await prettier.format(formatted, options)).toBe(formatted);
  },
);

it("uses the matching pattern for per-tag overrides", async () => {
  const pattern = "/^query$/";
  const formatted = await prettier.format(
    'const a = query`const message = "hello";`;',
    {
      parser: "babel",
      plugins: [plugin],
      embeddedEsTags: [pattern],
      embeddedOverrides: JSON.stringify([
        { tags: [pattern], options: { singleQuote: true } },
      ]),
    },
  );
  expect(formatted).toContain("const message = 'hello';");
});

it("shares overrides within a format call and reloads them for the next call", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "embed-overrides-"));
  const filepath = path.join(directory, "overrides.mjs");
  const dependency = path.join(directory, "options.mjs");
  const marker = path.join(directory, "evaluations.txt");
  const options: Options = {
    parser: "babel",
    plugins: [plugin, "prettier-plugin-sql"],
    embeddedOverrides: filepath,
    keywordCase: "lower",
  };
  const source = `const first = sql\`select 1\`;
const second = sql\`select 2\`;
const third = /* sql */ \`select 3\`;`;
  try {
    await Promise.all([
      writeFile(dependency, 'export default { keywordCase: "upper" };'),
      writeFile(
        filepath,
        `import { appendFileSync } from "node:fs";
import options from "./options.mjs";
appendFileSync(new URL("./evaluations.txt", import.meta.url), "evaluated\\n");
export default [
  { tags: ["sql"], options },
  { comments: ["sql"], options: { keywordCase: "lower" } },
];`,
      ),
    ]);
    const initial = await prettier.format(source, options);
    expect(initial.match(/\bSELECT\b/g)).toHaveLength(2);
    expect(initial.match(/\bselect\b/g)).toHaveLength(1);
    expect(await readFile(marker, "utf8")).toBe("evaluated\n");

    await writeFile(dependency, 'export default { keywordCase: "lower" };');
    const updated = await prettier.format(source, options);
    expect(updated.match(/\bselect\b/g)).toHaveLength(3);
    expect(await readFile(marker, "utf8")).toBe("evaluated\nevaluated\n");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

it.each([
  { noEmbeddedIdentificationByTag: ["query"] },
  { embeddedNoopTags: ["/^query$/"] },
  { embeddedJsonTags: ["/[invalid/"] },
])(
  "preserves template content with exclusion or unmatched patterns: %j",
  async (overrides) => {
    const formatted = await prettier.format('const a = query`{"value":1}`;', {
      parser: "babel",
      plugins: [plugin],
      embeddedJsonTags: ["/^query$/"],
      ...overrides,
    });
    expect(formatted).toContain('query`{"value":1}`');
  },
);
