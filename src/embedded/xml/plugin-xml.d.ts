import "prettier";
import type { PluginXmlOptions } from "./plugin-xml-types.js";

declare module "prettier" {
  interface Options extends PluginXmlOptions {}
}
