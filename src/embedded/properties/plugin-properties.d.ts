import "prettier";

declare module "prettier" {
  type PluginPropertiesOptions = import("./plugin-properties-types.js").Options;
  interface Options extends PluginPropertiesOptions {}
}
