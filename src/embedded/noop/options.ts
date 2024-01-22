import type { SupportOptions } from "prettier";
import type { EmbeddedDefaultIdentifier } from "../types.js";
import {
  type AutocompleteStringList,
  makeIdentifiersOptionName,
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
      "Tag or comment identifiers that prevent their subsequent template literals from being identified as embedded languages and thus from being formatted.",
  },
} as const satisfies SupportOptions;

type Options = typeof options;

declare module "../types.js" {
  interface EmbeddedOptions extends Options {}
  interface PrettierPluginEmbedOptions {
    [EMBEDDED_LANGUAGE_IDENTIFIERS]?: EmbeddedIdentifiers;
  }
}
