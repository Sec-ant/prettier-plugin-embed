import memoize from "micro-memoize";
import { readFile } from "node:fs/promises";
import { dirname, extname, isAbsolute, resolve } from "node:path";
import { Worker } from "node:worker_threads";
import { packageUp } from "package-up";
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
    const packageJson = await importJson(packageJsonFilePath);
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

const resolveEmbeddedOverrides = async (
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
