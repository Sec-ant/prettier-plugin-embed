import "prettier";
import type { PluginTomlOptions } from "./plugin-toml-types.js";

declare module "prettier" {
  interface Options extends PluginTomlOptions {}
}
