import "prettier";

declare module "prettier" {
  type PluginNginxOptions = import("./plugin-nginx-types.js").NginxOptions;
  interface Options extends PluginNginxOptions {}
}
