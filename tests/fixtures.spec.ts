import { readFile } from "node:fs/promises";
import prettier from "prettier";
import sql from "prettier-plugin-sql";
import { glob } from "tinyglobby";
import { describe, expect, it } from "vitest";
import * as embed from "../src";

describe("fixtures", () => {
  it("should work", async () => {
    for (const file of await glob("./fixtures/*", {
      cwd: import.meta.dirname,
      absolute: true,
    })) {
      const code = await readFile(file, { encoding: "utf-8" });
      const formatted = await prettier.format(code, {
        filepath: file,
        plugins: [embed, sql],
        embeddedSqlTags: ["sql.type"],
      });
      expect(formatted).toMatchSnapshot();
    }
  });
});
