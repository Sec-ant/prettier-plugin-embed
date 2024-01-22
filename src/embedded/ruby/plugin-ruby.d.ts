import "prettier";

declare module "prettier" {
  type PluginRubyOptions = import("./plugin-ruby-types.js").Options;
  interface Options extends PluginRubyOptions {}
}
