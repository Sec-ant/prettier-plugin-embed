import type { CoreCategoryType, SupportOptions } from "prettier";
import { name } from "./name.js";

export const options = {
  [name]: {
    category: "Global",
    type: "string",
    array: true,
    default: [{ value: ["xml", "svg"] }],
    description:
      "Specify embedded XML languages. This requires @prettier/plugin-xml",
  },
  /** @internal */
  __embeddedXmlFragmentRecoverIndex: {
    category: "Global",
    type: "int",
    array: true,
    default: [{ value: [] }],
    description:
      "This option is read only and used as a workaround to support xml element fragments",
  },
} satisfies SupportOptions & Record<string, { category: CoreCategoryType }>;

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
    /** @internal */
    __embeddedXmlFragmentRecoverIndex?: [number] | [number, number];
  }
}

declare module "prettier" {
  export interface Options extends PrettierPluginDepsOptions {}
}
