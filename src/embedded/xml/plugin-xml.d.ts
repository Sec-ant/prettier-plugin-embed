import "prettier";

declare module "prettier" {
  type PluginXmlOptions = import("./plugin-xml-types.js").Options;
  interface Options extends PluginXmlOptions {}
}
