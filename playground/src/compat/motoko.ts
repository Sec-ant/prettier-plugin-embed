// Initialize the package's bundler WASM entry asynchronously before exporting
// its CommonJS plugin. The published web entry requires WASM synchronously.

import * as plugin from "prettier-plugin-motoko/lib/index.js";
import { setWasm } from "prettier-plugin-motoko/lib/wasm.js";
import * as wasm from "prettier-plugin-motoko/wasm/pkg/bundler/wasm.js";

setWasm(wasm);
export default plugin;
