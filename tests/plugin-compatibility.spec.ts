import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import prettier, { type Options, type Plugin } from "prettier";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import * as embed from "../src";
import { templateExpressions } from "./helpers/template-expressions.js";

// Selected using npm's version download counts (2026-10-18) and upstream
// breaking changes. Current versions already run through the full fixture suite.
const cases: {
  alias: string;
  language: string;
  reason: string;
  unsupported?: RegExp;
}[] = [
  {
    alias: "compat-toml-v2",
    language: "toml",
    reason: "Widely used Taplo formatter, before the v3 engine replacement.",
  },
  {
    alias: "compat-toml-v3",
    language: "toml",
    reason: "WASM formatter, before v4 switched to a native Node binding.",
  },
  {
    alias: "compat-svelte-v3",
    language: "svelte",
    reason: "Widely used v3; v4 requires Svelte 5 and removes options.",
  },
  {
    alias: "compat-astro-v0",
    language: "astro",
    reason: "Most downloaded version, before v1 changed the compiler runtime.",
  },
  {
    alias: "compat-xml-v2",
    language: "xml",
    reason: "Widely used, but its Prettier 2 embed API is unsupported.",
    unsupported: /printer\.embed has too many parameters/,
  },
  {
    alias: "compat-php-v0-24",
    language: "php",
    reason: "Previous release has usage comparable to the current release.",
  },
  {
    alias: "compat-sh-v0-17",
    language: "sh",
    reason: "Before the Prettier 3.6 minimum and shell-runtime upgrades.",
  },
];

beforeAll(() => vi.stubEnv("PRETTIER_DEBUG", "true"));
afterAll(() => vi.unstubAllEnvs());

for (const { alias, language, reason, unsupported } of cases) {
  describe(`${alias}: ${reason}`, () => {
    const directory = path.join(import.meta.dirname, "fixtures", language);
    const { plugins: _plugins, ...languageOptions } = JSON.parse(
      readFileSync(path.join(directory, "options.json"), "utf8"),
    );
    for (const file of ["basic.js", "interpolations.ts"]) {
      const filepath = path.join(directory, file);
      if (file !== "basic.js" && !existsSync(filepath)) continue;

      it(file, async () => {
        const module = await import(/* @vite-ignore */ alias);
        const plugin: Plugin = module.default?.parsers
          ? module.default
          : module;
        expect(plugin.parsers).toBeDefined();
        const source = readFileSync(filepath, "utf8");
        const options: Options = {
          ...languageOptions,
          filepath,
          plugins: [embed, plugin],
        };
        if (unsupported) {
          await expect(prettier.format(source, options)).rejects.toThrow(
            unsupported,
          );
          return;
        }
        const errors = vi.spyOn(console, "error").mockImplementation(() => {});
        try {
          const formatted = await prettier.format(source, options);
          const hostOnly = await prettier.format(source, {
            ...options,
            embeddedLanguageFormatting: "off",
          });
          expect(formatted, "formats embedded content").not.toBe(hostOnly);
          expect(await prettier.format(formatted, options)).toBe(formatted);
          expect(await templateExpressions(formatted)).toEqual(
            await templateExpressions(source),
          );
          expect(errors).not.toHaveBeenCalled();
        } finally {
          errors.mockRestore();
        }
      });
    }
  });
}
