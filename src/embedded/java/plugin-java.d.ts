import "prettier";
import type { PluginJavaOptions } from "./plugin-java-types.js";

declare module "prettier" {
  interface Options extends PluginJavaOptions {}
}
