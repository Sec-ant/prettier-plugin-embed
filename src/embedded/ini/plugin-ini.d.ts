import "prettier";

declare module "prettier" {
  type PluginIniOptions = import("./plugin-ini-types.js").Options;
  interface Options extends PluginIniOptions {}
}
