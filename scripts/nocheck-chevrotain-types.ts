import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const filePath = fileURLToPath(
  new URL("../dist/embedded/xml/parser.d.ts", import.meta.url),
);

const fileContent = await readFile(filePath, { encoding: "utf8" });

await writeFile(filePath, `// @ts-nocheck\n${fileContent}`);
