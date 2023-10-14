// TODO: better tests
import { test } from "vitest";
import { format } from "prettier";
import { name as pluginName } from "../package.json";
import * as plugin from "../src/index.js";

const prettierPluginEmbed = { name: pluginName, ...plugin };

test("xml", async () => {
  const code = (await import("./code/xml.ts?raw")).default;
  const formattedCode = await format(code, {
    plugins: ["@prettier/plugin-xml", prettierPluginEmbed],
    filepath: "xml.ts",
    xmlWhitespaceSensitivity: "ignore",
  });
  console.log(formattedCode);
});

test("html", async () => {
  const code = (await import("./code/html.ts?raw")).default;
  const formattedCode = await format(code, {
    plugins: [prettierPluginEmbed],
    htmlWhitespaceSensitivity: "ignore",
    filepath: "html.ts",
  });
  console.log(formattedCode);
});

test("sql", async () => {
  const code = (await import("./code/sql.ts?raw")).default;
  const formattedCode = await format(code, {
    plugins: ["prettier-plugin-sql", prettierPluginEmbed],
    filepath: "sql.ts",
    embeddedSql: ["sql", "mariadb", "mdb"],
  });
  console.log(formattedCode);
});

test("php", async () => {
  const code = (await import("./code/php.ts?raw")).default;
  const formattedCode = await format(code, {
    plugins: ["@prettier/plugin-php", prettierPluginEmbed],
    filepath: "php.ts",
  });
  console.log(formattedCode);
});

test("es", async () => {
  const code = (await import("./code/es.ts?raw")).default;
  const formattedCode = await format(code, {
    plugins: [prettierPluginEmbed],
    filepath: "es.ts",
  });
  console.log(formattedCode);
});
