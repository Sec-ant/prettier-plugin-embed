import "prettier";

declare module "prettier" {
  type PluginJavaOptions = import("./plugin-java-types.js").Options;
  interface Options extends PluginJavaOptions {}
}
