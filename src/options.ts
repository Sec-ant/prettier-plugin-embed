import type { CoreCategoryType, SupportOptions } from "prettier";
import type { Embedder } from "./embedders/index.js";

export const options: SupportOptions = {
  embeddedLanguages: {
    type: "path",
    category: "Global" satisfies CoreCategoryType,
    array: true,
    default: [{ value: [] }],
    description:
      "Config embedded languages formatting supported by this plugin.",
  },
};

interface EmbeddedLanguage {
  tag: string | string[];
  comment: string | string[];
  embedder: string | Embedder | null;
}

export interface PluginOptions {
  embeddedLanguages?: EmbeddedLanguage[];
}
