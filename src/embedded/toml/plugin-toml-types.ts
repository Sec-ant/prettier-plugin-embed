import type { PrettierTaploOptions } from "prettier-plugin-toml";
import type { OmitIndexSignature } from "type-fest";

export interface PluginTomlOptions
  extends Partial<OmitIndexSignature<PrettierTaploOptions>> {}
