import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { Options } from "prettier";
import prettier from "prettier";
import { describe, expect, it, vi } from "vitest";
import { fallbackIndicator } from "../src/embedded/index.js";
import {
  compareObjects,
  compareTagExpressionToTagString,
  createCommentsInOptionsGenerator,
  createEmbeddedDoc,
  createTagsInOptionsGenerator,
  parseCommentFromTemplateLiteralAstPath,
  parseTagFromTemplateLiteralAstPath,
  resolveEmbeddedOverrideOptions,
} from "../src/utils.js";

function identifier(name: string) {
  return { type: "Identifier", name };
}

function programWithTag(tag: unknown) {
  return {
    type: "Program",
    body: [
      {
        type: "ExpressionStatement",
        expression: {
          type: "TaggedTemplateExpression",
          tag,
        },
      },
    ],
  };
}

describe("tag expression matching", () => {
  it("matches simple and nested call tags while ignoring parser locations", () => {
    expect(
      compareTagExpressionToTagString(
        { ...identifier("sql"), start: 1 } as never,
        "sql",
        () => programWithTag({ ...identifier("sql"), end: 9 }) as never,
      ),
    ).toBe(true);

    const callTag = {
      type: "CallExpression",
      callee: {
        type: "MemberExpression",
        object: identifier("client"),
        property: identifier("sql"),
        computed: false,
      },
      arguments: [],
    };
    expect(
      compareTagExpressionToTagString(
        callTag as never,
        "client.sql",
        () => programWithTag(callTag.callee) as never,
      ),
    ).toBe(true);
  });

  it("returns false for invalid parser output and asynchronous parsers", () => {
    const expression = identifier("sql") as never;
    expect(
      compareTagExpressionToTagString(expression, "sql", () => {
        throw new Error("parse error");
      }),
    ).toBe(false);
    expect(
      compareTagExpressionToTagString(
        expression,
        "sql",
        async () => programWithTag(identifier("sql")) as never,
      ),
    ).toBe(false);
    expect(
      compareTagExpressionToTagString(
        expression,
        "sql",
        () =>
          ({
            type: "Program",
            body: [],
          }) as never,
      ),
    ).toBe(false);
    expect(
      compareTagExpressionToTagString(
        expression,
        "sql",
        () => programWithTag(identifier("html")) as never,
      ),
    ).toBe(false);
    expect(
      compareTagExpressionToTagString(
        expression,
        "sql",
        () =>
          ({
            type: "Program",
            body: [
              {
                type: "ExpressionStatement",
                expression: identifier("sql"),
              },
            ],
          }) as never,
      ),
    ).toBe(false);
  });

  it("matches configured regular expressions against member and call tags", () => {
    const parse = vi.fn();
    const memberTag = {
      type: "MemberExpression",
      object: {
        type: "MemberExpression",
        object: identifier("ctx"),
        property: identifier("prisma"),
        computed: false,
      },
      property: identifier("$executeRaw"),
      computed: false,
    };
    const optionalTag = {
      type: "ChainExpression",
      expression: {
        type: "MemberExpression",
        object: { type: "ThisExpression" },
        property: identifier("query"),
        computed: false,
        optional: true,
      },
    };
    const computedLiteralTag = {
      type: "MemberExpression",
      object: identifier("ctx"),
      property: { type: "Literal", value: "$queryRaw" },
      computed: true,
    };
    const computedIdentifierTag = {
      type: "MemberExpression",
      object: identifier("ctx"),
      property: identifier("rawTag"),
      computed: true,
    };
    const callTag = {
      type: "MemberExpression",
      object: {
        type: "CallExpression",
        callee: identifier("getClient"),
        arguments: [],
      },
      property: identifier("$queryRaw"),
      computed: false,
    };
    const optionalComputedTag = {
      type: "MemberExpression",
      object: identifier("ctx"),
      property: { type: "Literal", value: "query" },
      computed: true,
      optional: true,
    };
    const optionalComputedIdentifierTag = {
      type: "MemberExpression",
      object: identifier("ctx"),
      property: identifier("query"),
      computed: true,
      optional: true,
    };
    const privateFieldTag = {
      type: "MemberExpression",
      object: identifier("ctx"),
      property: { type: "PrivateIdentifier", name: "query" },
      computed: false,
    };
    const superMemberTag = {
      type: "MemberExpression",
      object: { type: "Super" },
      property: identifier("query"),
      computed: false,
      optional: false,
    };
    const superCallTag = {
      type: "CallExpression",
      callee: { type: "Super" },
      arguments: [],
    };

    expect(
      compareTagExpressionToTagString(
        memberTag as never,
        "/\\.\\$executeRaw$/",
        parse,
      ),
    ).toBe(true);
    expect(
      compareTagExpressionToTagString(
        callTag as never,
        "/getClient\\(\\)\\.\\$queryRaw$/",
        parse,
      ),
    ).toBe(true);
    expect(
      compareTagExpressionToTagString(
        memberTag as never,
        "/\\.\\$queryRaw$/",
        parse,
      ),
    ).toBe(false);
    expect(
      compareTagExpressionToTagString(memberTag as never, "/[/", parse),
    ).toBe(false);
    expect(
      compareTagExpressionToTagString(
        optionalTag as never,
        "/this\\?\\.query$/",
        parse,
      ),
    ).toBe(true);
    expect(
      compareTagExpressionToTagString(
        computedLiteralTag as never,
        '/\\[\\"\\$queryRaw\\"\\]$/',
        parse,
      ),
    ).toBe(true);
    expect(
      compareTagExpressionToTagString(
        computedIdentifierTag as never,
        "/\\[rawTag\\]$/",
        parse,
      ),
    ).toBe(true);
    expect(
      compareTagExpressionToTagString(
        optionalComputedTag as never,
        '/ctx\\?\\.\\[\\"query\\"\\]$/',
        parse,
      ),
    ).toBe(true);
    expect(
      compareTagExpressionToTagString(
        optionalComputedIdentifierTag as never,
        "/ctx\\?\\.\\[query\\]$/",
        parse,
      ),
    ).toBe(true);
    expect(
      compareTagExpressionToTagString(
        privateFieldTag as never,
        "/query$/",
        parse,
      ),
    ).toBe(false);
    expect(
      compareTagExpressionToTagString(
        superMemberTag as never,
        "/query$/",
        parse,
      ),
    ).toBe(false);
    expect(
      compareTagExpressionToTagString(
        superCallTag as never,
        "/super\\(\\)$/",
        parse,
      ),
    ).toBe(false);
    expect(
      compareTagExpressionToTagString(
        { type: "BinaryExpression" } as never,
        "/query$/",
        parse,
      ),
    ).toBe(false);
    expect(parse).not.toHaveBeenCalled();
  });
});

