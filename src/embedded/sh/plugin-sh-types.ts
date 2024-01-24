import type { ShParserOptions } from "prettier-plugin-sh";
import type { NormalizeOptions } from "../utils.js";

export interface PluginShOptions extends NormalizeOptions<ShParserOptions> {}
