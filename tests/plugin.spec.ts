/// <reference types="vite/client" />
/// <reference types="../dist" />

import { test } from "vitest";
import { Options, format } from "prettier";
import { fileURLToPath } from "node:url";

const PRETTIER_PLUGIN_EMBED = fileURLToPath(
  new URL("../dist/index.js", import.meta.url),
);

test("xml", async () => {
  const code = (await import("./code/xml.ts?raw")).default;
  const formattedCode = await format(code, {
    plugins: ["@prettier/plugin-xml", PRETTIER_PLUGIN_EMBED],
    filepath: "xml.ts",
  } as Options);
  console.log(formattedCode);
});

test("sql", async () => {
  const code = (await import("./code/sql.ts?raw")).default;
  const formattedCode = await format(code, {
    plugins: ["prettier-plugin-sql", PRETTIER_PLUGIN_EMBED],
    filepath: "sql.ts",
    embeddedSql: ["sql", "mariadb", "mdb"],
  } as Options);
  console.log(formattedCode);
});

test("php", async () => {
  const code = (await import("./code/php.ts?raw")).default;
  const formattedCode = await format(code, {
    plugins: ["@prettier/plugin-php", PRETTIER_PLUGIN_EMBED],
    filepath: "php.ts",
  } as Options);
  console.log(formattedCode);
});
