import { createRequire, register } from "node:module";
import { pathToFileURL } from "node:url";
import { parentPort, workerData } from "node:worker_threads";

const executeWorker = async ({ absolutePath }: { absolutePath: string }) => {
  try {
    if (!process.versions.bun) {
      let loader: string | undefined;
      try {
        loader = createRequire(pathToFileURL(absolutePath)).resolve("tsx/esm");
      } catch (error) {
        if (!process.features.typescript) throw error;
      }
      if (loader) {
        register(pathToFileURL(loader), {
          parentURL: pathToFileURL(absolutePath),
          data: true,
        });
      }
    }
    const importedModule = await import(pathToFileURL(absolutePath).href);
    parentPort?.postMessage(
      importedModule.embeddedOverrides ?? importedModule.default ?? undefined,
    );
  } catch {
    parentPort?.postMessage(undefined);
  }
};

executeWorker(workerData);
