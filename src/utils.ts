import memoize from "micro-memoize";
import { readFile } from "node:fs/promises";
import { dirname, extname, isAbsolute, resolve } from "node:path";
import { Worker } from "node:worker_threads";
import { resolveConfigFile, type AstPath } from "prettier";
import type { EmbeddedOverrides, PrettierNode } from "./types.js";

async function importJson(absolutePath: string) {
  try {
    const content = await readFile(absolutePath, { encoding: "utf-8" });
    return JSON.parse(content);
  } catch {
    /* void */
  }
}

const importJsModuleWorkerDataUrl = /* @__PURE__ */ new URL(
  "data:text/javascript," + encodeURIComponent(IMPORT_JS_MODULE_WORKER),
);

async function importJsModule(absolutePath: string) {
  return new Promise<EmbeddedOverrides | undefined>((resolve) => {
    const worker = new Worker(importJsModuleWorkerDataUrl, {
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

/**
 * Import typescript module
 *
 * @param absolutePath
 * @returns
 */
async function importTsModule(absolutePath: string) {
  // TODO: Just a placeholder, doesn't work at the moment
  absolutePath;
  console.error(
    "Ts module type embeddedOverrides has not been implemented yet.",
  );
  return undefined;
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

const resolveEmbeddedOverrides = async (
  embeddedOverridesString: string,
  sourceFilePath?: string,
) => {
  const absolutePathPromise = resolveEmbeddedOverridesFileAbsolutePath(
    embeddedOverridesString,
    sourceFilePath,
  );
  const extensionName = extname(embeddedOverridesString);
  // json file
  if (extensionName === ".json") {
    const absolutePath = await absolutePathPromise;
    const parsedEmbeddedOverrides = await importJson(absolutePath);
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
    const parsedEmbeddedOverrides = await importJsModule(absolutePath);
    if (parsedEmbeddedOverrides !== undefined) {
      return parsedEmbeddedOverrides as EmbeddedOverrides;
    }
    console.error(`Failed to parse the js module file: ${absolutePath}`);
    return;
  }
  // typescript module file
  else if (
    extensionName === ".mts" ||
    extensionName === ".cts" ||
    extensionName === ".ts"
  ) {
    const absolutePath = await absolutePathPromise;
    const parsedEmbeddedOverrides = await importTsModule(absolutePath);
    if (parsedEmbeddedOverrides !== undefined) {
      return parsedEmbeddedOverrides as EmbeddedOverrides;
    }
    console.error(`Failed to parse the ts module file: ${absolutePath}`);
    return;
  }
  // no ext, fallback to json
  else if (extensionName === "") {
    const absolutePath = await absolutePathPromise;
    const parsedEmbeddedOverrides = await importJson(absolutePath);
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

export const resolveEmbeddedOverrideOptions = async (
  embeddedOverridesString: string | undefined,
  identifier: string,
  sourceFilePath?: string,
) => {
  if (embeddedOverridesString === undefined) {
    return;
  }
  const parsedEmbeddedOverrides = await resolveEmbeddedOverrides(
    embeddedOverridesString,
    sourceFilePath,
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

// TODO: support tags like 'this.html', 'this["html"]'..., if possible
// ideally, the best api to use is https://github.com/estools/esquery

// function to get identifier from template literal comments
export function getIdentifierFromComment(
  { node, parent }: AstPath<PrettierNode>,
  comments: string[],
  noIdentificationList: string[],
): string | undefined {
  if (comments.length === 0) {
    return;
  }
  if (node.type !== "TemplateLiteral") {
    return;
  }
  const nodeComments = node.comments ?? parent?.comments;
  if (!nodeComments) {
    return;
  }
  const lastNodeComment = nodeComments[nodeComments.length - 1];
  if (
    ![
      "MultiLine", // meriyah
      "Block", // typescript, acorn, espree, flow
      "CommentBlock", // babel, babel-flow, babel-ts
    ].includes(lastNodeComment.type) ||
    !lastNodeComment.leading
  ) {
    return;
  }
  for (const comment of comments) {
    if (
      ` ${comment} ` === lastNodeComment.value &&
      !noIdentificationList.includes(comment)
    ) {
      return comment;
    }
  }
  return;
}

// function to get identifier from template literal tags
export function getIdentifierFromTag(
  { node, parent }: AstPath<PrettierNode>,
  tags: string[],
  noIdentificationList: string[],
): string | undefined {
  if (tags.length === 0) {
    return;
  }
  if (
    node.type !== "TemplateLiteral" ||
    parent?.type !== "TaggedTemplateExpression" ||
    parent.tag.type !== "Identifier"
  ) {
    return;
  }
  for (const tag of tags) {
    if (parent.tag.name === tag && !noIdentificationList.includes(tag)) {
      return tag;
    }
  }
  return;
}
