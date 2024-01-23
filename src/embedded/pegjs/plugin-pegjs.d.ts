import "prettier";
import type { PluginPegjsOptions } from "./plugin-pegjs-types.js";

declare module "prettier" {
  interface Options extends PluginPegjsOptions {}
}
