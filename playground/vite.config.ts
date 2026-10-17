import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm";
import { browserCompatibility } from "./browser-compat.ts";
import { packageNames } from "./src/package-names.ts";

const require = createRequire(import.meta.url);
const dependencies: Record<string, string> = {};
for (const name of new Set(Object.values(packageNames))) {
  let directory = path.dirname(require.resolve(name));
  while (directory !== path.dirname(directory)) {
    const manifest = path.join(directory, "package.json");
    if (existsSync(manifest)) {
      const pkg = JSON.parse(readFileSync(manifest, "utf8"));
      if (pkg.name === name) {
        dependencies[name] = pkg.version;
        break;
      }
    }
    directory = path.dirname(directory);
  }
}

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  base: process.env.PLAYGROUND_BASE ?? "./",
  plugins: [browserCompatibility(), wasm()],
  optimizeDeps: {
    rolldownOptions: { plugins: [browserCompatibility()] },
  },
  resolve: {
    alias: Object.fromEntries(
      [
        ["babel", "babel"],
        ["espree", "acorn"],
        ["flow", "flow"],
        ["meriyah", "meriyah"],
        ["typescript", "typescript"],
      ].map(([old, name]) => [
        `prettier/parser-${old}`,
        `prettier/plugins/${name}`,
      ]),
    ),
  },
  define: {
    PLAYGROUND_DEPENDENCIES: JSON.stringify(dependencies),
    IMPORT_MODULE_WORKER_URL: JSON.stringify("./import-module-worker.js"),
  },
  worker: { format: "es", plugins: () => [browserCompatibility(), wasm()] },
  build: {
    outDir: "dist",
    target: "es2022",
    chunkSizeWarningLimit: 2000,
  },
});
