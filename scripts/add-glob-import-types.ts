import { appendFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { glob } from "tinyglobby";

const registerTypeDeclarationFilePath = fileURLToPath(
  new URL("../dist/embedded/register.d.ts", import.meta.url),
);

try {
  await stat(registerTypeDeclarationFilePath);
} catch {
  throw new Error(`'${registerTypeDeclarationFilePath}' does not exist.`);
}

const registerSourceDirectoryPath = fileURLToPath(
  new URL("../src/embedded", import.meta.url),
);

const embeddedEntryFiles = await glob("./*/index.{ts,js}", {
  cwd: registerSourceDirectoryPath,
});

if (embeddedEntryFiles.length === 0) {
  throw new Error("Embedded entry files do not exist.");
}

const data = embeddedEntryFiles
  .map(
    (fileName, index) =>
      `import * as __glob__0_${index} from "${fileName
        .replace(/^/, "./")
        .replace(/\.ts$/, ".js")}";`,
  )
  .join("\n");

await appendFile(registerTypeDeclarationFilePath, data, {
  encoding: "utf8",
});
