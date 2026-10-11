import type { Options } from "prettier";
import { expect, it } from "vitest";
import { embeddedEmbedders } from "../../src/embedded/index.js";

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
