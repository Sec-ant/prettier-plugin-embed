import "prettier";
import type { PluginPugOptions } from "./plugin-pug-types.js";

declare module "prettier" {
  interface Options extends PluginPugOptions {}
}
