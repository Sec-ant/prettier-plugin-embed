import { pathToFileURL } from "node:url";
import { parentPort, workerData } from "node:worker_threads";

const executeWorker = async ({ absolutePath }: { absolutePath: string }) => {
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
