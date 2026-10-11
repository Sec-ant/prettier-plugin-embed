import { readFile } from "node:fs/promises";
import path from "node:path";
import prettier from "prettier";
import { expect, it } from "vitest";
import * as embed from "../../src";

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
