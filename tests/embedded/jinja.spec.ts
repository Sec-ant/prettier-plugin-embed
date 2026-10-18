import { readFile } from "node:fs/promises";
import path from "node:path";
import prettier from "prettier";
import { expect, it } from "vitest";
import * as embed from "../../src";

it("identifies the upstream source-dependent wrapping limitation", async () => {
  const source =
    "<section>{% if user %}<h1>{{user.name}}</h1>{% else %}<p>Guest</p>{% endif %}</section>";
  const options = {
    parser: "jinja-template",
    plugins: ["prettier-plugin-jinja-template"],
    printWidth: 72,
    useTabs: true,
    tabWidth: 4,
  };
  const first = await prettier.format(source, options);
  // This comparison deliberately uses only the upstream plugin, not embed.
  expect(await prettier.format(first, options)).not.toBe(first);
});

it.each(["babel-ts", "typescript"])(
  "formats multiline Jinja blocks with wrapping and tabs using %s",
  async (parser) => {
    const source = await readFile(
      path.join(import.meta.dirname, "../fixtures/jinja/interpolations.ts"),
      "utf8",
    );
    const options = {
      parser,
      plugins: [embed, "prettier-plugin-jinja-template"],
      printWidth: 40,
      tabWidth: 4,
      useTabs: true,
      htmlWhitespaceSensitivity: "ignore" as const,
    };
    const formatted = await prettier.format(source, options);
    expect(await prettier.format(formatted, options)).toBe(formatted);
    expect(formatted).toContain("{% if user %}");
    expect(formatted).toContain("{% endif %}");
    expect(formatted.match(/getFirstValue/g)).toHaveLength(1);
    expect(formatted.match(/getSecondValue/g)).toHaveLength(1);
  },
);
