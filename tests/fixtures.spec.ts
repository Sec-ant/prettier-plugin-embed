import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import prettier from "prettier";
import { globSync } from "tinyglobby";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import * as embed from "../src";
import { embeddedEmbedders } from "../src/embedded/index.js";
import type { Embedder } from "../src/types.js";
import { templateExpressions } from "./helpers/template-expressions.js";

interface LanguageOptions {
  plugins?: string[];
  [key: string]: unknown;
}

/**
 * Load language-specific configuration from fixtures/{language}/options.json
 */
function loadLanguageOptions(languageDir: string): LanguageOptions {
  const configPath = path.join(languageDir, "options.json");
  if (!existsSync(configPath)) {
    return {};
  }
  return JSON.parse(readFileSync(configPath, "utf-8"));
}

/**
 * Find the line containing @prettier options in the content
 * Returns the line index if found, -1 otherwise
 */
function findPrettierOptionsLineIndex(content: string): number {
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (lines[i]?.match(/^\/\/\s*@prettier\s+/)) {
      return i;
    }
  }
  return -1;
}

/**
 * Parse prettier options from @prettier comment in the fixture file
 * Format: // @prettier {"key": "value", ...}
 * Can be on any line, not just the first line
 */
function parsePrettierOptions(content: string): Record<string, unknown> {
  const optionsLineIndex = findPrettierOptionsLineIndex(content);
  if (optionsLineIndex === -1) {
    return {};
  }
  const optionsLine = content.split("\n")[optionsLineIndex] ?? "";
  const match = optionsLine.match(/^\/\/\s*@prettier\s+({.+})$/);
  if (match?.[1]) {
    return JSON.parse(match[1]);
  }
  return {};
}

/**
 * Get the content without the @prettier options comment line
 */
function getContentWithoutOptionsLine(content: string): string {
  const optionsLineIndex = findPrettierOptionsLineIndex(content);
  if (optionsLineIndex === -1) {
    return content;
  }
  const lines = content.split("\n");
  return lines.filter((_, index) => index !== optionsLineIndex).join("\n");
}

const fixturesDir = path.join(import.meta.dirname, "fixtures");
const languageDirs = globSync("*/", {
  cwd: fixturesDir,
  onlyDirectories: true,
}).sort();

function rubyParserServerPids() {
  if (process.platform === "win32") {
    return [];
  }

  return execFileSync("ps", ["-axo", "pid=,command="], {
    encoding: "utf8",
  })
    .split("\n")
    .flatMap((line) => {
      const match =
        /^\s*(\d+) ruby .*\/node_modules\/\.pnpm\/@prettier\+plugin-ruby@.*\/src\/server\.rb --plugins=.*prettier-ruby-parser-.*\.txt$/.exec(
          line,
        );
      return match?.[1] ? [Number(match[1])] : [];
    });
}

const existingRubyParserServerPids = new Set<number>();
const embedderSpies = Object.keys(embeddedEmbedders).map((language) =>
  vi.spyOn(
    embeddedEmbedders as Record<keyof typeof embeddedEmbedders, Embedder>,
    language as keyof typeof embeddedEmbedders,
  ),
);

beforeAll(() => {
  vi.stubEnv("PRETTIER_DEBUG", undefined);
  // Mute pug logs during all fixture tests.
  process.env.PRETTIER_PLUGIN_PUG_LOG_LEVEL = "off";
  for (const pid of rubyParserServerPids()) {
    existingRubyParserServerPids.add(pid);
  }
});

afterAll(() => {
  vi.unstubAllEnvs();
  for (const spy of embedderSpies) spy.mockRestore();
  // @prettier/plugin-ruby's detached server survives Vitest worker teardown.
  for (const pid of rubyParserServerPids()) {
    if (!existingRubyParserServerPids.has(pid)) {
      try {
        process.kill(pid);
      } catch {
        // The server may already have exited.
      }
    }
  }
});

