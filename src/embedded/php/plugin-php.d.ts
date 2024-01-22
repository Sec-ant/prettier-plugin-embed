import "prettier";

declare module "prettier" {
  type PluginPhpOptions = import("./plugin-php-types.js").Options;
  interface Options extends PluginPhpOptions {}
}
