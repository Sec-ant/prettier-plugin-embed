import type { PrettierTaploOptions } from "prettier-plugin-toml";
import type { NormalizeOptions } from "../utils.js";

export interface PluginTomlOptions
  extends NormalizeOptions<PrettierTaploOptions> {}
