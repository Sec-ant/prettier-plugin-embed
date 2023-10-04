import { name } from "./name.js";

export interface PrettierPluginXmlOptions {
  xmlSelfClosingSpace?: boolean;
  xmlWhitespaceSensitivity?: "strict" | "preserve" | "ignore";
  xmlSortAttributesByKey?: boolean;
  xmlQuoteAttributes?: "preserve" | "single" | "double";
}

export interface PrettierPluginEmbedXmlOptions {
  [name]?: string[];
}

declare module "prettier" {
  export interface Options
    extends PrettierPluginXmlOptions,
      PrettierPluginEmbedXmlOptions {}
}
