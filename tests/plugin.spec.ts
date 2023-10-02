/// <reference types="vite/client" />
import { test } from "vitest";
import { format, type Options } from "prettier";
import { fileURLToPath } from "node:url";
import type { EmbeddedLanguage, PrettierPluginEmbedOptions } from "../src";

const PLUGIN_EMBED = fileURLToPath(
  new URL("../dist/index.js", import.meta.url),
);

// TODO: reorganize and add more tests
test("0", async () => {
  const code = (await import("./code/0.ts?raw")).default;
  const formattedCode = await format(code, {
    plugins: ["@prettier/plugin-xml", PLUGIN_EMBED],
    filepath: "0.js",
    parser: "babel",
    embeddedLanguages: JSON.stringify([
      {
        tag: "xml",
        comment: "xml",
        embedder: "xml",
      },
    ] as EmbeddedLanguage[]),
  } as Options & PrettierPluginEmbedOptions);
  console.log(formattedCode);
});
