import dedent from "dedent";
import type { Doc, Options } from "prettier";
import type { Embedder } from "../types.js";
import {
  preparePlaceholder,
  prepareTemplate,
  printTemplateExpressions,
  simpleRehydrateDoc,
  wrapEmbeddedDoc,
} from "./utils.js";

interface EmbedderConfiguration {
  parser: string;
  parserOption?: string;
  parserOptions?: Partial<Options>;
  markup?: boolean;
  newlineHandling?: false | "hardline" | "literalline";
  dedentContent?: boolean;
  placeholderPrefix?: string;
  transformDoc?: (doc: Doc) => Doc;
}

export function createEmbedder({
  parser,
  parserOption,
  parserOptions,
  markup = false,
  newlineHandling = false,
  dedentContent = false,
  placeholderPrefix = "p",
  transformDoc,
}: EmbedderConfiguration): Embedder {
  return async (
    textToDoc,
    print,
    path,
    options,
    { commentOrTag, embeddedOverrideOptions },
  ) => {
    const resolvedOptions: Options = { ...options, ...embeddedOverrideOptions };
    const { createPlaceholder, placeholderRegex } =
      preparePlaceholder(placeholderPrefix);
    const { trimmedText, leadingWhitespaces, trailingWhitespaces } =
      prepareTemplate(path.node, createPlaceholder);
    const expressionDocs = printTemplateExpressions(
      path,
      print,
      resolvedOptions,
      false,
    );
    const configuredParser = parserOption
      ? (resolvedOptions[parserOption] as string | undefined)
      : undefined;
    const doc = await textToDoc(
      dedentContent ? dedent(trimmedText) : trimmedText,
      {
        ...resolvedOptions,
        ...parserOptions,
        parser: configuredParser ?? parser,
      },
    );

    const contentDoc = simpleRehydrateDoc(
      transformDoc ? transformDoc(doc) : doc,
      placeholderRegex,
      expressionDocs,
      newlineHandling,
      undefined,
      resolvedOptions.tabWidth,
      Boolean(resolvedOptions.__embeddedInHtml),
    );
    return wrapEmbeddedDoc(
      contentDoc,
      resolvedOptions,
      commentOrTag,
      leadingWhitespaces,
      trailingWhitespaces,
      markup &&
        (resolvedOptions.htmlWhitespaceSensitivity === "strict" ||
          resolvedOptions.htmlWhitespaceSensitivity === "css"),
    );
  };
}
