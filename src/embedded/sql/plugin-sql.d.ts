import "prettier";
import type { PluginSqlOptions } from "./plugin-sql-types.js";

declare module "prettier" {
  interface Options extends PluginSqlOptions {}
}
