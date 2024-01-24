import "prettier";
import type { PluginMarkdownOptions } from "./plugin-markdown-types.js";

declare module "prettier" {
  interface Options extends PluginMarkdownOptions {}
}
