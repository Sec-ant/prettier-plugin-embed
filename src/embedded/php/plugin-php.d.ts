import "prettier";
import type { PluginPhpOptions } from "./plugin-php-types.js";

declare module "prettier" {
  interface Options extends PluginPhpOptions {}
}
