import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import prettier from "prettier";

const overrideUrl = new URL("./live-overrides.mts", import.meta.url);
const dependencyUrl = new URL("./live-options.mts", import.meta.url);
const source = "const query = sql`select * from users`;";
const format = () =>
  prettier.format(source, {
    parser: "babel",
    plugins: ["prettier-plugin-embed", "prettier-plugin-sql"],
    embeddedSqlTags: ["sql"],
    embeddedOverrides: fileURLToPath(overrideUrl),
    keywordCase: "lower",
  });

await writeFile(
  dependencyUrl,
  process.argv.includes("--transform")
    ? 'enum KeywordCase { Upper = "upper" } export default KeywordCase.Upper;'
    : 'const keywordCase: "upper" = "upper"; export default keywordCase;',
);
await writeFile(
  overrideUrl,
  'import keywordCase from "./live-options.mts"; export default await Promise.resolve([{ tags: ["sql"], options: { keywordCase } }]);',
);
assert.match(await format(), /\bSELECT\b/, "initial override applies");

await writeFile(
  dependencyUrl,
  'const keywordCase: "lower" = "lower"; export default keywordCase;',
);
assert.match(
  await format(),
  /\bselect\b/,
  "dependency edit applies in the same process",
);

await writeFile(overrideUrl, 'throw new Error("invalid override setting");');
const errors = [];
const originalConsoleError = console.error;
console.error = (error) => errors.push(String(error));
try {
  assert.match(await format(), /\bselect\b/);
  assert.match(errors.join("\n"), /invalid override setting/);
} finally {
  console.error = originalConsoleError;
}

await writeFile(
  overrideUrl,
  'export default [{ tags: ["sql"], options: { keywordCase: "upper" } }];',
);
assert.match(
  await format(),
  /\bSELECT\b/,
  "corrected override applies at the same URL",
);
console.log(
  "Override edits passed in one process with " +
    (process.versions.bun
      ? "Bun " + process.versions.bun
      : "Node " + process.versions.node),
);
