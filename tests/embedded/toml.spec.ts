import prettier from "prettier";
import toml from "prettier-plugin-toml";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import * as embed from "../../src";
import type { PluginTomlOptions } from "../../src/embedded/toml/plugin-toml-types.js";

beforeEach(() => vi.stubEnv("PRETTIER_DEBUG", "true"));
afterEach(() => vi.unstubAllEnvs());

it.each(["babel-ts", "typescript"])(
  "formats tagged and commented TOML with native plugin options using %s",
  async (parser) => {
    const tomlOptions = {
      keyValueEqualsSignSpaceWidth: 3,
      stringQuoteStyle: "single",
    } satisfies PluginTomlOptions;
    const options = {
      parser,
      filepath: import.meta.filename,
      plugins: [embed, toml],
      ...tomlOptions,
    };
    const source =
      'const config = toml`[package]\nname="myapp"`;\n/* toml */ `version="1.0.0"`;';
    const formatted = await prettier.format(source, options);

    expect(formatted).toContain("name   =   'myapp'");
    expect(formatted).toContain("version   =   '1.0.0'");
    expect(await prettier.format(formatted, options)).toBe(formatted);
  },
);

it("applies TOML options from embedded overrides", async () => {
  const options = {
    parser: "babel",
    filepath: import.meta.filename,
    plugins: [embed, toml],
    embeddedOverrides: JSON.stringify([
      {
        tags: ["toml"],
        options: {
          keyValueEqualsSignSpaceWidth: 0,
          stringQuoteStyle: "single",
        },
      },
    ]),
  };
  const formatted = await prettier.format(
    'const config = toml`name = "myapp"`;',
    options,
  );

  expect(formatted).toContain("name='myapp'");
  expect(await prettier.format(formatted, options)).toBe(formatted);
});

it("surfaces native TOML parser errors in debug mode", async () => {
  await expect(
    prettier.format('const config = toml`[package\nname="myapp"`;', {
      parser: "babel",
      filepath: import.meta.filename,
      plugins: [embed, toml],
    }),
  ).rejects.toThrow(SyntaxError);
});
