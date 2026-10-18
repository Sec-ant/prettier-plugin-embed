import prettier from "prettier";
import { expect, it, vi } from "vitest";
import * as embed from "../../src";
import { templates } from "../helpers/templates.js";

it("identifies the upstream preformatted-text limitation", async () => {
  vi.stubEnv("PRETTIER_DEBUG", "true");
  try {
    await expect(
      prettier.format("<pre>\n  first\n    second\n</pre>", {
        parser: "go-template",
        plugins: ["@htnabe/prettier-plugin-go-template"],
      }),
    ).rejects.toThrow("Cannot read properties of undefined");
  } finally {
    vi.unstubAllEnvs();
  }
});

it("keeps preformatted Go template content when the upstream formatter rejects it", async () => {
  vi.stubEnv("PRETTIER_DEBUG", undefined);
  try {
    const body = "<pre>\n  first\n    second\n</pre>";
    const output = await prettier.format(
      `const view = goTemplate\`${body}\`;`,
      {
        parser: "typescript",
        plugins: [embed, "@htnabe/prettier-plugin-go-template"],
      },
    );
    expect((await templates(output))[0]!.quasis[0]!.value.cooked).toBe(body);
  } finally {
    vi.unstubAllEnvs();
  }
});
