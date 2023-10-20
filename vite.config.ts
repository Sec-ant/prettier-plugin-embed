/// <reference types="vitest" />
import { defineConfig } from "vite";
import { peerDependencies } from "./package.json";

export default defineConfig({
  build: {
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
      external: [/^@?prettier(?:\/|$)/, ...Object.keys(peerDependencies ?? {})],
    },
  },
  test: {
    passWithNoTests: true,
    coverage: {
      provider: "istanbul",
    },
  },
});
