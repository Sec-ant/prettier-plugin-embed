import "prettier";
import type { PluginPropertiesOptions } from "./plugin-properties-types.js";

declare module "prettier" {
  interface Options extends PluginPropertiesOptions {}
}
