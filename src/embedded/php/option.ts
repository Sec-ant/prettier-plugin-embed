import type { CoreCategoryType, SupportOption } from "prettier";
import { name } from "./name.js";

export const option: SupportOption = {
  category: "Global" satisfies CoreCategoryType,
  type: "string",
  array: true,
  default: [{ value: ["php"] }],
  description:
    "Specify embedded PHP languages. This requires @prettier/plugin-php",
};

declare module "../types.js" {
  interface EmbeddedOptions {
    [name]: typeof option;
  }
}

export interface PrettierPluginDepsOptions {
  phpVersion?:
    | "5.0"
    | "5.1"
    | "5.2"
    | "5.3"
    | "5.4"
    | "5.5"
    | "5.6"
    | "7.0"
    | "7.1"
    | "7.2"
    | "7.3"
    | "7.4"
    | "8.0"
    | "8.1"
    | "8.2";
  trailingCommaPHP?: boolean;
  braceStyle?: "psr-2" | "per-cs" | "1tbs";
}

export interface PrettierPluginEmbedOptions {
  [name]?: string[];
}

declare module "prettier" {
  export interface Options
    extends PrettierPluginDepsOptions,
      PrettierPluginEmbedOptions {}
}
