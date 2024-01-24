import type { SqlPluginOptions } from "prettier-plugin-sql-cst";
import type { NormalizeOptions } from "../utils.js";

export interface PluginSqlCstOptions
  extends NormalizeOptions<SqlPluginOptions> {}
