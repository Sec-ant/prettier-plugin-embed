import type { CoreCategoryType, SupportOptions } from "prettier";
import { embeddedLanguage } from "./embedded-language.js";
import {
  type AutocompleteStringList,
  type StringListToInterfaceKey,
  makeIdentifiersOptionName,
  makeParserOptionName,
} from "../utils.js";

/** References:
 * - https://github.com/microsoft/vscode/blob/de0121cf0e05d1673903551b6dbb2871556bfae9/extensions/javascript/package.json#L37
 * - https://github.com/github-linguist/linguist/blob/7ca3799b8b5f1acde1dd7a8dfb7ae849d3dfb4cd/lib/linguist/languages.yml#L3314
 */
const DEFAULT_IDENTIFIERS = [
  "js",
  "jsx",
  "es",
  "es6",
  "mjs",
  "cjs",
  "pac",
  "javascript",
] as const;
type Identifiers = AutocompleteStringList<typeof DEFAULT_IDENTIFIERS>;
type DefaultIdentifiersHolder = StringListToInterfaceKey<
  typeof DEFAULT_IDENTIFIERS
>;

// TODO: keep in sync with prettier somehow
const DEFAULT_ES_PARSERS = [
  "babel",
  "babel-flow",
  "acorn",
  "espree",
  "flow",
  "meriyah",
] as const;

type EsParser = (typeof DEFAULT_ES_PARSERS)[number];

const embeddedLanguageIdentifiersOptionName =
  makeIdentifiersOptionName(embeddedLanguage);

const embeddedLanguageParserOptionName = makeParserOptionName(embeddedLanguage);

export interface PrettierPluginDepsOptions {
  /* prettier built-in options */
}

export const options = {
  [embeddedLanguageIdentifiersOptionName]: {
    category: "Global",
    type: "string",
    array: true,
    default: [{ value: [...DEFAULT_IDENTIFIERS] }],
    description: "Specify embedded ES language identifiers.",
  },
  [embeddedLanguageParserOptionName]: {
    category: "Global",
    type: "string",
    array: false,
    default: "babel" satisfies EsParser,
    description: "Specify the embedded ES language parser.",
  },
} satisfies SupportOptions & Record<string, { category: CoreCategoryType }>;

type Options = typeof options;

declare module "../types.js" {
  interface EmbeddedOptions extends Options {}
  interface EmbeddedDefaultIdentifiersHolder extends DefaultIdentifiersHolder {}
  interface PrettierPluginEmbedOptions {
    [embeddedLanguageIdentifiersOptionName]?: Identifiers;
    [embeddedLanguageParserOptionName]?: EsParser;
  }
}

declare module "prettier" {
  export interface Options extends PrettierPluginDepsOptions {}
}
