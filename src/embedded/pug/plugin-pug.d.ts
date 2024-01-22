import "prettier";

declare module "prettier" {
  type PluginPugOptions = import("./plugin-pug-types.js").Options;
  interface Options extends PluginPugOptions {}
}
