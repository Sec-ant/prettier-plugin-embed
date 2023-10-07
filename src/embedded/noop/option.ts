import type { CoreCategoryType, SupportOption } from "prettier";
import { name } from "./name.js";

export const option: SupportOption = {
  category: "Global" satisfies CoreCategoryType,
  type: "string",
  array: true,
  default: [{ value: [] }],
  description: "Specify embedded languages that will not be formatted.",
};

declare module "../types.js" {
  interface EmbeddedOptions {
    [name]: typeof option;
  }
  interface PrettierPluginEmbedOptions {
    [name]?: string[];
  }
}
