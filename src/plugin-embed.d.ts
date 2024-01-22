import type { PrettierPluginEmbedOptions } from "./embedded/index.js";

declare module "prettier" {
  interface Options extends PrettierPluginEmbedOptions {}
}
