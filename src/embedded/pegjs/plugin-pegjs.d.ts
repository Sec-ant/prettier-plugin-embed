import "prettier";

declare module "prettier" {
  type PluginPegjsOptions = import("./plugin-pegjs-types.js").Options;
  interface Options extends PluginPegjsOptions {}
}
