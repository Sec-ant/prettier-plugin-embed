import type { CoreCategoryType, SupportOption } from "prettier";
import { name } from "./name.js";

export const option: SupportOption = {
  category: "Global" satisfies CoreCategoryType,
  type: "string",
  array: true,
  default: [{ value: ["xml", "svg"] }],
  description:
    "Specify embedded XML languages. This requires @prettier/plugin-xml",
};

export interface PrettierPluginDepsOptions {
  xmlSelfClosingSpace?: boolean;
  xmlWhitespaceSensitivity?: "strict" | "preserve" | "ignore";
  xmlSortAttributesByKey?: boolean;
  xmlQuoteAttributes?: "preserve" | "single" | "double";
}

declare module "../types.js" {
  interface EmbeddedOptions {
    [name]: typeof option;
  }
  interface PrettierPluginEmbedOptions {
    [name]?: string[];
  }
}

declare module "prettier" {
  export interface Options extends PrettierPluginDepsOptions {}
}
