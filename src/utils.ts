import type { Expression, Node, TemplateLiteral } from "estree";
import memoize from "micro-memoize";
import {
  type AstPath,
  type Options,
  type Printer,
  resolveConfigFile,
} from "prettier";
import { builders } from "prettier/doc.js";
import JSONC from "tiny-jsonc";
import {
  type EmbeddedComment,
  type EmbeddedLanguage,
  type EmbeddedTag,
  embeddedEmbedders,
  makeCommentsOptionName,
  makeIdentifiersOptionName,
  makeTagsOptionName,
} from "./embedded/index.js";
import type { EmbeddedOverride } from "./types.js";

const { label } = builders;

async function importJsonc(absolutePath: string) {
  try {
    const { readFile } = await import("node:fs/promises");
    const content = await readFile(absolutePath, { encoding: "utf-8" });
    return JSONC.parse(content);
  } catch {
    /* void */
  }
}

const importJsModuleWorkerDataUrl = /* @__PURE__ */ new URL(
  `data:text/javascript,${encodeURIComponent(IMPORT_JS_MODULE_WORKER)}`,
);

const importTsModuleWorkerDataUrl = /* @__PURE__ */ new URL(
  `data:text/javascript,${encodeURIComponent(IMPORT_TS_MODULE_WORKER)}`,
);

async function importJsModule(absolutePath: string) {
  const { Worker } = await import("node:worker_threads");

  return new Promise<EmbeddedOverride[] | undefined>((resolve) => {
    const worker = new Worker(importJsModuleWorkerDataUrl, {
      workerData: {
        absolutePath,
      },
    });

    worker.once("message", (result) => {
      resolve(result as EmbeddedOverride[] | undefined);
    });

    worker.once("error", (error) => {
      console.error(error);
      resolve(undefined);
    });
  });
}

async function importTsModule(absolutePath: string) {
  const { Worker } = await import("node:worker_threads");

  return new Promise<EmbeddedOverride[] | undefined>((resolve) => {
    const worker = new Worker(importTsModuleWorkerDataUrl, {
      workerData: {
        absolutePath,
        importMetaUrl: import.meta.url,
      },
    });

    worker.once("message", (result) => {
      resolve(result as EmbeddedOverride[] | undefined);
    });

    worker.once("error", (error) => {
      console.error(error);
      resolve(undefined);
    });
  });
}

