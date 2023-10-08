import type { CoreCategoryType, SupportOptions } from "prettier";
import { name } from "./name.js";

export const options = {
  [name]: {
    category: "Global" satisfies CoreCategoryType,
    type: "string",
    array: true,
    default: [{ value: [] }],
    description: "Specify embedded languages that will not be formatted.",
  },
} satisfies SupportOptions;

type Options = typeof options;

declare module "../types.js" {
  interface EmbeddedOptions extends Options {}
  interface PrettierPluginEmbedOptions {
    [name]?: string[];
  }
}
