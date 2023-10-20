export * from "./register.js";
export type {
  EmbeddedLanguage,
  EmbeddedParsers,
  EmbeddedEmbedders,
  EmbeddedOptions,
  EmbeddedDefaultIdentifier,
  PrettierPluginEmbedOptions,
} from "./types.js";
export {
  makeIdentifiersOptionName as makeIdentifiersName,
  type AutocompleteStringList,
} from "./utils.js";
