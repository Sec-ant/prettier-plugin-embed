import { pathToFileURL } from "node:url";
import { parentPort, workerData } from "node:worker_threads";

async function importModule(moduleUrl: URL) {
  try {
    return await import(moduleUrl.href);
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !("code" in error) ||
      ![
        "ERR_UNKNOWN_FILE_EXTENSION",
        "ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX",
        "ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING",
      ].includes(String(error.code))
    ) {
      throw error;
    }

    const { register } = await import("node:module");
    if (!register) {
      throw error;
    }
    // Resolve worker imports from the consumer with Node's import conditions.
    register(
      `data:text/javascript,${encodeURIComponent(`
        export function resolve(specifier, context, nextResolve) {
          return nextResolve(specifier, {
            ...context,
            parentURL: context.parentURL === ${JSON.stringify(import.meta.url)}
              ? ${JSON.stringify(moduleUrl.href)}
              : context.parentURL,
          });
        }
      `)}`,
    );

    let loaderUrls: string[];
    try {
      loaderUrls = await Promise.all(
        ["tsx/cjs/api", "tsx/esm/api"].map((specifier) =>
          import.meta.resolve(specifier),
        ),
      );
    } catch {
      throw error;
    }

    const [commonjs, esm] = await Promise.all(
      loaderUrls.map((loaderUrl) => import(loaderUrl)),
    );
    commonjs.register();
    // Scoped imports bypass native loading failures cached by older runtimes.
    const loader = esm.register({ namespace: "prettier-plugin-embed" });
    return loader.import(moduleUrl.href, moduleUrl.href);
  }
}

const executeWorker = async ({ absolutePath }: { absolutePath: string }) => {
  try {
    const importedModule = await importModule(pathToFileURL(absolutePath));
    parentPort?.postMessage({
      overrides: importedModule.embeddedOverrides ?? importedModule.default,
    });
  } catch (error) {
    parentPort?.postMessage({
      error: error instanceof Error ? error : new Error(String(error)),
    });
  } finally {
    parentPort?.close();
  }
};

executeWorker(workerData);
