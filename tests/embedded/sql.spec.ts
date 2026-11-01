import type { Options } from "prettier";
import { format } from "prettier";
import { describe, expect, it, vi } from "vitest";
import { embeddedParsers } from "../../src/embedded/index.js";
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
  "SQL syntax errors with %s",
  (parser) => {
    const input = `const id=1;\nexport const where=sql\`id = $\{id} AND\`;\n`;
    const expected = `const id = 1;\nexport const where = sql\`id = $\{id} AND\`;\n`;
    const options = {
      parser,
      plugins: [embed, "prettier-plugin-sql-cst"],
      embeddedSqlPlugin: "prettier-plugin-sql-cst",
      embeddedSqlParser: "postgresql",
    } satisfies Options;

    it.each([undefined, ""])(
      "preserves the template silently with PRETTIER_DEBUG=%j",
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
  const parse = vi.fn(() => ({ type: "program", statements: [] }));

  await embeddedParsers.embeddedSql!.parse("select 1", {
    plugins: [{ parsers: { sqlite: { parse } } }],
  } as never);

  expect(parse).toHaveBeenCalledWith(
    "select 1",
    expect.objectContaining({ parser: "sqlite" }),
  );
});

it("formats SQL fragments with the CST formatter", async () => {
  const input = `const active = sql\`id=$\{id} and not deleted\`;
const columns = sql\`id,name,email\`;
const recent = sql\`where created_at>now()-interval '1 day'\`;
const withTeam = sql\`join teams on teams.id=users.team_id\`;
const total = sql\`,count(*) as total\`;
const adult = sql\`and age>=$\{age}\`;
const users = sql\`select * from users where $\{active}\`;
`;
  const options = {
    parser: "babel",
    plugins: [embed, "prettier-plugin-sql-cst"],
    embeddedSqlParser: "postgresql",
    embeddedSqlFormatFragments: true,
  } satisfies Options;
  const formatted = await format(input, options);
  expect(formatted).toBe(`const active = sql\`id = $\{id} AND NOT deleted\`;
const columns = sql\`id, name, email\`;
const recent = sql\`WHERE created_at > now() - INTERVAL '1 day'\`;
const withTeam = sql\`JOIN teams ON teams.id = users.team_id\`;
const total = sql\`, count(*) AS total\`;
const adult = sql\`AND age >= $\{age}\`;
const users = sql\`SELECT * FROM users WHERE $\{active};\`;
`);
  expect(await format(formatted, options)).toBe(formatted);
});

it.each(["sqlite", "bigquery", "mysql", "mariadb", "postgresql"] as const)(
  "formats each kind of SQL fragment with %s",
  async (embeddedSqlParser) => {
    const input = `sql\`a=1 and not b\`;
sql\`a,b,c\`;
sql\`where a>1 order by b\`;
sql\`left join t on t.a=u.a join v using(b)\`;
sql\`,max(a) as m\`;
sql\`or a<1\`;
`;
    const options = {
      parser: "babel",
      plugins: [embed, "prettier-plugin-sql-cst"],
      embeddedSqlParser,
      embeddedSqlFormatFragments: true,
    } satisfies Options;
    expect(await format(input, options)).toBe(`sql\`a = 1 AND NOT b\`;
sql\`a, b, c\`;
sql\`WHERE a > 1 ORDER BY b\`;
sql\`
  LEFT JOIN t ON t.a = u.a
  JOIN v USING (b)
\`;
sql\`, max(a) AS m\`;
sql\`OR a < 1\`;
`);
  },
);

it("keeps comments in SQL fragments", async () => {
  const input = `sql\`
  -- active users only
  deleted_at IS NULL -- soft delete
  AND active
\`;
`;
  expect(
    await format(input, {
      parser: "babel",
      plugins: [embed, "prettier-plugin-sql-cst"],
      embeddedSqlFormatFragments: true,
    }),
  ).toBe(input);
});

it("only changes whitespace and case in SQL fragments", async () => {
  expect(
    await format("sql`id int,name text`;\nsql`a<>b`;\n", {
      parser: "babel",
      plugins: [embed, "prettier-plugin-sql-cst"],
      embeddedSqlFormatFragments: true,
    }),
  ).toBe("sql`id int, name text`;\nsql`a <> b`;\n");
});

it("leaves SQL fragments as typed when the prefix can't be left out", async () => {
  const input = "sql`as total`;\nsql`between 1 and 2`;\n";
  expect(
    await format(input, {
      parser: "babel",
      plugins: [embed, "prettier-plugin-sql-cst"],
      embeddedSqlFormatFragments: true,
    }),
  ).toBe(input);
});

it("passes the dialect to the CST formatter", async () => {
  expect(
    await format("sql`select a && b`;\n", {
      parser: "babel",
      plugins: [embed, "prettier-plugin-sql-cst"],
      embeddedSqlParser: "mysql",
    }),
  ).toBe("sql`SELECT a AND b;`;\n");
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
