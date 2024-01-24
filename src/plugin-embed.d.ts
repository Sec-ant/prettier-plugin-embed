import "prettier";
import type { PluginEmbedOptions } from "./embedded/index.js";

declare module "prettier" {
  interface Options extends PluginEmbedOptions {}
}
