import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import prettier from "prettier";
import { globSync } from "tinyglobby";
import { beforeAll, describe, expect, it } from "vitest";
import * as embed from "../src";

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
  try {
    const content = readFileSync(configPath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.warn(`Failed to load language options from ${configPath}:`, error);
    return {};
  }
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
    try {
      return JSON.parse(match[1]);
    } catch (error) {
      console.warn(`Failed to parse @prettier options: ${optionsLine}`, error);
      return {};
    }
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
  });

  // Create a describe block for each language
  describe(language, () => {
    beforeAll(() => {
      // mute pug logs during tests
      process.env.PRETTIER_PLUGIN_PUG_LOG_LEVEL = "off";
    });

    for (const file of files) {
      // Skip options.json
      if (file.endsWith("options.json")) {
        continue;
      }

      const filename = path.basename(file);

      it(filename, async () => {
        const content = readFileSync(file, "utf-8");
        const fileOptions = parsePrettierOptions(content);
        const codeToFormat = getContentWithoutOptionsLine(content);

        const formatted = await prettier.format(codeToFormat, {
          ...restOptions,
          ...fileOptions,
          plugins: [embed, ...plugins],
          filepath: file,
        });

        // Use snapshot with language/filename key for uniqueness
        expect(formatted).toMatchSnapshot();
      });
    }
  });
}
