/// <reference types="vitest" />

import { readFile } from "node:fs/promises";
import { builtinModules } from "node:module";
import { transform } from "esbuild";
import { defineConfig } from "vite";

const external = [
  /^prettier(?:\/|$)/,
  /(?:^|@.+?\/)prettier-plugin-/,
  "@xml-tools/parser",
];

export default defineConfig({
  build: {
    target: ["node18"],
    lib: {
      entry: {
        index: "./src/index.ts",
      },
      formats: ["es"],
      fileName: (_, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external: [...external, ...builtinModules, /^node:/],
    },
  },
  define: {
    IMPORT_JS_MODULE_WORKER: JSON.stringify(
      (
        await transform(
          await readFile("./scripts/import-js-module-worker.ts"),
          {
            loader: "ts",
            minify: true,
          },
        )
      ).code.trim(),
    ),
    IMPORT_TS_MODULE_WORKER: JSON.stringify(
      (
        await transform(
          await readFile("./scripts/import-ts-module-worker.ts"),
          {
            loader: "ts",
            minify: true,
          },
        )
      ).code.trim(),
    ),
  },
  test: {
    passWithNoTests: true,
    coverage: {
      provider: "v8",
      thresholds: {
        branches: 98.5,
        functions: 98.5,
        lines: 97.8,
        statements: 97.7,
      },
    },
  },
});
