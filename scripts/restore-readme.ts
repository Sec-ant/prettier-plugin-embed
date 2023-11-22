import { copyFile, unlink } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const readmeFilePath = fileURLToPath(new URL("../README.md", import.meta.url));

const readmeBackupFilePath = resolve(dirname(readmeFilePath), "__rm.bak");

await copyFile(readmeBackupFilePath, readmeFilePath);

await unlink(readmeBackupFilePath);
