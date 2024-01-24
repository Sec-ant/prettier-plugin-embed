import "prettier";
import type { PluginSqlCstOptions } from "./plugin-sql-cst-types.js";

declare module "prettier" {
  interface Options extends PluginSqlCstOptions {}
}
