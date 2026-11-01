// biome-ignore-all lint/suspicious/noTemplateCurlyInString: These strings contain JavaScript source fixtures.
import type { Options } from "prettier";
import { format } from "prettier";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { embeddedParsers } from "../../src/embedded/index.js";
import * as embed from "../../src/index.js";
import { contents } from "../helpers/templates.js";

const options = {
  parser: "babel",
  plugins: [embed, "prettier-plugin-sql-cst"],
  embeddedSqlPlugin: "prettier-plugin-sql-cst",
  embeddedSqlParser: "postgresql",
} satisfies Options;
const fragmentOptions = { ...options, embeddedSqlFormatFragments: true };
const dialects = [
  "sqlite",
  "bigquery",
  "mysql",
  "mariadb",
  "postgresql",
] as const;

beforeEach(() => vi.stubEnv("PRETTIER_DEBUG", "1"));
afterEach(() => vi.unstubAllEnvs());

describe("comments around canonicalized SQL nodes", () => {
  it.each(dialects)(
    "matches the native formatter for implicit aliases with %s",
    async (embeddedSqlParser) => {
      for (const embeddedSqlFormatFragments of [false, true]) {
        const settings = {
          ...options,
          embeddedSqlParser,
          embeddedSqlFormatFragments,
        };
        for (const input of [
          "select id /* before alias */ alias from t",
          "select id -- before alias\nalias from t",
        ]) {
          const expected = await format(input, {
            parser: embeddedSqlParser,
            plugins: ["prettier-plugin-sql-cst"],
          });
          const output = await format(`sql\`${input}\`;`, settings);
          expect(await contents(output)).toEqual([expected.trim()]);
          expect(await format(output, settings)).toBe(output);
        }
      }
    },
  );

  it.each(["mysql", "mariadb"] as const)(
    "matches the native formatter for canonical boolean operators with %s",
    async (embeddedSqlParser) => {
      for (const embeddedSqlFormatFragments of [false, true]) {
        const settings = {
          ...options,
          embeddedSqlParser,
          embeddedSqlFormatFragments,
        };
        for (const input of [
          "select a /* operator */ && b from t",
          "select a && /* operand */ b from t",
        ]) {
          const expected = await format(input, {
            parser: embeddedSqlParser,
            plugins: ["prettier-plugin-sql-cst"],
          });
          const output = await format(`sql\`${input}\`;`, settings);
          expect(await contents(output)).toEqual([expected.trim()]);
          expect(await format(output, settings)).toBe(output);
        }
      }
    },
  );
});

describe("explicit fragment semicolons", () => {
  it.each(dialects)(
    "preserves existing semicolons with %s",
    async (embeddedSqlParser) => {
      const input =
        "sql`id=1;`;sql`id,name;`;sql`where id=1;`;sql`join t on t.id=x;`;sql`id=1`;";
      const expected =
        "sql`id = 1;`;\nsql`id, name;`;\nsql`WHERE id = 1;`;\nsql`JOIN t ON t.id = x;`;\nsql`id = 1`;\n";
      for (const sqlFinalSemicolon of [false, true]) {
        const settings = {
          ...fragmentOptions,
          embeddedSqlParser,
          sqlFinalSemicolon,
        };
        const output = await format(input, settings);
        expect(output).toBe(expected);
        expect(await format(output, settings)).toBe(output);
      }
    },
  );

  it("preserves consecutive explicit semicolons", async () => {
    const output = await format("sql`id=1;;`;", fragmentOptions);
    expect(output).toBe("sql`\n  id = 1;\n  ;\n`;\n");
    expect(await format(output, fragmentOptions)).toBe(output);
  });

  it("still rejects multiple real statements", async () => {
    const input = "sql`id=1;select 2`;";
    await expect(format(input, fragmentOptions)).rejects.toThrow(
      'Syntax Error: Unexpected "id"',
    );
    vi.stubEnv("PRETTIER_DEBUG", undefined);
    expect(await format(input, fragmentOptions)).toBe(`${input}\n`);
  });
});

describe("trailing fragment commas", () => {
  it.each(dialects)(
    "preserves fragments whose trailing empty column was removed with %s",
    async (embeddedSqlParser) => {
      vi.stubEnv("PRETTIER_DEBUG", undefined);
      const settings = { ...fragmentOptions, embeddedSqlParser };
      for (const fragment of [
        "id,",
        "id,name,",
        "distinct id,",
        ",id,",
        "id, -- trailing comment",
        "id, /* trailing comment */",
        "id /* preceding comment */,",
        "id,;",
        "id, from users",
      ]) {
        const input = `sql\`${fragment}\`;\n`;
        const output = await format(input, settings);
        expect(output).toBe(input);
        expect(await format(output, settings)).toBe(output);
      }
    },
  );

  it("does not mistake commas in literals or comments for a missing column", async () => {
    for (const [fragment, expected] of [
      ["','", "','"],
      ["concat('a,','b')", "concat('a,', 'b')"],
      ["id=1 /* comma, */", "id = 1 /* comma, */"],
      ["id,name /* comma, */", "id, name /* comma, */"],
    ]) {
      const output = await format(`sql\`${fragment}\`;`, fragmentOptions);
      expect(output).toBe(`sql\`${expected}\`;\n`);
      expect(await format(output, fragmentOptions)).toBe(output);
    }
  });

  it.each(["compat-sql-cst-v0-18", "compat-sql-cst-v0-22"])(
    "preserves trailing commas without disabling normal recovery with %s",
    async (plugin) => {
      vi.stubEnv("PRETTIER_DEBUG", undefined);
      const settings = { ...fragmentOptions, plugins: [embed, plugin] };
      const output = await format("sql`id,name`;sql`id,`;", settings);
      expect(output).toBe("sql`id, name`;\nsql`id,`;\n");
      expect(await format(output, settings)).toBe(output);
    },
  );

  it("retains native trailing-comma normalization for complete statements", async () => {
    const input = "sql`select id,`;";
    const output = await format(input, fragmentOptions);
    expect(output).toBe("sql`SELECT id;`;\n");
    expect(await format(output, fragmentOptions)).toBe(output);
  });
});

