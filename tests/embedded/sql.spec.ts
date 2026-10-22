import type { Options } from "prettier";
import { format } from "prettier";
import { describe, expect, it, vi } from "vitest";
import { embeddedEmbedders } from "../../src/embedded/index.js";
import * as embed from "../../src/index.js";

const sql = "prettier-plugin-sql";
const cst = "prettier-plugin-sql-cst";

it.each<[string[], Options, NonNullable<Options["embeddedSqlPlugin"]>]>([
  [[cst], {}, cst],
  [[sql, cst], {}, sql],
  [[cst, sql], {}, sql],
  [[sql, cst], { embeddedSqlPlugin: cst }, cst],
  [
    [sql, cst],
    {
      embeddedOverrides: JSON.stringify([
        { tags: ["sql"], options: { embeddedSqlPlugin: cst } },
      ]),
    },
    cst,
  ],
])(
  "selects %s with %j using %s",
  async (plugins, overrides, expectedPlugin) => {
    const input = "export const q = sql`select a,b from t where c=1`;\n";
    const options = {
      parser: "babel",
      plugins: [embed, ...plugins],
      ...overrides,
    };
    const formatted = await format(input, options);
    expect(formatted).not.toBe(input);
    expect(formatted).toBe(
      await format(input, {
        parser: "babel",
        plugins: [embed, expectedPlugin],
        embeddedSqlPlugin: expectedPlugin,
      }),
    );
    expect(await format(formatted, options)).toBe(formatted);
  },
);

describe.each(["babel", "babel-ts", "typescript"])(
  "SQL fragment errors with %s",
  (parser) => {
    const input = `const id=1;\nexport const where=sql\`id = $\{id}\`;\n`;
    const expected = `const id = 1;\nexport const where = sql\`id = $\{id}\`;\n`;
    const options = {
      parser,
      plugins: [embed, "prettier-plugin-sql-cst"],
      embeddedSqlPlugin: "prettier-plugin-sql-cst",
      embeddedSqlParser: "postgresql",
    } satisfies Options;

    it.each([undefined, ""])(
      "preserves the fragment silently with PRETTIER_DEBUG=%j",
      async (debug) => {
        vi.stubEnv("PRETTIER_DEBUG", debug);
        const errors = vi.spyOn(console, "error").mockImplementation(() => {});
        try {
          expect(await format(input, options)).toBe(expected);
          expect(await format(expected, options)).toBe(expected);
          expect(errors).not.toHaveBeenCalled();
        } finally {
          errors.mockRestore();
          vi.unstubAllEnvs();
        }
      },
    );

    it.each(["1", "0"])(
      "propagates the parser error with PRETTIER_DEBUG=%j",
      async (debug) => {
        vi.stubEnv("PRETTIER_DEBUG", debug);
        const errors = vi.spyOn(console, "error").mockImplementation(() => {});
        try {
          await expect(format(input, options)).rejects.toThrow(
            'Syntax Error: Unexpected "id"',
          );
          expect(errors).not.toHaveBeenCalled();
        } finally {
          errors.mockRestore();
          vi.unstubAllEnvs();
        }
      },
    );
  },
);

it("uses SQLite when the CST SQL parser option is omitted", async () => {
  const embedder = embeddedEmbedders.embeddedSql!;
  const node = {
    quasis: [{ value: { cooked: "select 1", raw: "select 1" } }],
    expressions: [],
  };
  const path = { node, map: () => [] };
  let parser: Options["parser"] | undefined;

  await embedder(
    (async (_text: string, options: Options) => {
      parser = options.parser;
      return "select 1";
    }) as never,
    (() => "expression") as never,
    path as never,
    { embeddedSqlPlugin: "prettier-plugin-sql-cst" } as Options,
    {
      commentOrTag: "sql",
      kind: "tag",
      embeddedOverrideOptions: undefined,
    },
  );

  expect(parser).toBe("sqlite");
});

it("uses the CST formatter's line breaks before interpolations", async () => {
  const input = `const query = sql\`insert into items (id, name) values (
$\{id},
$\{name}
)\`;`;
  const options = {
    parser: "typescript",
    plugins: [embed, "prettier-plugin-sql-cst"],
    embeddedSqlPlugin: "prettier-plugin-sql-cst",
    embeddedSqlParser: "sqlite",
    sqlKeywordCase: "lower",
  } satisfies Options;
  const formatted = await format(input, options);
  expect(formatted).toContain("insert into");
  expect(formatted).not.toMatch(/\n[\t ]*\n[\t ]*\$\{/);
  expect(await format(formatted, options)).toBe(formatted);
});

it.each([
  { tabWidth: 2 },
  { tabWidth: 4 },
  { tabWidth: 4, useTabs: true },
  { noEmbeddedMultiLineIndentation: ["sql"] },
  { preserveEmbeddedExteriorWhitespaces: ["sql"] },
])("keeps nested SQL expressions with comments stable: %j", async (layout) => {
  const input = `const query = sql\`
    SELECT * FROM users WHERE
      $\{sql.and([
        sql.or([
          sql\`user_public_key = $\{key}\`,
          sql\`
            user_public_key = $\{alternateKey ??
              // Use a value distinct from null.
              "no-key"}
          \`,
        ]),
        validate ? "true" : isActive(sql),
      ])}
  \`;`;
  const options = {
    parser: "typescript",
    plugins: [embed, "prettier-plugin-sql"],
    language: "postgresql",
    keywordCase: "upper",
    singleQuote: true,
    ...layout,
  } satisfies Options;
  const formatted = await format(input, options);
  expect(formatted).toContain("SELECT");
  expect(formatted).toContain("// Use a value distinct from null.");
  expect(await format(formatted, options)).toBe(formatted);
});
