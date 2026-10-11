import { readFile } from "node:fs/promises";
import path from "node:path";
import prettier from "prettier";
import { expect, it, vi } from "vitest";
import * as embed from "../../src";

it("preserves nested YAML indentation without parser diagnostics", async () => {
  const filepath = path.join(import.meta.dirname, "../fixtures/yaml/nested.js");
  const source = await readFile(filepath, "utf8");
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

  try {
    const formatted = await prettier.format(source, {
      filepath,
      plugins: [embed],
    });

    expect(formatted).toMatch(/services:\n {2,}api:\n {4,}ports:/);
    expect(consoleError).not.toHaveBeenCalled();
  } finally {
    consoleError.mockRestore();
  }
});
