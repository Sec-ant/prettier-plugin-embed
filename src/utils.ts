import { readFile } from "node:fs/promises";
import { dirname, extname, isAbsolute, resolve } from "node:path";
import { Worker } from "node:worker_threads";
import type { Node } from "estree";
import memoize from "micro-memoize";
import {
  type AstPath,
  type Options,
  type Parser,
  type ParserOptions,
  resolveConfigFile,
} from "prettier";
import { parsers } from "./parsers.js";
import type { EmbeddedOverrides } from "./types.js";

async function importJson(absolutePath: string) {
  try {
    const content = await readFile(absolutePath, { encoding: "utf-8" });
    return JSON.parse(content);
  } catch {
    /* void */
  }
}

const importJsModuleWorkerDataUrl = /* @__PURE__ */ new URL(
  `data:text/javascript,${encodeURIComponent(IMPORT_JS_MODULE_WORKER)}`,
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
  if (
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
  if (
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
  if (extensionName === "") {
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
    console.error("Error parsing embedded override options.");
  }
  return undefined;
};

// TODO: use esquery for further customization?

// function to get identifier from template literal comments
export function getIdentifierFromComment(
  { node, parent }: AstPath<Node>,
  comments: string[],
  options: Options,
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
  const lastNodeComment = nodeComments[nodeComments.length - 1]!;
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
  const noIdentificationList = options.noEmbeddedIdentificationByComment ?? [];
  for (const comment of comments) {
    if (noIdentificationList.includes(comment)) {
      continue;
    }
    if (` ${comment} ` === lastNodeComment.value) {
      return comment;
    }
  }
  return;
}

// function to get identifier from template literal tags
export function getIdentifierFromTag(
  { node, parent }: AstPath<Node>,
  tags: string[],
  options: Options,
): string | undefined {
  if (
    tags.length === 0 ||
    node.type !== "TemplateLiteral" ||
    parent?.type !== "TaggedTemplateExpression"
  ) {
    return;
  }
  assumeAs<keyof typeof parsers>(options.parser);
  const isKnownParser = options.parser in parsers;
  const noIdentificationList = options.noEmbeddedIdentificationByTag ?? [];
  const ignoreSet = new Set([
    "start",
    "end",
    "loc",
    "range",
    "filename",
    "typeAnnotation",
    "decorators",
  ]);
  for (const tag of tags) {
    if (noIdentificationList.includes(tag)) {
      continue;
    }
    // simple "identifiers"
    if (isLegitJsIdentifier(tag)) {
      if (parent.tag.type === "Identifier" && parent.tag.name === tag) {
        return tag;
      }
    }
    // complex "identifiers"
    else {
      if (!isKnownParser) {
        return;
      }
      let referenceTopLevelNode: Node;
      try {
        const nodeOrPromise = (parsers[options.parser] as Parser<Node>).parse(
          `${tag}\`\``,
          options as ParserOptions<Node>,
        ) as Node | Promise<Node>;
        if (nodeOrPromise instanceof Promise) {
          throw new TypeError(
            "Async parse function hasn't been supported yet.",
          );
        }
        referenceTopLevelNode = nodeOrPromise;
      } catch {
        continue;
      }
      // babel family parsers have a File type parent node
      if (referenceTopLevelNode.type === "File") {
        referenceTopLevelNode = referenceTopLevelNode.program;
      }
      if (
        !(
          referenceTopLevelNode.type === "Program" &&
          referenceTopLevelNode.body[0]?.type === "ExpressionStatement"
        )
      ) {
        continue;
      }
      const referenceNode = referenceTopLevelNode.body[0]?.expression;
      if (referenceNode?.type !== "TaggedTemplateExpression") {
        continue;
      }
      assumeAs<Record<string, unknown>>(parent.tag);
      assumeAs<Record<string, unknown>>(referenceNode.tag);
      if (compareObjects(parent.tag, referenceNode.tag, ignoreSet)) {
        return tag;
      }
    }
  }
  return;
}

// this function will be stripped at runtime
function assumeAs<T>(_: unknown): asserts _ is T {
  /* void */
}

function isLegitJsIdentifier(identifier: string) {
  return /^[_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*$/.test(identifier);
}

// TODO: compare function type hazards, put them into a js file and use JSDoc?
// this is a simplified version of: https://github.com/angus-c/just/blob/master/packages/collection-compare/index.mjs
function compare(
  value1: unknown,
  value2: unknown,
  ignoreSet = new Set<string | number | symbol>(),
) {
  if (Object.is(value1, value2)) {
    return true;
  }

  if (Array.isArray(value1)) {
    return compareArrays(value1, value2 as unknown[], ignoreSet);
  }

  if (typeof value1 === "object") {
    return compareObjects(
      value1 as Record<string | number | symbol, unknown>,
      value2 as Record<string | number | symbol, unknown>,
      ignoreSet,
    );
  }

  return false;
}

function compareArrays(
  value1: unknown[],
  value2: unknown[],
  ignoreSet = new Set<string | number | symbol>(),
) {
  const len = value1.length;

  if (len !== value2.length) {
    return false;
  }

  for (let i = 0; i < len; i++) {
    if (!compare(value1[i], value2[i], ignoreSet)) {
      return false;
    }
  }

  return true;
}

function compareObjects<
  T1 extends Record<string, unknown>,
  T2 extends Record<string, unknown>,
>(value1: T1, value2: T2, ignoreSet = new Set<keyof T1 | keyof T2>()) {
  for (const key1 of Object.keys(value1)) {
    if (ignoreSet.has(key1)) {
      continue;
    }
    if (
      !(
        Object.prototype.hasOwnProperty.call(value2, key1) &&
        compare(value1[key1], value2[key1], ignoreSet)
      )
    ) {
      return false;
    }
  }

  return true;
}
