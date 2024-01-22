import type { Options, Parser, SupportOption } from "prettier";
import type { Embedder } from "../types.js";
import type { Satisfies } from "./utils.js";

type EmbeddedLanguageNamingConvention = `embedded${Capitalize<string>}`;

export interface EmbeddedParsers
  extends Record<EmbeddedLanguageNamingConvention, Parser | undefined> {}

export interface EmbeddedEmbedders
  extends Record<
    EmbeddedLanguageNamingConvention,
    Embedder<Options> | undefined
  > {}

export interface EmbeddedOptions
  extends Record<EmbeddedLanguageNamingConvention, SupportOption | undefined> {}

export interface EmbeddedLanguagesHolder {}
export type EmbeddedLanguage = Satisfies<
  EmbeddedLanguageNamingConvention,
  keyof EmbeddedLanguagesHolder
>;

export interface EmbeddedDefaultIdentifiersHolder {}
export type EmbeddedDefaultIdentifier = keyof EmbeddedDefaultIdentifiersHolder;

export interface PrettierPluginEmbedOptions {}
