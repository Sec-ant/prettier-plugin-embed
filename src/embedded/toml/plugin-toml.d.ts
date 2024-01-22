import "prettier";

declare module "prettier" {
  type PluginTomlOptions = import("./plugin-toml-types.js").Options;
  interface Options extends PluginTomlOptions {}
}
