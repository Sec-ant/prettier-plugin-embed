import "prettier";
import type { PluginNginxOptions } from "./plugin-nginx-types.js";

declare module "prettier" {
  interface Options extends PluginNginxOptions {}
}
