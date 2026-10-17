import { readdir, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import type { Plugin } from "vite";

// These adapters only replace host integration, never language formatting.
// Keep the installed formatter algorithms and WASM assets in the build.
export function browserCompatibility(): Plugin {
  return {
    name: "playground-browser-host",
    enforce: "pre",
    async generateBundle() {
      const directory = path.dirname(
        createRequire(import.meta.url).resolve("prettier-plugin-solidity"),
      );
      for (const file of await readdir(directory)) {
        if (file.endsWith(".wasm"))
          this.emitFile({
            type: "asset",
            fileName: `assets/${file}`,
            source: await readFile(path.join(directory, file)),
          });
      }
    },
    resolveId(id, importer) {
      if (
        id === "@reteps/dockerfmt" &&
        importer?.includes("prettier-plugin-sh/")
      )
        return "\0playground-docker-runtime";
      if (id === "sh-syntax" && importer?.includes("prettier-plugin-sh/")) {
        return "\0playground-sh-runtime";
      }
    },
    async load(id) {
      if (id === "\0playground-docker-runtime") {
        const plugin = createRequire(import.meta.url).resolve(
          "prettier-plugin-sh",
        );
        const directory = path.dirname(
          createRequire(plugin).resolve("@reteps/dockerfmt"),
        );
        return `import {formatDockerfileContents as format} from ${JSON.stringify(path.join(directory, "format.js"))};
import wasmUrl from ${JSON.stringify(`${path.join(directory, "format.wasm")}?url`)};
let bytes;
export const formatDockerfileContents = (code, options) => format(code, options, () => bytes ??= fetch(wasmUrl).then(response => {
  if (!response.ok) throw new Error('Could not load Dockerfile WASM: ' + response.status);
  return response.arrayBuffer();
})).catch(error => { console.warn("Dockerfile formatter: " + error.message); throw error; });`;
      }
      if (id === "\0playground-sh-runtime") {
        const require = createRequire(import.meta.url);
        const pluginEntry = require.resolve("prettier-plugin-sh");
        const shRequire = createRequire(pluginEntry);
        const entry = shRequire.resolve("sh-syntax");
        const wasm = path.resolve(path.dirname(entry), "../main.wasm");
        const browser = path.join(path.dirname(entry), "browser.js");
        return `import Go from ${JSON.stringify(path.resolve(path.dirname(entry), "../vendors/wasm_exec.cjs"))};
globalThis.Go = Go;
import {getProcessor} from ${JSON.stringify(browser)};
export * from ${JSON.stringify(browser)};
import wasmUrl from ${JSON.stringify(`${wasm}?url`)};
export const processor = getProcessor(() => fetch(wasmUrl).then(r => {
  if (!r.ok) throw new Error('Could not load Shell WASM: ' + r.status);
  return r.arrayBuffer();
}));`;
      }
    },
    async transform(code, id) {
      if (id.includes("pug-lexer/") && id.endsWith("/index.js")) {
        return code.replace(
          "var assert = require('assert');",
          "function assert(value, message) { if (!value) throw new Error(message); }",
        );
      }
      if (
        id.includes("@reteps/dockerfmt/") &&
        id.endsWith("/dist/wasm_exec.js")
      ) {
        return `const runtime = {crypto: globalThis.crypto, performance: globalThis.performance, TextEncoder: globalThis.TextEncoder, TextDecoder: globalThis.TextDecoder};\n${code.replaceAll("globalThis", "runtime")}\nexport { runtime };`;
      }
      if (id.includes("@reteps/dockerfmt/") && id.endsWith("/dist/format.js")) {
        return code
          .replace(
            "import './wasm_exec.js';",
            "import {runtime} from './wasm_exec.js';",
          )
          .replaceAll("globalThis.__dockerfmt_", "runtime.__dockerfmt_");
      }
      if (
        id.includes("@htnabe/prettier-plugin-hugo-post/") &&
        id.endsWith("/dist/index.mjs")
      ) {
        return code.replace(
          'plugins: ["prettier-plugin-toml"]',
          'plugins: [(await import("prettier-plugin-toml")).default]',
        );
      }
      if (id.includes("sh-syntax/") && id.endsWith("/vendors/wasm_exec.cjs")) {
        const isolated = code.replace(
          /\tif \(!global\.require[\s\S]*?\n\tconst enosys/,
          "\tconst enosys",
        );
        return `const global = {crypto: globalThis.crypto, performance: globalThis.performance, TextEncoder: globalThis.TextEncoder, TextDecoder: globalThis.TextDecoder};\n${isolated}\nmodule.exports = global.Go;`;
      }
      if (
        id.includes("prettier-plugin-sh/") &&
        id.endsWith("/lib/languages.js")
      ) {
        return code.replace(
          "import path from 'node:path';",
          `const path = {
  basename: value => value.split('/').at(-1),
  dirname: value => value.slice(0, value.lastIndexOf('/'))
};`,
        );
      }
      if (
        id.includes("prettier-plugin-toml/") &&
        id.endsWith("/lib/discover.js")
      ) {
        return "export async function discoverTombiConfig() { return undefined; }";
      }
      if (id.includes("prettier-plugin-toml/") && id.endsWith("/lib/wasm.js")) {
        const entry = await this.resolve("@tombi-toml/wasm-lib", id);
        if (!entry) throw new Error("Could not resolve TOML WASM package.");
        const wasm = path.join(path.dirname(entry.id), "tombi_wasm_bg.wasm");
        return `import wasmUrl from ${JSON.stringify(`${wasm}?url`)};
export async function loadWasm() {
  const response = await fetch(wasmUrl);
  if (!response.ok) throw new Error('Could not load TOML WASM: ' + response.status);
  return response.arrayBuffer();
}`;
      }
      if (
        id.includes("@prettier/plugin-pug/") &&
        id.endsWith("/dist/index.js")
      ) {
        return code
          .replace(
            /import\{types as (\w+)\}from"node:util";/,
            'const $1={isRegExp: value => Object.prototype.toString.call(value) === "[object RegExp]"};',
          )
          .replaceAll("process.env.PRETTIER_PLUGIN_PUG_LOG_LEVEL", "undefined");
      }
    },
  };
}
