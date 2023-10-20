import { readFile, writeFile, copyFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const readmeFilePath = fileURLToPath(new URL("../README.md", import.meta.url));

const readmeBackupFilePath = resolve(dirname(readmeFilePath), "README.bak");

await copyFile(readmeFilePath, readmeBackupFilePath);

const fileContent = await readFile(readmeFilePath, "utf8");

const newFileContent = fileContent
  .replace(/.+#gh-dark-mode-only.+\n/, "")
  .replace("#gh-light-mode-only", "");

await writeFile(readmeFilePath, newFileContent, { encoding: "utf8" });
