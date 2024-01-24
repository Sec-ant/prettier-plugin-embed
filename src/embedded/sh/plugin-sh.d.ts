import "prettier";
import type { PluginShOptions } from "./plugin-sh-types.js";

declare module "prettier" {
  interface Options extends PluginShOptions {}
}
