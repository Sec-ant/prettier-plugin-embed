/// <reference types="vitest" />
import { builtinModules } from "node:module";
import { defineConfig } from "vite";
import { optionalDependencies, peerDependencies } from "./package.json";

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
        ...Object.keys(optionalDependencies ?? {}),
        /^tsx(?:\/|$)/,
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
