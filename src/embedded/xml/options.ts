import type { CoreCategoryType, SupportOptions } from "prettier";
import { name } from "./name.js";

export const options = {
  [name]: {
    category: "Global" satisfies CoreCategoryType,
    type: "string",
    array: true,
    default: [{ value: ["xml", "svg"] }],
    description:
      "Specify embedded XML languages. This requires @prettier/plugin-xml",
  },
  __embeddedXmlFragmentRecoverIndex: {
    category: "Global" satisfies CoreCategoryType,
    type: "int",
    array: true,
    default: [{ value: [] }],
    description:
      "This option is read only and used as a workaround to support xml fragments",
  },
} satisfies SupportOptions;

type Options = typeof options;

export interface PrettierPluginDepsOptions {
  xmlSelfClosingSpace?: boolean;
  xmlWhitespaceSensitivity?: "strict" | "preserve" | "ignore";
  xmlSortAttributesByKey?: boolean;
  xmlQuoteAttributes?: "preserve" | "single" | "double";
}

declare module "../types.js" {
  interface EmbeddedOptions extends Options {}
  interface PrettierPluginEmbedOptions {
    [name]?: string[];
    __embeddedXmlFragmentRecoverIndex?: [number];
  }
}

declare module "prettier" {
  export interface Options extends PrettierPluginDepsOptions {}
}
