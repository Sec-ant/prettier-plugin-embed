import type { CoreCategoryType, SupportOptions } from "prettier";
import {
  makeIdentifiersOptionName,
  makeParserOptionName,
  type AutocompleteStringList,
  type StringListToInterfaceKey,
} from "../utils.js";
import { embeddedLanguage } from "./embedded-language.js";

/** References:
 * - https://github.com/github-linguist/linguist/blob/7ca3799b8b5f1acde1dd7a8dfb7ae849d3dfb4cd/lib/linguist/languages.yml#L3141
 */
const DEFAULT_IDENTIFIERS = ["json", "jsonl"] as const;
type Identifiers = AutocompleteStringList<typeof DEFAULT_IDENTIFIERS>;
type DefaultIdentifiersHolder = StringListToInterfaceKey<
  typeof DEFAULT_IDENTIFIERS
>;

// TODO: keep in sync with prettier somehow
const DEFAULT_JSON_PARSERS = ["json-stringify", "json", "json5"] as const;

type JsonParser = (typeof DEFAULT_JSON_PARSERS)[number];

const EMBEDDED_LANGUAGE_PARSER = makeParserOptionName(embeddedLanguage);

const EMBEDDED_LANGUAGE_IDENTIFIERS =
  makeIdentifiersOptionName(embeddedLanguage);

export interface PrettierPluginDepsOptions {
  /* prettier built-in options */
}

export const options = {
  [EMBEDDED_LANGUAGE_IDENTIFIERS]: {
    category: "Global",
    type: "string",
    array: true,
    default: [{ value: [...DEFAULT_IDENTIFIERS] }],
    description: "Specify embedded JSON language identifiers.",
  },
  [EMBEDDED_LANGUAGE_PARSER]: {
    category: "Global",
    type: "string",
    array: false,
    default: "json" satisfies JsonParser,
    description: "Specify the embedded JSON language parser.",
  },
} satisfies SupportOptions & Record<string, { category: CoreCategoryType }>;

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
  export interface Options extends PrettierPluginDepsOptions {}
}