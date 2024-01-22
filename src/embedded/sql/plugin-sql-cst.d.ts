import "prettier";

declare module "prettier" {
  type PluginSqlCstOptions = import("./plugin-sql-cst-types.js").Options;
  interface Options extends PluginSqlCstOptions {}
}
