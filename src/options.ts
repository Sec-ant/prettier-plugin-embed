import type { CoreCategoryType, SupportOptions } from "prettier";

export const options: SupportOptions = {
  embeddedLanguages: {
    category: "Global" satisfies CoreCategoryType,
    type: "string",
    array: false,
    default: "[]",
    description:
      "Config embedded languages formatting supported by this plugin.",
  },
};

export interface EmbeddedLanguage {
  tag: string | string[];
  comment: string | string[];
  embedder?: string | null;
}

export interface PrettierPluginEmbedOptions {
  embeddedLanguages?: string;
}
