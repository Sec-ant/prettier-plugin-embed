import type { SupportOptions } from "prettier";
import type { EmbeddedDefaultIdentifier } from "../types.js";
import {
  makeIdentifiersOptionName,
  type AutocompleteStringList,
} from "../utils.js";
import { language } from "./language.js";

type EmbeddedIdentifiers = AutocompleteStringList<EmbeddedDefaultIdentifier[]>;

const EMBEDDED_LANGUAGE_IDENTIFIERS = makeIdentifiersOptionName(language);

export const options = {
  [EMBEDDED_LANGUAGE_IDENTIFIERS]: {
    category: "Embed",
    type: "string",
    array: true,
    default: [{ value: [] }],
    description:
      "Specify embedded language identifiers that will not be formatted.",
  },
} as const satisfies SupportOptions;

type Options = typeof options;

declare module "../types.js" {
  interface EmbeddedOptions extends Options {}
  interface PrettierPluginEmbedOptions {
    [EMBEDDED_LANGUAGE_IDENTIFIERS]?: EmbeddedIdentifiers;
  }
}
