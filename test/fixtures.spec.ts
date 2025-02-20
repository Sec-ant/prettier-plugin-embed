import fs from "node:fs/promises";
import path from "node:path";

import prettier from "prettier";
import sql from "prettier-plugin-sql";
import * as embed from "../src";

import { describe, expect, it } from "vitest";

describe("fixtures", () => {
  it("should work", async () => {
    for (const file of await fs.readdir("test/fixtures")) {
      const filepath = path.resolve("test/fixtures", file);
      const code = await fs.readFile(filepath, "utf-8");
      const formatted = await prettier.format(code, {
        filepath,
        plugins: [embed, sql],
        embeddedSqlTags: ["sql.type"],
      });
      expect(formatted).toMatchSnapshot();
    }
  });
});
