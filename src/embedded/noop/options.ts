import type { CoreCategoryType, SupportOptions } from "prettier";
import type { EmbeddedDefaultIdentifier } from "../types.js";
import {
  makeIdentifiersOptionName,
  type AutocompleteStringList,
} from "../utils.js";
import { embeddedLanguage } from "./embedded-language.js";

type EmbeddedIdentifiers = AutocompleteStringList<EmbeddedDefaultIdentifier[]>;

const embeddedLanguageIdentifiers = makeIdentifiersOptionName(embeddedLanguage);

export const options = {
  [embeddedLanguageIdentifiers]: {
    category: "Global",
    type: "string",
    array: true,
    default: [{ value: [] }],
    description:
      "Specify embedded language identifiers that will not be formatted.",
  },
} satisfies SupportOptions & Record<string, { category: CoreCategoryType }>;

type Options = typeof options;

declare module "../types.js" {
  interface EmbeddedOptions extends Options {}
  interface PrettierPluginEmbedOptions {
    [embeddedLanguageIdentifiers]?: EmbeddedIdentifiers;
  }
}
