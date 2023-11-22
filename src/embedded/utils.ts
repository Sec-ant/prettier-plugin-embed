import type { Expression, Comment, TemplateLiteral } from "estree";
import {
  type AstPath,
  type Options,
  type Doc,
  resolveConfigFile,
} from "prettier";
import { builders, utils } from "prettier/doc";
import memoize from "micro-memoize";
import { isAbsolute, resolve, dirname, extname } from "node:path";
import { readFile } from "node:fs/promises";
import { Worker } from "node:worker_threads";
import { packageUp } from "package-up";
import type { EmbeddedOverrides, InternalPrintFun } from "../types.js";

const { group, indent, softline, lineSuffixBoundary } = builders;
const { mapDoc } = utils;

export function printTemplateExpression(
  path: AstPath<Expression & { comments?: Comment[] }>,
  print: InternalPrintFun,
) {
  const { node } = path;
  let printed = print();
  if (node?.comments?.length) {
    printed = group([indent([softline, printed]), softline]);
  }
  return ["${", printed, lineSuffixBoundary, "}"];
}

export function printTemplateExpressions(
  path: AstPath<TemplateLiteral>,
  print: InternalPrintFun,
) {
  return path.map(
    (path) => printTemplateExpression(path, print),
    "expressions",
  );
}

