import { copyFile, unlink } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const readmeFilePath = fileURLToPath(new URL("../README.md", import.meta.url));

const readmeBackupFilePath = resolve(dirname(readmeFilePath), "README.bak");

await copyFile(readmeBackupFilePath, readmeFilePath);

await unlink(readmeBackupFilePath);