describe("template literal identification", () => {
  it("reads a leading block comment from the node or its parent", () => {
    const node = { type: "TemplateLiteral", quasis: [], expressions: [] };
    const comment = {
      type: "Block",
      value: " html ",
      leading: true,
    };
    expect(
      parseCommentFromTemplateLiteralAstPath({
        node: { ...node, comments: [comment] },
      } as never),
    ).toBe("html");
    expect(
      parseCommentFromTemplateLiteralAstPath({
        node,
        parent: { comments: [comment] },
      } as never),
    ).toBe("html");
    expect(
      parseCommentFromTemplateLiteralAstPath({ node } as never),
    ).toBeUndefined();
    expect(
      parseCommentFromTemplateLiteralAstPath({
        node: { ...node, comments: [{ ...comment, leading: false }] },
      } as never),
    ).toBeUndefined();
    expect(
      parseCommentFromTemplateLiteralAstPath({
        node: { ...node, comments: [{ ...comment, value: "html" }] },
      } as never),
    ).toBeUndefined();
  });

  it("returns identifier or expression tags from the parent node", () => {
    const node = { type: "TemplateLiteral", quasis: [], expressions: [] };
    expect(
      parseTagFromTemplateLiteralAstPath({
        node,
        parent: { type: "TaggedTemplateExpression", tag: identifier("sql") },
      } as never),
    ).toBe("sql");
    const memberTag = { type: "MemberExpression", object: identifier("db") };
    expect(
      parseTagFromTemplateLiteralAstPath({
        node,
        parent: { type: "TaggedTemplateExpression", tag: memberTag },
      } as never),
    ).toBe(memberTag);
    expect(
      parseTagFromTemplateLiteralAstPath({ node } as never),
    ).toBeUndefined();
  });
});

