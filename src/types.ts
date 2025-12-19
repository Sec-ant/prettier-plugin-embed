import type { TemplateLiteral } from "estree";
import type { AstPath, Doc, Options } from "prettier";
import type { printer } from "prettier/doc";
import type {} from "sh-syntax";
import type {} from "sql-formatter";
import type {} from "sql-parser-cst";
import type { OmitIndexSignature } from "type-fest";
import type {
  AutocompleteStringList,
  EmbeddedDefaultComment,
  EmbeddedDefaultTag,
  EmbeddedLanguage,
  makeCommentsOptionName,
  makeIdentifiersOptionName,
  makeTagsOptionName,
  PluginEmbedOptions,
} from "./embedded/index.js";
import type { PluginEmbedLanguageAgnosticOptions } from "./options.js";

export type InternalPrintFun = (
  selector?: string | number | (string | number)[] | AstPath<TemplateLiteral>,
) => Doc;

export interface EmbedderPayload {
  commentOrTag: string;
  kind: "comment" | "tag";
  embeddedOverrideOptions: EmbeddedOverride["options"] | undefined;
}

export type Embedder<T extends Options = Options> = (
  textToDoc: (text: string, options: T) => Promise<Doc>,
  print: InternalPrintFun,
  path: AstPath<TemplateLiteral>,
  options: T,
  embedderPayload: EmbedderPayload,
) => Promise<Doc>;

type EmbeddedCommentsOrTags = AutocompleteStringList<
  EmbeddedDefaultComment | EmbeddedDefaultTag
>;

type EmbeddedComments = AutocompleteStringList<EmbeddedDefaultComment>;

type EmbeddedTags = AutocompleteStringList<EmbeddedDefaultTag>;

type EmbeddedOverrideOptions = Omit<
  // native prettier options
  Omit<OmitIndexSignature<Options>, keyof PluginEmbedOptions> &
    // prettier-plugin-embed options
    // except for "embedded<Language>Comments", "embedded<Language>Tags"
    // and language-agnostic options
    // (they should be set globally, not in overrides)
    Omit<
      PluginEmbedOptions,
      | keyof PluginEmbedLanguageAgnosticOptions
      | ReturnType<typeof makeIdentifiersOptionName<EmbeddedLanguage>>
      | ReturnType<typeof makeCommentsOptionName<EmbeddedLanguage>>
      | ReturnType<typeof makeTagsOptionName<EmbeddedLanguage>>
    >,
  // these options are used in `printDocToString`,
  // we cannot override them because plugins can only affect ast and doc generation at most
  // check: https://github.com/prettier/prettier/blob/7aecca5d6473d73f562ca3af874831315f8f2581/src/document/printer.js
  | keyof printer.Options
  | "endOfLine"
  // some other options we don't want to expose to the users or don't make sense to override
  | "parser"
  | "filepath"
  | "embeddedLanguageFormatting"
  | `__${string}`
>;

interface EmbeddedOverrideWithIdentifiers {
  /**
   * @deprecated Please use `comments` or `tags`.
   */
  identifiers: EmbeddedCommentsOrTags;
  comments?: EmbeddedComments;
  tags?: EmbeddedTags;
  options: EmbeddedOverrideOptions;
}

interface EmbeddedOverrideWithComments {
  /**
   * @deprecated Please use `comments` or `tags`.
   */
  identifiers?: EmbeddedCommentsOrTags;
  comments: EmbeddedComments;
  tags?: EmbeddedTags;
  options: EmbeddedOverrideOptions;
}

interface EmbeddedOverrideWithTags {
  /**
   * @deprecated Please use `comments` or `tags`.
   */
  identifiers?: EmbeddedCommentsOrTags;
  comments?: EmbeddedComments;
  tags: EmbeddedTags;
  options: EmbeddedOverrideOptions;
}

export type EmbeddedOverride =
  | EmbeddedOverrideWithComments
  | EmbeddedOverrideWithTags
  | EmbeddedOverrideWithIdentifiers;
