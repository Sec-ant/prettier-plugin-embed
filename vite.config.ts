/// <reference types="vitest" />
import { defineConfig } from "vite";
import { peerDependencies } from "./package.json";
import { builtinModules } from "node:module";

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
    copyPublicDir: false,
    rollupOptions: {
      external: [
        /^@?prettier(?:\/|$)/,
        ...Object.keys(peerDependencies ?? {}),
        ...builtinModules,
        /^node:/,
      ],
    },
  },
  test: {
    passWithNoTests: true,
    coverage: {
      provider: "istanbul",
    },
  },
});
