import type { ChoiceSupportOption, SupportOptions } from "prettier";
import {
  makeIdentifiersOptionName,
  makeParserOptionName,
  type AutocompleteStringList,
  type StringListToInterfaceKey,
} from "../utils.js";
import { language } from "./language.js";

/**
 * References:
 *
 * - https://github.com/github-linguist/linguist/blob/7ca3799b8b5f1acde1dd7a8dfb7ae849d3dfb4cd/lib/linguist/languages.yml#L3141
 */
const DEFAULT_IDENTIFIERS = ["json", "jsonl"] as const;
type Identifiers = AutocompleteStringList<typeof DEFAULT_IDENTIFIERS>;
type DefaultIdentifiersHolder = StringListToInterfaceKey<
  typeof DEFAULT_IDENTIFIERS
>;

// TODO: keep in sync with prettier somehow
const JSON_PARSERS = ["json", "json5", "jsonc", "json-stringify"] as const;

type JsonParser = (typeof JSON_PARSERS)[number];

const EMBEDDED_LANGUAGE_PARSER = makeParserOptionName(language);

const EMBEDDED_LANGUAGE_IDENTIFIERS = makeIdentifiersOptionName(language);

export interface PrettierPluginDepsOptions {
  /* prettier built-in options */
}

export const options = {
  [EMBEDDED_LANGUAGE_IDENTIFIERS]: {
    category: "Embed",
    type: "string",
    array: true,
    default: [{ value: [...DEFAULT_IDENTIFIERS] }],
    description: "Specify embedded JSON language identifiers.",
  },
  [EMBEDDED_LANGUAGE_PARSER]: {
    category: "Embed",
    type: "choice",
    default: "json",
    description:
      'Specify the embedded JSON language parser. Default is "json".',
    choices: JSON_PARSERS.map((parser) => ({
      value: parser,
      description: `Use "${parser}".`,
    })),
  } satisfies ChoiceSupportOption<JsonParser>,
} as const satisfies SupportOptions;

type Options = typeof options;

declare module "../types.js" {
  interface EmbeddedOptions extends Options {}
  interface EmbeddedDefaultIdentifiersHolder extends DefaultIdentifiersHolder {}
  interface PrettierPluginEmbedOptions {
    [EMBEDDED_LANGUAGE_IDENTIFIERS]?: Identifiers;
    [EMBEDDED_LANGUAGE_PARSER]?: JsonParser;
  }
}

declare module "prettier" {
  interface Options extends PrettierPluginDepsOptions {}
}