const resolveEmbeddedOverridesFileAbsolutePath = memoize(
  async (embeddedOverridesFilePath: string, filepath?: string) => {
    const { isAbsolute, dirname, resolve } = await import("node:path");
    if (isAbsolute(embeddedOverridesFilePath)) {
      return embeddedOverridesFilePath;
    }
    const configFilePath = await resolveConfigFile(filepath);
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
  let extensionName: string;
  try {
    extensionName = (await import("node:path")).extname(
      embeddedOverridesString,
    );
  } catch {
    // node modules not available, fallback to stringified jsonc
    try {
      return JSONC.parse(embeddedOverridesString) as EmbeddedOverride[];
    } catch {
      console.error("Failed to parse embeddedOverrides as a json object");
      return;
    }
  }
  const absolutePathPromise = resolveEmbeddedOverridesFileAbsolutePath(
    embeddedOverridesString,
    sourceFilePath,
  );
  // jsonc file
  if (extensionName === ".json" || extensionName === ".jsonc") {
    const absolutePath = await absolutePathPromise;
    const parsedEmbeddedOverrides = await importJsonc(absolutePath);
    if (parsedEmbeddedOverrides !== undefined) {
      return parsedEmbeddedOverrides as EmbeddedOverride[];
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
      return parsedEmbeddedOverrides as EmbeddedOverride[];
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
      return parsedEmbeddedOverrides as EmbeddedOverride[];
    }
    console.error(`Failed to parse the ts module file: ${absolutePath}`);
    return;
  }
  // no ext, fallback to jsonc
  if (extensionName === "") {
    const absolutePath = await absolutePathPromise;
    const parsedEmbeddedOverrides = await importJsonc(absolutePath);
    if (parsedEmbeddedOverrides !== undefined) {
      return parsedEmbeddedOverrides as EmbeddedOverride[];
    }
  }
  // fallback to stringified jsonc
  try {
    return JSONC.parse(embeddedOverridesString) as EmbeddedOverride[];
  } catch {
    console.error("Failed to parse embeddedOverrides as a json object");
  }

  return;
};

export async function resolveEmbeddedOverrideOptions(
  embeddedOverridesString: string | undefined,
  {
    commentOrTag,
    kind,
    filepath,
  }: {
    commentOrTag: EmbeddedComment | EmbeddedTag;
    kind: "comment" | "tag";
    filepath?: string;
  },
) {
  // no embeddedOverrides string, return
  if (embeddedOverridesString === undefined) {
    return;
  }

  const embeddedOverrides = await resolveEmbeddedOverrides(
    embeddedOverridesString,
    filepath,
  );

  if (embeddedOverrides === undefined) {
    return;
  }

  for (const {
    [`${kind}s` as const]: commentsOrTags,
    identifiers,
    options,
  } of embeddedOverrides) {
    const commentsOrTagsList = commentsOrTags ?? [];
    if (
      (commentsOrTagsList.length === 0 &&
        identifiers?.includes(commentOrTag)) ||
      commentsOrTagsList.includes(commentOrTag)
    ) {
      return options;
    }
  }
}

export const compareTagExpressionToTagString = (() => {
  const ignoreSet = new Set([
    "start",
    "end",
    "loc",
    "range",
    "filename",
    "typeAnnotation",
    "decorators",
  ]);
  return (
    tagExpression: Expression,
    tagString: string,
    parse: (text: string) => Node | Promise<Node>,
  ) => {
    let tagStringTopLevelNode: Node;
    try {
      const node = parse(`${tagString}\`\``);
      if (node instanceof Promise) {
        throw new TypeError("Async parse function hasn't been supported yet.");
      }
      tagStringTopLevelNode = node;
    } catch {
      return false;
    }

    // babel family parsers have a File type parent node
    // so we strip it first
    if (tagStringTopLevelNode.type === "File") {
      tagStringTopLevelNode = tagStringTopLevelNode.program;
    }

    if (
      !(
        tagStringTopLevelNode.type === "Program" &&
        tagStringTopLevelNode.body[0]?.type === "ExpressionStatement"
      )
    ) {
      return false;
    }

    const tagStringNode = tagStringTopLevelNode.body[0]?.expression;
    if (tagStringNode?.type !== "TaggedTemplateExpression") {
      return false;
    }

    if (
      compareObjects(
        tagExpression as unknown as Record<string, unknown>,
        tagStringNode.tag as unknown as Record<string, unknown>,
        ignoreSet,
      )
    ) {
      return true;
    }

    return false;
  };
})();

export function parseCommentFromTemplateLiteralAstPath({
  node,
  parent,
}: AstPath<Node> & { node: TemplateLiteral }) {
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
  const commentValue = lastNodeComment.value;
  if (
    commentValue.length > 1 &&
    commentValue.startsWith(" ") &&
    commentValue.endsWith(" ")
  ) {
    return commentValue.slice(1, -1);
  }
}

export function parseTagFromTemplateLiteralAstPath({
  parent,
}: AstPath<Node> & { node: TemplateLiteral }) {
  if (parent?.type !== "TaggedTemplateExpression") {
    return;
  }
  if (parent.tag.type === "Identifier") {
    return parent.tag.name;
  }
  return parent.tag;
}

export function createCommentsInOptionsGenerator(
  options: Options,
  comment: string,
) {
  // lazy-evaluated
  const isCommentNotExcluded = (() => {
    let result: boolean | undefined = undefined;
    return () => {
      if (result === undefined) {
        result = !(
          options.noEmbeddedIdentificationByComment?.includes(comment) ?? false
        );
      }
      return result;
    };
  })();
  return function* (embeddedLanguage: EmbeddedLanguage) {
    const commentsInOptions =
      options[makeCommentsOptionName(embeddedLanguage)] ?? [];

    // fallback to identifiers if no comments in options
    if (commentsInOptions.length === 0 && isCommentNotExcluded()) {
      yield* options[makeIdentifiersOptionName(embeddedLanguage)] ?? [];
    } else {
      yield* commentsInOptions;
    }
  };
}

export function createTagsInOptionsGenerator(options: Options, tag?: string) {
  if (typeof tag === "string") {
    // lazy-evaluated
    const isTagNotExcluded = (() => {
      let result: boolean | undefined = undefined;
      return () => {
        if (result === undefined) {
          result = !(
            options.noEmbeddedIdentificationByTag?.includes(tag) ?? false
          );
        }
        return result;
      };
    })();
    return function* (embeddedLanguage: EmbeddedLanguage) {
      const tagsInOptions = options[makeTagsOptionName(embeddedLanguage)] ?? [];

      // fallback to identifiers if no tags in options
      if (tagsInOptions.length === 0 && isTagNotExcluded()) {
        yield* options[makeIdentifiersOptionName(embeddedLanguage)] ?? [];
      } else {
        yield* tagsInOptions;
      }
    };
  }
  return function* (embeddedLanguage: EmbeddedLanguage) {
    const tagsInOptions = options[makeTagsOptionName(embeddedLanguage)] ?? [];

    // fallback to identifiers if no tags in options
    if (tagsInOptions.length === 0) {
      const { noEmbeddedIdentificationByTag } = options;
      for (const identifier of options[
        makeIdentifiersOptionName(embeddedLanguage)
      ] ?? []) {
        if (!noEmbeddedIdentificationByTag?.includes(identifier)) {
          yield identifier;
        }
      }
    } else {
      yield* tagsInOptions;
    }
  };
}

export function createEmbeddedDoc(
  embeddedLanguage: EmbeddedLanguage,
  commentOrTag: EmbeddedComment | EmbeddedTag,
  kind: "comment" | "tag",
  options: Options,
): ReturnType<Exclude<Printer["embed"], undefined>> {
  // the noop "language" doesn't have an embedder,
  // this makes it doesn't touch the embedded code
  const embeddedEmbedder = embeddedEmbedders[embeddedLanguage];
  if (!embeddedEmbedder) {
    return null;
  }

  const embeddedOverrideOptionsPromise = resolveEmbeddedOverrideOptions(
    options.embeddedOverrides,
    {
      commentOrTag,
      kind,
      filepath: options.filepath,
    },
  );

  // otherwise we return the embedder function
  return async (...args) => {
    try {
      const doc = await embeddedEmbedder(...args, {
        commentOrTag,
        kind,
        embeddedOverrideOptions: await embeddedOverrideOptionsPromise,
      });
      return label(
        {
          embed: true,
          ...(doc as builders.Label).label,
        },
        doc,
      );
    } catch (e) {
      console.error(e);
      throw e;
    }
  };
}

// this function will be stripped at runtime
export function assumeAs<T>(_: unknown): asserts _ is T {
  /* void */
}

// this is a simplified version of: https://github.com/angus-c/just/blob/master/packages/collection-compare/index.mjs
function compare(
  value1: unknown,
  value2: unknown,
  ignoreSet?: Set<string | number | symbol>,
) {
  if (Object.is(value1, value2)) {
    return true;
  }

  if (value1 === null || value2 === null) {
    return false;
  }

  if (Array.isArray(value1)) {
    assumeAs<unknown[]>(value2);
    return compareArrays(value1, value2, ignoreSet);
  }

  if (typeof value1 === "object") {
    assumeAs<Record<string | number | symbol, unknown>>(value1);
    assumeAs<Record<string | number | symbol, unknown>>(value2);
    return compareObjects(value1, value2, ignoreSet);
  }

  return false;
}

function compareArrays(
  value1: unknown[],
  value2: unknown[],
  ignoreSet?: Set<string | number | symbol>,
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

export function compareObjects<
  T1 extends Record<string | number | symbol, unknown>,
  T2 extends Record<string | number | symbol, unknown>,
>(value1: T1, value2: T2, ignoreSet?: Set<keyof T1 | keyof T2>) {
  for (const key1 of Object.keys(value1)) {
    if (ignoreSet?.has(key1)) {
      // skip keys in ignore set
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