for (const languageDir of languageDirs) {
  const language = languageDir.replace(/\/$/, "");
  const languagePath = path.join(fixturesDir, language);

  // Load language-specific options
  const { plugins = [], ...restOptions } = loadLanguageOptions(languagePath);

  // Get all fixture files for this language
  const files = globSync(`${language}/*`, {
    cwd: fixturesDir,
    absolute: true,
  })
    .filter((file) => /\.(?:js|ts)$/.test(file))
    .sort();

  // Create a describe block for each language
  describe(language, () => {
    for (const file of files) {
      const filename = path.basename(file);

      it(filename, async () => {
        const content = readFileSync(file, "utf-8");
        const fileOptions = parsePrettierOptions(content);
        const codeToFormat = getContentWithoutOptionsLine(content);

        const formatOptions = {
          ...restOptions,
          ...fileOptions,
          plugins: [embed, ...plugins],
          filepath: file,
        };
        for (const spy of embedderSpies) spy.mockClear();
        const errors = vi.spyOn(console, "error").mockImplementation(() => {});
        let formatted: string;
        try {
          formatted = await prettier.format(codeToFormat, formatOptions);
          const formattedAgain = await prettier.format(
            formatted,
            formatOptions,
          );

          expect(
            errors,
            "embedded formatting should succeed",
          ).not.toHaveBeenCalled();
          expect(
            embedderSpies.flatMap((spy) => [
              ...spy.mock.results.filter((result) => result.type === "throw"),
              ...spy.mock.settledResults.filter(
                (result) => result.type !== "fulfilled",
              ),
            ]),
            "embedded formatting should succeed",
          ).toEqual([]);
          expect(
            formattedAgain,
            "fixture formatting should be idempotent",
          ).toBe(formatted);
        } finally {
          errors.mockRestore();
        }

        expect(
          await templateExpressions(formatted),
          "formatting preserves template expressions and their order",
        ).toEqual(await templateExpressions(codeToFormat));

        // Snapshot names include the language describe block and fixture filename.
        expect(formatted).toMatchSnapshot();
      });
    }
  });
}

describe("markup template whitespace", () => {
  it("matches native HTML alignment and preserves missing boundary whitespace", async () => {
    const content = "<section><h1>Hello</h1><p>World</p></section>";
    for (const [leading, trailing] of [
      ["\n", "\n"],
      ["\n\t  ", "\n "],
      ["", ""],
      [" ", ""],
      ["", " "],
    ]) {
      for (const nested of [false, true]) {
        const template = `const view = html\`${leading}${content}${trailing}\`;`;
        const source = nested
          ? `function render() {\n${template}\n}`
          : template;
        for (const htmlWhitespaceSensitivity of ["css", "strict"] as const) {
          for (const useTabs of [false, true]) {
            const options = {
              parser: "typescript",
              htmlWhitespaceSensitivity,
              useTabs,
            };
            const formatted = await prettier.format(source, {
              ...options,
              plugins: [embed],
            });
            expect(formatted).toBe(await prettier.format(source, options));
            expect(
              await prettier.format(formatted, {
                ...options,
                plugins: [embed],
              }),
            ).toBe(formatted);
          }
        }
      }
    }
  });

  it("keeps the indentation and exact whitespace options for tags and comments", async () => {
    for (const language of ["html", "jinja"]) {
      const plugins = [embed, "prettier-plugin-jinja-template"];
      for (const identifier of [language, `/* ${language} */ `]) {
        const start = `  const view = ${identifier}\``;
        const source = [
          "function render() {",
          start,
          "<section><p>Hello</p><p>World</p></section>",
          "`;",
          "}",
        ].join("\n");
        for (const noIndent of [false, true]) {
          const options = {
            parser: "typescript",
            plugins,
            noEmbeddedMultiLineIndentation: noIndent ? [language] : [],
          };
          const padding = noIndent ? "  " : "    ";
          const formatted = await prettier.format(source, options);
          expect(formatted).toBe(
            [
              "function render() {",
              start,
              `${padding}<section>`,
              `${padding}  <p>Hello</p>`,
              `${padding}  <p>World</p>`,
              `${padding}</section>`,
              "  `;",
              "}",
              "",
            ].join("\n"),
          );
          expect(await prettier.format(formatted, options)).toBe(formatted);

          const exactSource = `${start} \n\t <section><p>Hello</p></section>\n \t\`;`;
          const exactOptions = {
            ...options,
            preserveEmbeddedExteriorWhitespaces: [language],
          };
          const exact = await prettier.format(exactSource, exactOptions);
          expect(exact).toContain("` \n\t <section>");
          expect(exact).toContain("</section>\n \t`;");
          expect(await prettier.format(exact, exactOptions)).toBe(exact);
        }
      }
    }
  });
});
