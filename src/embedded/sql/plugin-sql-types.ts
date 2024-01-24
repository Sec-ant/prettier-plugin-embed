import type { SqlBaseOptions } from "prettier-plugin-sql";
import type { NormalizeOptions } from "../utils.js";

export interface PluginSqlOptions extends NormalizeOptions<SqlBaseOptions> {}
