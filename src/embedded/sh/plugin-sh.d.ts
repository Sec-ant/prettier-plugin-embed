import "prettier";

declare module "prettier" {
  type PluginShOptions = import("./plugin-sh-types.js").Options;
  interface Options extends PluginShOptions {}
}
