import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { parentPort, workerData } from "node:worker_threads";

const executeWorker = async ({
  absolutePath,
  importMetaUrl,
}: {
  absolutePath: string;
  importMetaUrl: string;
}) => {
  register("tsx/esm", {
    parentURL: importMetaUrl,
    data: true,
  });
  try {
    const importedModule = await import(pathToFileURL(absolutePath).href);
    parentPort?.postMessage(
      importedModule.embeddedOverrides ?? importedModule.default ?? undefined,
    );
  } catch {
    parentPort?.postMessage(undefined);
  }
};

executeWorker(workerData);
