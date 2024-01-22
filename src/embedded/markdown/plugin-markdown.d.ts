import "prettier";

declare module "prettier" {
  type PluginMarkdownOptions = import("./plugin-markdown-types.js").Options;
  interface Options extends PluginMarkdownOptions {}
}
