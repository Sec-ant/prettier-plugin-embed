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

async function loadAsEsModule(absolutePath: string) {
  try {
    const imported = await import(absolutePath);
    return imported.embeddedOverrides ?? imported.default ?? undefined;
  } catch {
    /* void */
  }
}

function loadAsCjsModule(absolutePath: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const imported = require(absolutePath);
    return imported.embeddedOverrides ?? imported ?? undefined;
  } catch {
    /* void */
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

const parseEmbeddedOverrides = memoize(
  async (embeddedOverridesString: string, sourceFilePath?: string) => {
    const absolutePathPromise = resolveEmbeddedOverridesFileAbsolutePath(
      embeddedOverridesString,
      sourceFilePath,
    );
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
    // esm file
    else if (extensionName === ".mjs") {
      const absolutePath = await absolutePathPromise;
      const parsedEmbeddedOverrides = await loadAsEsModule(absolutePath);
      if (parsedEmbeddedOverrides !== undefined) {
        return parsedEmbeddedOverrides as EmbeddedOverrides;
      }
      console.error(`Failed to parse the es module file: ${absolutePath}`);
      return;
    }
    // cjs file
    else if (extensionName === ".cjs") {
      const absolutePath = await absolutePathPromise;
      const parsedEmbeddedOverrides = loadAsCjsModule(absolutePath);
      if (parsedEmbeddedOverrides !== undefined) {
        return parsedEmbeddedOverrides as EmbeddedOverrides;
      }
      console.error(`Failed to the cjs module file: ${absolutePath}`);
      return;
    }
    // js file
    else if (extensionName === ".js") {
      const absolutePath = await absolutePathPromise;
      let loadAs: "mjs" | "cjs";
      const packageJsonFilePath = await packageUp({ cwd: sourceFilePath });
      if (packageJsonFilePath === undefined) {
        loadAs = "cjs";
      } else {
        const packageJson = await loadAsJson(packageJsonFilePath);
        switch (packageJson?.type) {
          case "module":
            loadAs = "mjs";
            break;
          case "commonjs":
            loadAs = "cjs";
            break;
          default:
            loadAs = "cjs";
            break;
        }
      }
      if (loadAs === "mjs") {
        const parsedEmbeddedOverrides = await loadAsEsModule(absolutePath);
        if (parsedEmbeddedOverrides !== undefined) {
          return parsedEmbeddedOverrides as EmbeddedOverrides;
        }
        console.error(`Failed to parse the es module file: ${absolutePath}`);
        return;
      } else if (loadAs === "cjs") {
        const parsedEmbeddedOverrides = loadAsCjsModule(absolutePath);
        if (parsedEmbeddedOverrides !== undefined) {
          return parsedEmbeddedOverrides as EmbeddedOverrides;
        }
        console.error(`Failed to parse the cjs module file: ${absolutePath}`);
        return;
      }
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
  },
);

export const parseEmbeddedOverrideOptions = memoize(
  async (
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
  },
);
