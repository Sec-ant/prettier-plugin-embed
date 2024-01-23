export { options } from "./options.js";
export { parsers } from "./parsers.js";
export { printers } from "./printers.js";
export type { PluginEmbedOptions } from "./embedded/index.js";
export type { EmbeddedOverride } from "./types.js";

export type {
  /**
   * @deprecated Renamed to `PluginEmbedOptions`
   */
  PluginEmbedOptions as PrettierPluginEmbedOptions,
} from "./embedded/index.js";
