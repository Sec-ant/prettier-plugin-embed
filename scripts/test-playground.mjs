import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import {
  isMainThread,
  parentPort,
  Worker,
  workerData,
} from "node:worker_threads";

if (isMainThread) {
  const assets = new URL("../playground/dist/assets/", import.meta.url);
  const entry = (await readdir(assets)).find((file) =>
    /^format\.worker-.*\.js$/.test(file),
  );
  assert.ok(entry, "Build the playground before testing its worker");
  const worker = new Worker(new URL(import.meta.url), {
    workerData: { entry: new URL(entry, assets).href },
  });
  let requestId = 0;
  function format(code, config = {}) {
    return new Promise((resolve, reject) => {
      worker.once("error", reject);
      worker.once("message", (response) => {
        worker.off("error", reject);
        resolve(response);
      });
      worker.postMessage({
        id: ++requestId,
        code,
        config: JSON.stringify({
          plugins: ["prettier-plugin-embed", "prettier-plugin-toml"],
          ...config,
        }),
        plugins: ["toml"],
        compare: false,
      });
    });
  }
  const timeout = setTimeout(() => {
    console.error("Playground worker smoke test timed out");
    process.exit(1);
  }, 30_000);
  try {
    const options = { stringQuoteStyle: "single" };
    const result = await format(
      'const config = toml`[package]\nname="myapp"`;\n/* toml */ `version="1.0.0"`;',
      options,
    );
    assert.equal(result.error, undefined);
    assert.deepEqual(result.warnings, []);
    assert.match(result.output, /name = 'myapp'/);
    assert.match(result.output, /version = '1\.0\.0'/);
    const repeated = await format(result.output, options);
    assert.equal(repeated.error, undefined);
    assert.equal(repeated.output, result.output);
    const invalid = await format(
      'const config = toml`[package\nname="myapp"`;',
    );
    assert.ok(invalid.error, "Invalid TOML must surface an error");
    console.log("Playground TOML worker smoke passed");
  } finally {
    clearTimeout(timeout);
    await worker.terminate();
  }
} else {
  // Exercise the emitted browser worker and WASM using Node's Web APIs.
  globalThis.self = globalThis;
  globalThis.addEventListener = (type, listener) => {
    assert.equal(type, "message");
    parentPort.on("message", (data) => listener({ data }));
  };
  globalThis.postMessage = (message) => parentPort.postMessage(message);
  const fetch = globalThis.fetch;
  globalThis.fetch = async (input, options) => {
    const url = new URL(input, workerData.entry);
    if (url.protocol === "file:") {
      // Deployed builds can use an absolute site base; assets remain siblings.
      const asset = new URL(url.pathname.split("/").at(-1), workerData.entry);
      return new Response(await readFile(asset), {
        headers: { "Content-Type": "application/wasm" },
      });
    }
    return fetch(input, options);
  };
  await import(workerData.entry);
}
