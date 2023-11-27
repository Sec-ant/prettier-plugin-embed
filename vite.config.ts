/// <reference types="vitest" />
import { transform } from "esbuild";
import { readFile } from "node:fs/promises";
import { builtinModules } from "node:module";
import { defineConfig } from "vite";
import { peerDependencies } from "./package.json";

export default defineConfig({
  build: {
    target: ["node18"],
    lib: {
      entry: {
        index: "./src/index.ts",
      },
      formats: ["es"],
      fileName: (format, entryName) =>
        format === "es" ? `${entryName}.js` : `${entryName}.${format}.js`,
    },
    rollupOptions: {
      external: [
        /^@?prettier(?:\/|$)/,
        ...Object.keys(peerDependencies ?? {}),
        ...builtinModules,
        /^node:/,
      ],
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
  },
  test: {
    passWithNoTests: true,
    coverage: {
      provider: "istanbul",
    },
  },
});
