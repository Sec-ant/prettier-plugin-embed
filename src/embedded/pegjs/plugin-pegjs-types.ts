import type { EsParser } from "../es/index.js";
import type { TsParser } from "../ts/index.js";

export interface Options {
  actionParser?: EsParser | TsParser;
}
