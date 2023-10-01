import type { CoreCategoryType, SupportOptions } from "prettier";
import type { Embedder } from "./embed/index.js";

export const options: SupportOptions = {
  embeddedLanguages: {
    type: "path",
    category: "Global" satisfies CoreCategoryType,
    array: true,
    default: [],
    description:
      "Config embedded languages formatting supported by this plugin.",
  },
};

interface EmbeddedLanguage {
  tag: string | string[];
  comment: string | string[];
  embedder: string | Embedder;
}

export interface PluginOptions {
  embeddedLanguages?: EmbeddedLanguage[];
}
