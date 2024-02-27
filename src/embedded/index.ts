export * from "./register.js";
export type {
  EmbeddedDefaultComment,
  EmbeddedDefaultTag,
  EmbeddedEmbedders,
  EmbeddedLanguage,
  EmbeddedOptions,
  EmbeddedParsers,
  EmbeddedComment,
  EmbeddedTag,
  PluginEmbedOptions,
} from "./types.js";
export {
  makeIdentifiersOptionName,
  makeCommentsOptionName,
  makeTagsOptionName,
  fallbackIndicator,
  type AutocompleteStringList,
} from "./utils.js";
