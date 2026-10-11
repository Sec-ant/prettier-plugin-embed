import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import prettier from "prettier";

const source = "const query = sql`select * from users`;";
const typedOverrides = `enum KeywordCase { Upper = "upper" }
const overrides = [{ tags: ["sql"], options: { keywordCase: KeywordCase.Upper } }];
`;
const cases = [
  ["typed-overrides.ts", "export default overrides;"],
  ["typed-overrides.mts", "export const embeddedOverrides = overrides;"],
  ["typed-overrides.cts", "module.exports = overrides;"],
  ["typed-export.cts", "export = overrides;"],
  ["commonjs/overrides.ts", "module.exports = overrides;", "commonjs"],
  ["node_modules/consumer-overrides/overrides.mts", "export default overrides;"],
];

for (const [filepath, exportStatement, moduleType] of cases) {
  const overrideUrl = new URL(filepath, import.meta.url);
  const directory = new URL("./", overrideUrl);
  await mkdir(directory, { recursive: true });
  if (moduleType) {
    await writeFile(
      new URL("package.json", directory),
      JSON.stringify({ type: moduleType }),
    );
  }
  await writeFile(overrideUrl, `${typedOverrides}${exportStatement}\n`);
  const formatted = await prettier.format(source, {
    parser: "babel",
    plugins: ["prettier-plugin-embed", "prettier-plugin-sql"],
    embeddedSqlTags: ["sql"],
    embeddedOverrides: fileURLToPath(overrideUrl),
    keywordCase: "lower",
  });
  assert.match(formatted, /\bSELECT\b/, `TypeScript override applies: ${filepath}`);
}

console.log("TypeScript module formats passed with Node " + process.versions.node);
