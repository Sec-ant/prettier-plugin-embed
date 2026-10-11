/// <reference types="vitest" />

import { builtinModules } from "node:module";
import { defineConfig } from "vite";

const external = [
  /^prettier(?:\/|$)/,
  /(?:^|@.+?\/)prettier-plugin-/,
  /^@prettier\/plugin-/,
];

export default defineConfig(({ command }) => ({
  build: {
    target: ["node18"],
    lib: {
      entry: {
        index: "./src/index.ts",
        "import-module-worker": "./scripts/import-module-worker.ts",
      },
      formats: ["es"],
      fileName: (_, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external: [...external, ...builtinModules, /^node:/],
    },
  },
  define: {
    IMPORT_MODULE_WORKER_URL: JSON.stringify(
      command === "build"
        ? "./import-module-worker.js"
        : "../scripts/import-module-worker.ts",
    ),
  },
  test: {
    passWithNoTests: true,
    coverage: {
      provider: "v8",
      thresholds: {
        branches: 98,
        functions: 98,
        lines: 98,
        statements: 98,
      },
    },
  },
}));
