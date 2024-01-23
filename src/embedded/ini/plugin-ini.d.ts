import "prettier";
import type { PluginIniOptions } from "./plugin-ini-types.js";

declare module "prettier" {
  export interface Options extends PluginIniOptions {}
}
