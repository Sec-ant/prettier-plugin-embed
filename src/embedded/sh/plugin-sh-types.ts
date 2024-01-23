import type { ShParserOptions } from "prettier-plugin-sh";
import type { OmitIndexSignature } from "type-fest";

export interface PluginShOptions
  extends Partial<OmitIndexSignature<ShParserOptions>> {}
