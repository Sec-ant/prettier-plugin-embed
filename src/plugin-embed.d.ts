import "prettier";

declare module "prettier" {
  type PluginEmbedOptions = import("./embedded/index.js").PluginEmbedOptions;
  interface Options extends PluginEmbedOptions {}
}
