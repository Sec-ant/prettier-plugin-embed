import type { SqlPluginOptions } from "prettier-plugin-sql-cst";
import type { OmitIndexSignature } from "type-fest";

export interface PluginSqlCstOptions
  extends Partial<OmitIndexSignature<SqlPluginOptions>> {}
