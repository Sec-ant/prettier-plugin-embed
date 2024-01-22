import "prettier";

declare module "prettier" {
  type PluginSqlOptions = import("./plugin-sql-types.js").Options;
  interface Options extends PluginSqlOptions {}
}
