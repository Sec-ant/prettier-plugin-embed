import type { Options } from "prettier";
import { format } from "prettier";
import { expect, it } from "vitest";
import { embeddedEmbedders } from "../../src/embedded/index.js";
import * as embed from "../../src/index.js";

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