describe("identification option generators", () => {
  it("uses configured comments, identifier fallbacks, and exclusions", () => {
    const identifiers = ["html", "sql"];
    const configured = ["markup"];
    const options = {
      embeddedHtmlIdentifiers: identifiers,
      embeddedHtmlComments: [fallbackIndicator],
      embeddedSqlComments: configured,
      noEmbeddedIdentificationByComment: ["skip"],
    } as unknown as Options;

    expect([
      ...createCommentsInOptionsGenerator(options, "active")("embeddedHtml"),
    ]).toEqual(identifiers);
    expect([
      ...createCommentsInOptionsGenerator(options, "active")("embeddedSql"),
    ]).toEqual(configured);
    expect([
      ...createCommentsInOptionsGenerator(options, "skip")("embeddedHtml"),
    ]).toEqual([]);
    expect([
      ...createCommentsInOptionsGenerator(
        {} as Options,
        "active",
      )("embeddedHtml"),
    ]).toEqual([]);
  });

  it("handles simple tags and complex tag expressions", () => {
    const options = {
      embeddedHtmlIdentifiers: ["html", "xml"],
      embeddedHtmlTags: [fallbackIndicator],
      embeddedSqlTags: ["query"],
      noEmbeddedIdentificationByTag: ["xml"],
    } as unknown as Options;

    expect([
      ...createTagsInOptionsGenerator(options, "html")("embeddedHtml"),
    ]).toEqual(["html", "xml"]);
    expect([
      ...createTagsInOptionsGenerator(options, "xml")("embeddedHtml"),
    ]).toEqual([]);
    expect([
      ...createTagsInOptionsGenerator(options, "query")("embeddedSql"),
    ]).toEqual(["query"]);
    expect([...createTagsInOptionsGenerator(options)("embeddedHtml")]).toEqual([
      "html",
    ]);
    expect([
      ...createTagsInOptionsGenerator({} as Options)("embeddedHtml"),
    ]).toEqual([]);
    expect([
      ...createTagsInOptionsGenerator({} as Options, "html")("embeddedHtml"),
    ]).toEqual([]);
  });
});

