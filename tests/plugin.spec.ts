import { test } from "vitest";
import { format } from "prettier";
import { name as pluginName } from "../package.json";
import * as plugin from "../src/index.js";

const prettierPluginEmbed = { name: pluginName, ...plugin };

test("ruby", async () => {
  const code = (await import("./ruby/tag.ts?raw")).default;
  const formattedCode = await format(code, {
    plugins: ["@prettier/plugin-ruby", prettierPluginEmbed],
    filepath: "ruby.ts",
  });
  console.log(formattedCode);
});

test("glsl", async () => {
  const code = (await import("./glsl/tag.ts?raw")).default;
  const formattedCode = await format(code, {
    plugins: ["prettier-plugin-glsl", prettierPluginEmbed],
    filepath: "glsl.ts",
  });
  console.log(formattedCode);
});
