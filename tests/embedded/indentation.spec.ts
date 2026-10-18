import prettier from "prettier";
import { parsers as yamlParsers } from "prettier/plugins/yaml";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import * as embed from "../../src";
import {
  contents,
  templateContent,
  templates,
  unindentTemplate,
} from "../helpers/templates.js";

beforeAll(() => {
  vi.stubEnv("PRETTIER_DEBUG", "true");
  vi.stubEnv("PRETTIER_PLUGIN_PUG_LOG_LEVEL", "off");
});
afterAll(() => vi.unstubAllEnvs());

const examples = [
  {
    tag: "md",
    body: "\n  # Heading\n\nParagraph\n\n    code\n",
    expected: "# Heading\n\nParagraph\n\n    code",
  },
  {
    tag: "md",
    body: "\n    first()\n\nParagraph\n\n    second()\n",
    expected: "    first()\n\nParagraph\n\n    second()",
  },
  {
    tag: "md",
    body: "\n- Parent\n  - Child\n\n    code\n",
    expected: "- Parent\n  - Child\n\n    code",
  },
  {
    tag: "yaml",
    body: "\n  # comment\nroot:\n  child:\n    value: 1\n",
    expected: "# comment\nroot:\n  child:\n    value: 1",
  },
  {
    tag: "pug",
    plugins: ["@prettier/plugin-pug"],
    body: "\n    div\n      span hi\n    p bye\n",
    expected: "div\n  span hi\np bye",
  },
  {
    tag: "jinja",
    plugins: ["prettier-plugin-jinja-template"],
    body: "<pre>\n  first\n    second\n</pre>",
    expected: "<pre>\n  first\n    second\n</pre>",
  },
  ...[
    ["html", ""],
    ["astro", "prettier-plugin-astro"],
    ["goTemplate", "@htnabe/prettier-plugin-go-template"],
    ["handlebars", "@poliklot/prettier-plugin-handlebars"],
    ["jte", "prettier-plugin-jte"],
    ["liquid", "@shopify/prettier-plugin-liquid"],
    ["marko", "prettier-plugin-marko"],
    ["mustache", "prettier-plugin-mustache"],
    ["nunjucks", "prettier-plugin-nunjucks"],
    ["svelte", "prettier-plugin-svelte"],
    ["xml", "@prettier/plugin-xml"],
  ].map(([tag, plugin]) => ({
    tag: tag!,
    plugins: plugin ? [plugin] : [],
    body: "<pre>\n  first\n    second\n</pre>",
    expected: "<pre>\n  first\n    second\n</pre>",
  })),
  ...["js", "ts"].map((tag) => ({
    tag,
    body: "const text = `first\n  second\n`;",
    expected: "`first\n  second\n`",
  })),
  {
    tag: "css",
    body: "/*\n  first\n    second\n*/\na { color: red; }",
    expected: "/*\n  first\n    second\n*/",
  },
  {
    tag: "hugo",
    plugins: ["@htnabe/prettier-plugin-hugo-post"],
    body: "---\ntitle: Example\n---\n\n- Parent\n  - Child\n\n    code\n",
    expected: "---\ntitle: Example\n---\n\n- Parent\n  - Child\n\n    code",
  },
  {
    tag: "sql",
    plugins: ["prettier-plugin-sql"],
    body: "select '\n  first\n    second\n' as value",
    expected: "'\n  first\n    second\n'",
  },
  {
    tag: "sql",
    plugins: ["prettier-plugin-sql"],
    body: "select $$first\n  second$$ as value",
    expected: "$$first\n  second$$",
  },
  {
    tag: "toml",
    plugins: ["prettier-plugin-toml"],
    body: 'text = """\n  first\n    second\n"""\n',
    expected: '"""\n  first\n    second\n"""',
  },
  {
    tag: "sh",
    plugins: ["prettier-plugin-sh"],
    body: "cat <<'EOF'\n  first\n    second\nEOF\n",
    expected: "\n  first\n    second\nEOF",
  },
  {
    tag: "powershell",
    plugins: ["prettier-plugin-powershell"],
    body: "$text = @'\n  first\n    second\n'@\n",
    expected: "@'\n  first\n    second\n'@",
  },
];

it.each([false, true])(
  "keeps actual Markdown meaning in a deeply nested host: tabs=%s",
  async (useTabs) => {
    vi.stubEnv("PRETTIER_DEBUG", "true");
    const body = "\n# Heading\n\n- Parent\n  - Child\n\n    code\n";
    const source =
      "function example() {\nif (ready) {\nif (active) {\nreturn md`" +
      body +
      "`;\n}\n}\n}";
    const options = {
      parser: "typescript",
      plugins: [embed],
      useTabs,
      noEmbeddedMultiLineIndentation: ["md"],
    };
    const formatted = await prettier.format(source, options);
    const raw = (await templates(formatted))[0]!.quasis[0]!.value.cooked!;
    expect(await prettier.format(raw, { parser: "markdown" })).toBe(
      await prettier.format(body, { parser: "markdown" }),
    );
    expect(await prettier.format(formatted, options)).toBe(formatted);
  },
);