describe("SELECT modifiers in fragments", () => {
  it.each(dialects)(
    "formats DISTINCT and ALL with %s",
    async (embeddedSqlParser) => {
      const input =
        "sql`distinct id,name`;sql`all id,name`;sql`distinct id,name;`;";
      const settings = { ...fragmentOptions, embeddedSqlParser };
      const output = await format(input, settings);
      expect(output).toBe(
        "sql`DISTINCT id, name`;\nsql`ALL id, name`;\nsql`DISTINCT id, name;`;\n",
      );
      expect(await format(output, settings)).toBe(output);
    },
  );

  it("formats PostgreSQL DISTINCT ON", async () => {
    const output = await format(
      "sql`distinct on (id) id,name`;",
      fragmentOptions,
    );
    expect(output).toBe("sql`DISTINCT ON (id) id, name`;\n");
    expect(await format(output, fragmentOptions)).toBe(output);
  });

  it.each([
    "distinct /* columns */ id,name",
    "-- columns\ndistinct id,name",
    "distinct id,name -- columns",
  ])("preserves comments and wrapping: %s", async (input) => {
    const settings = { ...fragmentOptions, printWidth: 20 };
    const output = await format(`sql\`${input}\`;`, settings);
    expect(output).toContain("columns");
    expect(output).toContain("DISTINCT");
    expect(output).not.toContain("SELECT");
    expect(await format(output, settings)).toBe(output);
  });

  it("preserves interpolations and keyword case", async () => {
    const settings = {
      ...fragmentOptions,
      sqlKeywordCase: "lower",
    } satisfies Options;
    const output = await format("sql`DISTINCT ${column},id`;", settings);
    expect(output).toBe("sql`distinct ${column}, id`;\n");
    expect(await format(output, settings)).toBe(output);
  });
});

describe("fragment formatting opt-in", () => {
  it.each([undefined, false])(
    "preserves fragments when embeddedSqlFormatFragments=%j",
    async (embeddedSqlFormatFragments) => {
      vi.stubEnv("PRETTIER_DEBUG", undefined);
      const settings = { ...options, embeddedSqlFormatFragments };
      const input = "sql`id=1`;sql`distinct id,name`;sql`select 1`;";
      const output = await format(input, settings);
      expect(output).toBe(
        "sql`id=1`;\nsql`distinct id,name`;\nsql`SELECT 1;`;\n",
      );
      expect(await format(output, settings)).toBe(output);
    },
  );

  it.each([undefined, false])(
    "preserves debug errors when embeddedSqlFormatFragments=%j",
    async (embeddedSqlFormatFragments) => {
      await expect(
        format("sql`id=1`;", { ...options, embeddedSqlFormatFragments }),
      ).rejects.toThrow('Syntax Error: Unexpected "id"');
    },
  );

  it.each([undefined, false, true])(
    "only retries failed parses when enabled: %j",
    async (embeddedSqlFormatFragments) => {
      const original = new Error("original parse error");
      const parse = vi.fn(() => {
        throw original;
      });
      await expect(
        embeddedParsers.embeddedSql!.parse("id=1", {
          plugins: [{ parsers: { sqlite: { parse } } }],
          embeddedSqlFormatFragments,
        } as never),
      ).rejects.toBe(original);
      expect(parse).toHaveBeenCalledTimes(embeddedSqlFormatFragments ? 4 : 1);
    },
  );

  it.each([undefined, false, true])(
    "parses complete statements once with embeddedSqlFormatFragments=%j",
    async (embeddedSqlFormatFragments) => {
      const ast = { type: "program", statements: [] };
      const parse = vi.fn(() => ast);
      expect(
        await embeddedParsers.embeddedSql!.parse("select 1", {
          plugins: [{ parsers: { sqlite: { parse } } }],
          embeddedSqlFormatFragments,
        } as never),
      ).toBe(ast);
      expect(parse).toHaveBeenCalledTimes(1);
    },
  );

  it.each([false, true])(
    "supports tag overrides of embeddedSqlFormatFragments=%s",
    async (embeddedSqlFormatFragments) => {
      vi.stubEnv("PRETTIER_DEBUG", undefined);
      const settings = {
        ...options,
        embeddedSqlTags: ["sql", "fragment"],
        embeddedSqlFormatFragments,
        embeddedOverrides: JSON.stringify([
          {
            tags: ["fragment"],
            options: {
              embeddedSqlFormatFragments: !embeddedSqlFormatFragments,
            },
          },
        ]),
      };
      const output = await format("sql`id=1`;fragment`id=1`;", settings);
      expect(output).toBe(
        embeddedSqlFormatFragments
          ? "sql`id = 1`;\nfragment`id=1`;\n"
          : "sql`id=1`;\nfragment`id = 1`;\n",
      );
      expect(await format(output, settings)).toBe(output);
    },
  );

  it("keeps native prettier-plugin-sql fragment formatting", async () => {
    const settings = {
      ...options,
      plugins: [embed, "prettier-plugin-sql"],
      embeddedSqlPlugin: "prettier-plugin-sql",
    } satisfies Options;
    const input = "sql`id=1 and active=true`;";
    const output = await format(input, {
      ...settings,
      embeddedSqlFormatFragments: false,
    });
    expect(output).toContain("id = 1");
    expect(
      await format(input, { ...settings, embeddedSqlFormatFragments: true }),
    ).toBe(output);
  });
});
