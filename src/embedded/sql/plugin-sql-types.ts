import type { SqlBaseOptions } from "prettier-plugin-sql";
import type { OmitIndexSignature } from "type-fest";

type NormalizedSqlBaseOptions = {
  [k in keyof SqlBaseOptions]: SqlBaseOptions[k];
};

export interface PluginSqlOptions
  extends Partial<OmitIndexSignature<NormalizedSqlBaseOptions>> {}
