import type { Options, Doc, AstPath } from "prettier";
import type { Node as EsTreeNode, TemplateLiteral, Comment } from "estree";
import {
  type EmbeddedDefaultIdentifier,
  type AutocompleteStringList,
  type PrettierPluginEmbedOptions,
  makeIdentifiersOptionName,
  EmbeddedLanguage,
} from "./embedded/index.js";
import type { PrettierPluginGlobalOptions } from "./options.js";

export type PrettierNode = EsTreeNode & {
  comments?: (Comment & {
    leading: boolean;
    trailing: boolean;
    nodeDescription: string;
  })[];
};

export type InternalPrintFun = (
  selector?: string | number | (string | number)[] | AstPath<TemplateLiteral>,
) => Doc;

export type Embedder<T extends Options = Options> = (
  textToDoc: (text: string, options: T) => Promise<Doc>,
  print: InternalPrintFun,
  path: AstPath<TemplateLiteral>,
  options: T,
  identifier: string,
  identifiers: string[],
) => Promise<Doc>;

export interface EmbeddedOverride {
  identifiers: AutocompleteStringList<EmbeddedDefaultIdentifier[]>;
  options: Omit<
    // native prettier options
    Omit<Options, keyof PrettierPluginEmbedOptions> &
      // prettier-plugin-embed options
      // except for "embedded<Language>Identifiers"
      // and global options
      // (they should be set globally, not in overrides)
      Omit<
        PrettierPluginEmbedOptions,
        | keyof PrettierPluginGlobalOptions
        | ReturnType<typeof makeIdentifiersOptionName<EmbeddedLanguage>>
      >,
    // these options are used in `printDocToString`,
    // we cannot override them because plugins can only affect ast and doc generation at most
    // check: https://github.com/prettier/prettier/blob/7aecca5d6473d73f562ca3af874831315f8f2581/src/document/printer.js
    | "printWidth"
    | "endOfLine"
    | "useTabs"
    | "tabWidth"
    // some other options we don't want to expose to the users or don't make sense to override
    | "parser"
    | "filepath"
    | "embeddedLanguageFormatting"
    | `__${string}`
  >;
}

export type EmbeddedOverrides = EmbeddedOverride[];