export function simpleRehydrateDoc(
  doc: Doc,
  placeholderRegex: RegExp,
  expressionDocs: Doc[],
) {
  const contentDoc = mapDoc(doc, (doc) => {
    if (typeof doc !== "string") {
      return doc;
    }
    const parts = [];
    const components = doc.split(placeholderRegex);
    for (let i = 0; i < components.length; i++) {
      let component = components[i];
      if (i % 2 == 0) {
        if (!component) {
          continue;
        }
        component = component.replaceAll(/([\\`]|\${)/g, "\\$1");
        parts.push(component);
      } else {
        const placeholderIndex = Number(component);
        parts.push(expressionDocs[placeholderIndex]);
      }
    }
    return parts;
  });
  return contentDoc;
}

export function throwIfPluginIsNotFound(
  pluginName: string,
  options: Options,
  identifier: string,
) {
  if (
    !(
      options.plugins?.some(
        (p) => (p as { name?: string }).name?.includes(pluginName) ?? false,
      ) ?? false
    )
  ) {
    throw new Error(
      `Cannot format embedded language identified by "${identifier}", because plugin "${pluginName}" is not loaded.`,
    );
  }
}

export function insertEmbeddedLanguage(
  embeddedLanguages: string[],
  embeddedLanguage: string,
  firstEmbeddedLanguage: string,
) {
  if (embeddedLanguage === firstEmbeddedLanguage) {
    embeddedLanguages.unshift(embeddedLanguage);
    return;
  }
  let low = 0;
  let high = embeddedLanguages.length;
  while (low < high) {
    const mid = (low + high) >>> 1;
    if (embeddedLanguages[mid] === firstEmbeddedLanguage) {
      embeddedLanguages.push(embeddedLanguage);
      return;
    }
    if (embeddedLanguages[mid] < embeddedLanguage) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  embeddedLanguages.splice(low, 0, embeddedLanguage);
}

export const randomUUID = (() => {
  const dict = [...Array(26).keys()]
    .map((key) => String.fromCharCode(key + 97))
    .concat([...Array(10).keys()].map((key) => `${key}`));
  return () => {
    const uuidLength = 16;
    let id = "";
    for (let i = 0; i < uuidLength; ++i) {
      id +=
        dict[
          parseInt((Math.random() * dict.length).toFixed(0), 10) % dict.length
        ];
    }
    return id;
  };
})();

export function preparePlaceholder(leading = "p", trailing = "") {
  const uuid1 = randomUUID();
  const uuid2 = randomUUID();
  const escapedLeading = escapeRegExp(leading);
  const escapedTrailing = escapeRegExp(trailing);
  const createPlaceholder = (index: number) => {
    return `${leading}${uuid1}${index}${uuid2}${trailing}`;
  };
  const placeholderRegex = new RegExp(
    `${escapedLeading}${uuid1}(\\d+)${uuid2}${escapedTrailing}`,
    "g",
  );
  return {
    createPlaceholder,
    placeholderRegex,
  };
}

export function escapeRegExp(text: string) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

export function makeIdentifiersOptionName<T extends string>(language: T) {
  return `${language}Identifiers` as const;
}

export function makeParserOptionName<T extends string>(language: T) {
  return `${language}Parser` as const;
}

// this weird generic can provide autocomplete prompts of type T[number] to users
// while also accepts any string
export type AutocompleteStringList<T extends readonly string[]> =
  | (T[number][] & string[])
  | string[];

export type StringListToInterfaceKey<T extends readonly string[]> = {
  [key in T[number]]: void;
};

export type Satisfies<U, T extends U> = T;

async function loadAsJson(absolutePath: string) {
  try {
    const content = await readFile(absolutePath, { encoding: "utf-8" });
    return JSON.parse(content);
  } catch {
    /* void */
  }
}

const workerDataUrl = new URL(
  "data:text/javascript," +
    encodeURIComponent(
      `import{workerData as r,parentPort as t}from"node:worker_threads";import{pathToFileURL as a}from"node:url";async function d({absolutePath:o}){try{const e=await import(a(o).href);t?.postMessage(e.embeddedOverrides??e.default??void 0)}catch{t?.postMessage(void 0)}}d(r);`,
    ),
);

async function importModule(absolutePath: string) {
  return new Promise<EmbeddedOverrides | undefined>((resolve) => {
    const worker = new Worker(workerDataUrl, {
      workerData: {
        absolutePath,
      },
    });

    worker.once("message", (result) => {
      resolve(result as EmbeddedOverrides | undefined);
    });

    worker.once("error", (error) => {
      console.error(error);
      resolve(undefined);
    });
  });
}

async function getModuleType(sourceFilePath?: string) {
  const packageJsonFilePath = await packageUp({ cwd: sourceFilePath });
  if (packageJsonFilePath === undefined) {
    return "cjs";
  } else {
    const packageJson = await loadAsJson(packageJsonFilePath);
    switch (packageJson?.type) {
      case "module":
        return "es";
      case "commonjs":
        return "cjs";
      default:
        return "cjs";
    }
  }
}

const resolveEmbeddedOverridesFileAbsolutePath = memoize(
  async (embeddedOverridesFilePath: string, sourceFilePath?: string) => {
    if (isAbsolute(embeddedOverridesFilePath)) {
      return embeddedOverridesFilePath;
    }
    const configFilePath = await resolveConfigFile(sourceFilePath);
    let configDir: string;
    if (typeof configFilePath !== "string") {
      configDir = process.env.PWD ?? process.cwd();
    } else {
      configDir = dirname(configFilePath);
    }
    return resolve(configDir, embeddedOverridesFilePath);
  },
);

const parseEmbeddedOverrides = async (
  embeddedOverridesString: string,
  sourceFilePath?: string,
) => {
  const absolutePathPromise = resolveEmbeddedOverridesFileAbsolutePath(
    embeddedOverridesString,
    sourceFilePath,
  );
  const moduleTypePromise = getModuleType(sourceFilePath);
  const extensionName = extname(embeddedOverridesString);
  // json file
  if (extensionName === ".json") {
    const absolutePath = await absolutePathPromise;
    const parsedEmbeddedOverrides = await loadAsJson(absolutePath);
    if (parsedEmbeddedOverrides !== undefined) {
      return parsedEmbeddedOverrides as EmbeddedOverrides;
    }
    console.error(`Failed to parse the json file: ${absolutePath}`);
    return;
  }
  // js module file
  else if (
    extensionName === ".mjs" ||
    extensionName === ".cjs" ||
    extensionName === ".js"
  ) {
    const absolutePath = await absolutePathPromise;
    const parsedEmbeddedOverrides = await importModule(absolutePath);
    if (parsedEmbeddedOverrides !== undefined) {
      return parsedEmbeddedOverrides as EmbeddedOverrides;
    }
    console.error(`Failed to parse the js module file: ${absolutePath}`);
    return;
  }
  // typed es module file
  else if (
    extensionName === ".mts" ||
    (extensionName === ".ts" && (await moduleTypePromise) === "es")
  ) {
    /* TBD */
  }
  // typed cjs module file
  else if (
    extensionName === ".cts" ||
    (extensionName === ".ts" && (await moduleTypePromise) === "cjs")
  ) {
    /* TBD */
  }
  // no ext, fallback to json
  else if (extensionName === "") {
    const absolutePath = await absolutePathPromise;
    const parsedEmbeddedOverrides = await loadAsJson(absolutePath);
    if (parsedEmbeddedOverrides !== undefined) {
      return parsedEmbeddedOverrides as EmbeddedOverrides;
    }
  }
  // fallback to stringified json
  try {
    return JSON.parse(embeddedOverridesString) as EmbeddedOverrides;
  } catch {
    console.error("Failed to parse embeddedOverrides as a json object");
  }
  return;
};

export const parseEmbeddedOverrideOptions = async (
  embeddedOverrides: string | undefined,
  identifier: string,
  filePath?: string,
) => {
  if (embeddedOverrides === undefined) {
    return;
  }
  const parsedEmbeddedOverrides = await parseEmbeddedOverrides(
    embeddedOverrides,
    filePath,
  );
  if (parsedEmbeddedOverrides === undefined) {
    return;
  }
  try {
    for (const { identifiers, options } of parsedEmbeddedOverrides) {
      if (!identifiers.includes(identifier)) {
        continue;
      }
      return options;
    }
  } catch {
    console.error(`Error parsing embedded override options.`);
  }
  return undefined;
};
