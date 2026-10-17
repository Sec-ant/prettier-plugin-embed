import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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
  it("caches candidate ASTs and parse failures within a matching context", () => {
    const cache = new Map();
    const parse = vi.fn((text: string) => {
      if (text === "invalid tag``") throw new Error("invalid tag");
      return programWithTag(identifier("sql")) as never;
    });
    for (let index = 0; index < 3; index++) {
      expect(
        compareTagExpressionToTagString(
          identifier("sql") as never,
          "sql",
          parse,
          cache,
        ),
      ).toBe(true);
      expect(
        compareTagExpressionToTagString(
          identifier("sql") as never,
          "invalid tag",
          parse,
          cache,
        ),
      ).toBe(false);
    }
    expect(parse).toHaveBeenCalledTimes(2);
  });

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
      resolveEmbeddedOverrideOptions(
        { embeddedOverrides: overrides },
        {
          commentOrTag: "sql",
          kind: "tag",
        },
      ),
    ).resolves.toEqual({ sqlDialect: "postgresql" });
    await expect(
      resolveEmbeddedOverrideOptions(
        { embeddedOverrides: overrides },
        {
          commentOrTag: "html",
          kind: "tag",
        },
      ),
    ).resolves.toEqual({ embeddedHtmlTags: ["view"] });
    await expect(
      resolveEmbeddedOverrideOptions(
        { embeddedOverrides: overrides },
        {
          commentOrTag: "missing",
          kind: "tag",
        },
      ),
    ).resolves.toBeUndefined();
    await expect(
      resolveEmbeddedOverrideOptions(
        {},
        {
          commentOrTag: "sql",
          kind: "tag",
        },
      ),
    ).resolves.toBeUndefined();
  });

  it.each(["mjs", "mts"])(
    "shares a %s override load and matches each template independently",
    async (extension) => {
      const directory = await mkdtemp(path.join(tmpdir(), "embed-overrides-"));
      const filepath = path.join(directory, `overrides.${extension}`);
      const marker = path.join(directory, "evaluations.txt");
      const options = { embeddedOverrides: filepath };
      const payload = [
        { tags: ["sql"], options: { keywordCase: "upper" } },
        { comments: ["sql"], options: { keywordCase: "lower" } },
        { identifiers: ["view"], options: { singleQuote: true } },
      ];
      const matches = [
        { commentOrTag: "sql", kind: "tag" },
        { commentOrTag: "sql", kind: "comment" },
        { commentOrTag: "view", kind: "tag" },
        { commentOrTag: "missing", kind: "tag" },
      ] as const;
      try {
        await writeFile(
          filepath,
          `import { appendFileSync } from "node:fs";
appendFileSync(new URL("./evaluations.txt", import.meta.url), "evaluated\\n");
export default ${JSON.stringify(payload)};`,
        );
        await expect(
          Promise.all(
            matches.map((match) =>
              resolveEmbeddedOverrideOptions(options, match),
            ),
          ),
        ).resolves.toEqual([
          { keywordCase: "upper" },
          { keywordCase: "lower" },
          { singleQuote: true },
          undefined,
        ]);
        await expect(
          resolveEmbeddedOverrideOptions(options, matches[0]),
        ).resolves.toEqual({ keywordCase: "upper" });
        expect(await readFile(marker, "utf8")).toBe("evaluated\n");

        await expect(
          resolveEmbeddedOverrideOptions({ ...options }, matches[0]),
        ).resolves.toEqual({ keywordCase: "upper" });
        expect(await readFile(marker, "utf8")).toBe("evaluated\nevaluated\n");
      } finally {
        await rm(directory, { recursive: true, force: true });
      }
    },
  );

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
          resolveEmbeddedOverrideOptions(
            { embeddedOverrides: filepath },
            {
              commentOrTag: "sql",
              kind: "tag",
            },
          ),
        ).resolves.toEqual({ sqlDialect: "postgresql" });
      }
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("uses native TypeScript loading when a consumer has tsx installed", async () => {
    const directory = await mkdtemp(
      path.join(tmpdir(), "embed-overrides space-"),
    );
    const loaderDirectory = path.join(directory, "node_modules/tsx");
    const filepath = path.join(directory, "overrides.mts");
    try {
      await mkdir(loaderDirectory, { recursive: true });
      await Promise.all([
        writeFile(
          path.join(loaderDirectory, "package.json"),
          JSON.stringify({
            type: "module",
            exports: {
              "./esm": "./api.mjs",
              "./esm/api": "./api.mjs",
            },
          }),
        ),
        writeFile(
          path.join(loaderDirectory, "api.mjs"),
          'throw new Error("consumer loader was evaluated");',
        ),
        writeFile(
          filepath,
          'export const embeddedOverrides = [{ tags: ["sql"], options: { keywordCase: "upper" } }] as const;',
        ),
      ]);

      await expect(
        resolveEmbeddedOverrideOptions(
          { embeddedOverrides: filepath },
          {
            commentOrTag: "sql",
            kind: "tag",
          },
        ),
      ).resolves.toEqual({ keywordCase: "upper" });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("preserves configuration errors and evaluates a failing module once", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "embed-overrides-"));
    const marker = path.join(directory, "evaluations.txt");
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    try {
      const cases = [
        [
          "throw.mts",
          'import { appendFileSync } from "node:fs";\nappendFileSync(new URL("./evaluations.txt", import.meta.url), "evaluated\\n");\nthrow new Error("invalid override setting");',
          "invalid override setting",
        ],
        [
          "missing.mts",
          'import "./missing-dependency.mjs";\nexport default [];',
          "missing-dependency.mjs",
        ],
        ["syntax.mts", "export default {", "SyntaxError"],
      ] as const;
      for (const [name, source, message] of cases) {
        const filepath = path.join(directory, name);
        const options = { embeddedOverrides: filepath };
        await writeFile(filepath, source);
        consoleError.mockClear();

        await expect(
          Promise.all([
            resolveEmbeddedOverrideOptions(options, {
              commentOrTag: "sql",
              kind: "tag",
            }),
            resolveEmbeddedOverrideOptions(options, {
              commentOrTag: "html",
              kind: "tag",
            }),
          ]),
        ).resolves.toEqual([undefined, undefined]);
        await expect(
          resolveEmbeddedOverrideOptions(options, {
            commentOrTag: "sql",
            kind: "comment",
          }),
        ).resolves.toBeUndefined();
        expect(consoleError).toHaveBeenCalledTimes(2);
        expect(consoleError.mock.calls.flat().map(String).join("\n")).toContain(
          message,
        );
        await writeFile(
          filepath,
          'export default [{ tags: ["sql"], options: { keywordCase: "upper" } }];',
        );
        await expect(
          resolveEmbeddedOverrideOptions(
            { ...options },
            { commentOrTag: "sql", kind: "tag" },
          ),
        ).resolves.toEqual({ keywordCase: "upper" });
        expect(consoleError).toHaveBeenCalledTimes(2);
      }
      expect(await readFile(marker, "utf8")).toBe("evaluated\n");
    } finally {
      consoleError.mockRestore();
      await rm(directory, { recursive: true, force: true });
    }
  });

  it.each(["mjs", "cjs", "mts", "cts"])(
    "reloads a %s override and its dependencies after configuration edits",
    async (extension) => {
      const directory = await mkdtemp(path.join(tmpdir(), "embed-overrides-"));
      const filepath = path.join(directory, `overrides.${extension}`);
      const commonjs = extension === "cjs" || extension === "cts";
      const dependencyPath = path.join(
        directory,
        commonjs ? "options.cjs" : "options.mjs",
      );
      const exportOptions = (keywordCase: string) =>
        `${commonjs ? "module.exports =" : "export default"} { keywordCase: "${keywordCase}" };`;
      const resolveOptions = () =>
        resolveEmbeddedOverrideOptions(
          { embeddedOverrides: filepath },
          {
            commentOrTag: "sql",
            kind: "tag",
          },
        );
      try {
        await Promise.all([
          writeFile(dependencyPath, exportOptions("upper")),
          writeFile(
            filepath,
            commonjs
              ? 'module.exports = [{ tags: ["sql"], options: require("./options.cjs") }];'
              : 'import options from "./options.mjs";\nexport default [{ tags: ["sql"], options }];',
          ),
        ]);
        await expect(resolveOptions()).resolves.toEqual({
          keywordCase: "upper",
        });

        await writeFile(dependencyPath, exportOptions("lower"));
        await expect(resolveOptions()).resolves.toEqual({
          keywordCase: "lower",
        });

        await writeFile(
          filepath,
          `${commonjs ? "module.exports =" : "export default"} [{ tags: ["sql"], options: { keywordCase: "upper" } }];`,
        );
        await expect(resolveOptions()).resolves.toEqual({
          keywordCase: "upper",
        });
      } finally {
        await rm(directory, { recursive: true, force: true });
      }
    },
  );

  it("resolves when an override module exits before exporting", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "embed-overrides-"));
    const filepath = path.join(directory, "overrides.mjs");
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    try {
      await writeFile(filepath, "process.exit(0);");
      await expect(
        resolveEmbeddedOverrideOptions(
          { embeddedOverrides: filepath },
          {
            commentOrTag: "sql",
            kind: "tag",
          },
        ),
      ).resolves.toBeUndefined();
      expect(consoleError).toHaveBeenCalledWith(
        `Failed to parse the js module file: ${filepath}`,
      );
    } finally {
      consoleError.mockRestore();
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
        resolveEmbeddedOverrideOptions(
          {
            embeddedOverrides: "./overrides.json",
            filepath: path.join(directory, "query.js"),
          },
          { commentOrTag: "sql", kind: "tag" },
        ),
      ).resolves.toEqual({ sqlDialect: "postgresql" });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("follows refreshed Prettier config discovery for relative overrides", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "embed-overrides-"));
    const nestedDirectory = path.join(directory, "nested");
    const options = {
      embeddedOverrides: "./overrides.json",
      filepath: path.join(nestedDirectory, "query.js"),
    };
    const resolveOptions = () =>
      resolveEmbeddedOverrideOptions(
        { ...options },
        { commentOrTag: "sql", kind: "tag" },
      );
    const overrides = (keywordCase: string) =>
      JSON.stringify([{ tags: ["sql"], options: { keywordCase } }]);
    try {
      await mkdir(nestedDirectory);
      await Promise.all([
        writeFile(path.join(directory, ".prettierrc.json"), "{}"),
        writeFile(path.join(directory, "overrides.json"), overrides("upper")),
        writeFile(
          path.join(nestedDirectory, "overrides.json"),
          overrides("lower"),
        ),
      ]);

      await expect(resolveOptions()).resolves.toEqual({ keywordCase: "upper" });

      await writeFile(path.join(nestedDirectory, ".prettierrc.json"), "{}");
      await prettier.clearConfigCache();
      await expect(resolveOptions()).resolves.toEqual({ keywordCase: "lower" });
    } finally {
      await prettier.clearConfigCache();
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
        resolveEmbeddedOverrideOptions(
          {
            embeddedOverrides: "./overrides.json",
            filepath: path.join(directory, "query.js"),
          },
          { commentOrTag: "sql", kind: "tag" },
        ),
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
        resolveEmbeddedOverrideOptions(
          {
            embeddedOverrides: `./${cwdOverride}`,
            filepath: path.join(directory, "query.js"),
          },
          { commentOrTag: "sql", kind: "tag" },
        ),
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
          resolveEmbeddedOverrideOptions(
            { embeddedOverrides },
            {
              commentOrTag: "sql",
              kind: "tag",
            },
          ),
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
    const error = new Error("embedded parser failed");
    try {
      await expect(
        embeddedDoc(
          async () => {
            throw error;
          },
          () => "",
          path as never,
          {} as never,
        ),
      ).rejects.toBe(error);
      expect(consoleError).not.toHaveBeenCalled();
    } finally {
      consoleError.mockRestore();
    }
  });
});
