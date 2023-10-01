import { CoreCategoryType, SupportOptions } from "prettier";

export const options: SupportOptions = {
  disableBuiltinBehavior: {
    type: "boolean",
    category: "Global" satisfies CoreCategoryType,
    default: true,
    description:
      "Disable the built-in behavior of --embedded-language-formatting.",
  },
  embeddedLanguages: {
    type: "path",
    category: "Global" satisfies CoreCategoryType,
    array: true,
    default: [],
    description:
      "Config embedded languages formatting supported by this plugin.",
  },
};

interface EmbeddedLanguageTag {}

interface EmbeddedLanguage {
  triggerRules: [];
}

type EmbeddedLanguage =
  | {
      tag: string;
      parser: string;
    }
  | {
      tag: string;
    }
  | string;

export interface PluginOptions {
  disableBuiltinBehavior?: boolean;
  embeddedLanguages?: EmbeddedLanguage[];
}