it.each(
  ["html", "md", "yaml", "sql"].flatMap((tag) =>
    [false, true].flatMap((tabs) =>
      [false, true].flatMap((preserve) =>
        [false, true].map((noIndent) => ({ tag, tabs, preserve, noIndent })),
      ),
    ),
  ),
)(
  "keeps JavaScript literal roots inside interpolations: %j",
  async ({ tag, tabs, preserve, noIndent }) => {
    vi.stubEnv("PRETTIER_DEBUG", "true");
    const expression = "${" + "String.raw`one\n  two\n`}";
    const content = {
      html: `<section><p>${expression}</p></section>`,
      md: `# ${expression}`,
      yaml: `value: ${expression}`,
      sql: `select ${expression}`,
    }[tag]!;
    const source = `function example() {\nconst result = ${tag}\`\n    ${content}\n    \`;\n}`;
    const options: prettier.Options = {
      parser: "typescript",
      plugins: [embed, "prettier-plugin-sql"],
      language: "postgresql",
      useTabs: tabs,
      tabWidth: tabs ? 4 : 2,
      preserveEmbeddedExteriorWhitespaces: preserve ? [tag] : [],
      noEmbeddedMultiLineIndentation: noIndent ? [tag] : [],
    };
    const formatted = await prettier.format(source, options);
    expect(
      (await templates(formatted)).find((node) =>
        node.quasis[0]!.value.cooked?.startsWith("one\n"),
      )?.quasis[0]?.value.cooked,
    ).toBe("one\n  two\n");
    expect(await prettier.format(formatted, options)).toBe(formatted);
  },
);

it.each(["  ", "\t "])(
  "preserves YAML same-line trailing whitespace: %j",
  async (trailingWhitespace) => {
    const source = `const x = yaml\`value: 1${trailingWhitespace}\`;\n`;
    const options = {
      parser: "typescript",
      plugins: [embed],
      preserveEmbeddedExteriorWhitespaces: ["yaml"],
    };
    const formatted = await prettier.format(source, options);
    expect(formatted).toBe(source);
    expect(await prettier.format(formatted, options)).toBe(formatted);
  },
);

it.each(
  ["|", "|+", "|-", ">", ">+", ">-"].flatMap((marker) =>
    [0, 1, 2, 3].flatMap((newlines) =>
      [false, true].flatMap((preserve) =>
        [false, true].map((tabs) => ({ marker, newlines, preserve, tabs })),
      ),
    ),
  ),
)(
  "preserves YAML block scalar values: %j",
  async ({ marker, newlines, preserve, tabs }) => {
    const body = `\ntext: ${marker}\n  first${"\n".repeat(newlines)}`;
    const options = {
      parser: "typescript",
      plugins: [embed],
      useTabs: tabs,
      preserveEmbeddedExteriorWhitespaces: preserve ? ["yaml"] : [],
    };
    const formatted = await prettier.format(
      `const x = yaml\`${body}\`;`,
      options,
    );
    async function values(text: string) {
      const result: unknown[] = [];
      const ast = await yamlParsers.yaml!.parse(text, {} as never);
      function visit(value: unknown) {
        if (Array.isArray(value)) {
          for (const child of value) visit(child);
        } else if (value && typeof value === "object") {
          const node = value as Record<string, unknown>;
          if (node.type === "blockLiteral" || node.type === "blockFolded")
            result.push(node.value);
          if (node.children) visit(node.children);
        }
      }
      visit(ast);
      return result;
    }
    const actual = unindentTemplate(
      (await templates(formatted))[0]!.quasis[0]!.value.cooked!,
    );
    expect(await values(actual)).toEqual(await values(body));
    expect(await prettier.format(formatted, options)).toBe(formatted);
  },
);

for (const { tag, plugins = [], body, expected } of examples) {
  describe(`${tag}: ${JSON.stringify(body)}`, () => {
    for (const comment of [false, true]) {
      for (const useTabs of [false, true]) {
        for (const noIndent of [false, true]) {
          for (const preserveExterior of [false, true]) {
            it(`preserves semantic content: comment=${comment}, tabs=${useTabs}, noIndent=${noIndent}, preserveExterior=${preserveExterior}`, async () => {
              // Go-template's nested HTML embed relies on Prettier's fallback
              // for <pre> nodes; PRETTIER_DEBUG rethrows that upstream failure.
              vi.stubEnv(
                "PRETTIER_DEBUG",
                tag === "goTemplate" ? undefined : "true",
              );
              const escaped = body.replaceAll(/([\\`])/g, "\\$1");
              const source = `function example() {\nconst result = ${comment ? `/* ${tag} */ ` : tag}\`${escaped}\`;\n}`;
              const options: prettier.Options = {
                parser: "typescript",
                filepath: import.meta.filename,
                plugins: [embed, ...plugins],
                language: "postgresql",
                xmlWhitespaceSensitivity: "strict",
                useTabs,
                tabWidth: useTabs ? 4 : 2,
                noEmbeddedMultiLineIndentation: noIndent ? [tag] : [],
                preserveEmbeddedExteriorWhitespaces: preserveExterior
                  ? [tag]
                  : [],
              };
              const formatted = await prettier.format(source, options);
              const referenceParser = {
                md: "markdown",
                yaml: "yaml",
                pug: "pug",
                hugo: "hugo-post",
              }[tag];
              if (referenceParser) {
                const reference = await prettier.format(templateContent(body), {
                  parser: referenceParser,
                  plugins,
                  filepath: import.meta.filename,
                  useTabs: tag === "yaml" ? false : useTabs,
                  tabWidth: options.tabWidth,
                  __inJsTemplate: true,
                } as prettier.Options);
                expect((await contents(formatted))[0]).toBe(
                  templateContent(reference),
                );
              } else {
                expect((await contents(formatted))[0]).toContain(expected);
              }
              expect(await prettier.format(formatted, options)).toBe(formatted);
            });
          }
        }
      }
    }
  });
}
