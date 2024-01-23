import "prettier";
import type { PluginRubyOptions } from "./plugin-ruby-types.js";

declare module "prettier" {
  interface Options extends PluginRubyOptions {}
}