describe("embedded overrides and object comparison", () => {
  it("resolves an inline JSONC override by tag or identifier", async () => {
    const overrides = `[
      { "tags": ["sql"], "options": { "sqlDialect": "postgresql" } },
      { "identifiers": ["html"], "options": { "embeddedHtmlTags": ["view"] } },
    ]`;
    await expect(
      resolveEmbeddedOverrideOptions(overrides, {
        commentOrTag: "sql",
        kind: "tag",
      }),
    ).resolves.toEqual({ sqlDialect: "postgresql" });
    await expect(
      resolveEmbeddedOverrideOptions(overrides, {
        commentOrTag: "html",
        kind: "tag",
      }),
    ).resolves.toEqual({ embeddedHtmlTags: ["view"] });
    await expect(
      resolveEmbeddedOverrideOptions(overrides, {
        commentOrTag: "missing",
        kind: "tag",
      }),
    ).resolves.toBeUndefined();
    await expect(
      resolveEmbeddedOverrideOptions(undefined, {
        commentOrTag: "sql",
        kind: "tag",
      }),
    ).resolves.toBeUndefined();
  });

  it("loads JSON, JavaScript, and TypeScript override files", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "embed-overrides-"));
    const payload = [{ tags: ["sql"], options: { sqlDialect: "postgresql" } }];
    const json = JSON.stringify(payload);
    try {
      const jsonPath = path.join(directory, "overrides.json");
      const jsoncPath = path.join(directory, "overrides.jsonc");
      const extensionlessPath = path.join(directory, "overrides");
      const mjsPath = path.join(directory, "overrides.mjs");
      const cjsPath = path.join(directory, "overrides.cjs");
      const jsPath = path.join(directory, "overrides.js");
      const mtsPath = path.join(directory, "overrides.mts");
      const ctsPath = path.join(directory, "overrides.cts");
      const tsPath = path.join(directory, "overrides.ts");
      await Promise.all([
        writeFile(path.join(directory, "package.json"), '{"type":"module"}'),
        writeFile(jsonPath, json),
        writeFile(jsoncPath, `// JSONC override\n${json}`),
        writeFile(extensionlessPath, `// JSONC override\n${json}`),
        writeFile(mjsPath, `export default ${json};`),
        writeFile(cjsPath, `module.exports = ${json};`),
        writeFile(jsPath, `export default ${json};`),
        writeFile(mtsPath, `export default ${json} as const;`),
        writeFile(ctsPath, `module.exports = ${json} as const;`),
        writeFile(tsPath, `export default ${json} as const;`),
      ]);

      for (const filepath of [
        jsonPath,
        jsoncPath,
        extensionlessPath,
        mjsPath,
        cjsPath,
        jsPath,
        mtsPath,
        ctsPath,
        tsPath,
      ]) {
        await expect(
          resolveEmbeddedOverrideOptions(filepath, {
            commentOrTag: "sql",
            kind: "tag",
          }),
        ).resolves.toEqual({ sqlDialect: "postgresql" });
      }
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("resolves relative override paths from the Prettier config directory", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "embed-overrides-"));
    const payload = [{ tags: ["sql"], options: { sqlDialect: "postgresql" } }];
    try {
      await Promise.all([
        writeFile(path.join(directory, ".prettierrc.json"), "{}"),
        writeFile(
          path.join(directory, "overrides.json"),
          JSON.stringify(payload),
        ),
      ]);

      await expect(
        resolveEmbeddedOverrideOptions("./overrides.json", {
          commentOrTag: "sql",
          kind: "tag",
          filepath: path.join(directory, "query.js"),
        }),
      ).resolves.toEqual({ sqlDialect: "postgresql" });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("resolves relative override paths from PWD without a Prettier config", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "embed-overrides-"));
    const payload = [{ tags: ["sql"], options: { sqlDialect: "postgresql" } }];
    const originalPwd = process.env.PWD;
    try {
      await writeFile(
        path.join(directory, "overrides.json"),
        JSON.stringify(payload),
      );
      process.env.PWD = directory;

      await expect(
        resolveEmbeddedOverrideOptions("./overrides.json", {
          commentOrTag: "sql",
          kind: "tag",
          filepath: path.join(directory, "query.js"),
        }),
      ).resolves.toEqual({ sqlDialect: "postgresql" });
    } finally {
      if (originalPwd === undefined) {
        delete process.env.PWD;
      } else {
        process.env.PWD = originalPwd;
      }
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("falls back to cwd when PWD is unset and there is no Prettier config", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "embed-overrides-"));
    const payload = [{ tags: ["sql"], options: { sqlDialect: "postgresql" } }];
    const originalPwd = process.env.PWD;
    const cwdOverride = `.${path.basename(directory)}.json`;
    const cwdOverridePath = path.join(process.cwd(), cwdOverride);
    try {
      await Promise.all([
        writeFile(path.join(directory, "query.js"), ""),
        writeFile(cwdOverridePath, JSON.stringify(payload)),
      ]);
      delete process.env.PWD;

      await expect(
        resolveEmbeddedOverrideOptions(`./${cwdOverride}`, {
          commentOrTag: "sql",
          kind: "tag",
          filepath: path.join(directory, "query.js"),
        }),
      ).resolves.toEqual({ sqlDialect: "postgresql" });
    } finally {
      if (originalPwd === undefined) {
        delete process.env.PWD;
      } else {
        process.env.PWD = originalPwd;
      }
      await Promise.all([
        rm(directory, { recursive: true, force: true }),
        rm(cwdOverridePath, { force: true }),
      ]);
    }
  });

  it("reports unreadable override files and invalid JSON strings", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "embed-overrides-"));
    const brokenJsonPath = path.join(directory, "broken.json");
    const brokenModulePath = path.join(directory, "broken.mjs");
    const brokenTsPath = path.join(directory, "broken.ts");
    await Promise.all([
      writeFile(brokenJsonPath, "not json"),
      writeFile(brokenModulePath, "throw new Error('broken module');"),
      writeFile(brokenTsPath, "export default {"),
    ]);
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    try {
      for (const embeddedOverrides of [
        brokenJsonPath,
        brokenModulePath,
        brokenTsPath,
        "not a JSON override",
        "invalid-overrides.yaml",
      ]) {
        await expect(
          resolveEmbeddedOverrideOptions(embeddedOverrides, {
            commentOrTag: "sql",
            kind: "tag",
          }),
        ).resolves.toBeUndefined();
      }
      expect(consoleError).toHaveBeenCalled();
    } finally {
      consoleError.mockRestore();
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("compares nested values and respects ignored object keys", () => {
    expect(
      compareObjects(
        { name: "sql", meta: { values: [1, "two"] }, start: 1 },
        { name: "sql", meta: { values: [1, "two"] }, start: 9 },
        new Set(["start"]),
      ),
    ).toBe(true);
    expect(compareObjects({ value: null }, { value: {} })).toBe(false);
    expect(compareObjects({ values: [1, 2] }, { values: [1] })).toBe(false);
    expect(compareObjects({ values: [1, 2] }, { values: [1, 3] })).toBe(false);
  });

  it("returns null for languages without an embedder and collapses empty templates", () => {
    const template = {
      type: "TemplateLiteral",
      quasis: [{ value: { raw: "  ", cooked: "  " }, tail: true }],
      expressions: [],
    };

    expect(
      createEmbeddedDoc(
        template as never,
        "embeddedNoop" as never,
        "plain",
        "tag",
        {} as never,
      ),
    ).toBeNull();
    expect(
      createEmbeddedDoc(
        template as never,
        "embeddedHtml" as never,
        "html",
        "tag",
        {} as never,
      ),
    ).toBe("``");
  });

  it("runs an embedder and rethrows embedded formatter errors", async () => {
    const template = {
      type: "TemplateLiteral",
      quasis: [
        { value: { raw: "<p>hello</p>", cooked: "<p>hello</p>" }, tail: true },
      ],
      expressions: [],
    };
    const path = {
      node: template,
      map: () => [],
    };
    const embeddedDoc = createEmbeddedDoc(
      template as never,
      "embeddedHtml" as never,
      "html",
      "tag",
      {} as never,
    );
    expect(typeof embeddedDoc).toBe("function");
    if (typeof embeddedDoc !== "function") return;

    const formatted = await embeddedDoc(
      async (text) => text,
      () => "",
      path as never,
      {} as never,
    );
    expect(
      prettier.doc.printer.printDocToString(formatted as never, {
        printWidth: 80,
        tabWidth: 2,
      }).formatted,
    ).toContain("<p>hello</p>");

    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    try {
      await expect(
        embeddedDoc(
          async () => {
            throw new Error("embedded parser failed");
          },
          () => "",
          path as never,
          {} as never,
        ),
      ).rejects.toThrow("embedded parser failed");
      expect(consoleError).toHaveBeenCalledOnce();
    } finally {
      consoleError.mockRestore();
    }
  });
});
