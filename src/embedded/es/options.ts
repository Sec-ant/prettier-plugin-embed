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
const ES_PARSERS = [
  "babel",
  "babel-flow",
  "acorn",
  "espree",
  "flow",
  "meriyah",
] as const;

type EsParser = (typeof ES_PARSERS)[number];

const EMBEDDED_LANGUAGE_IDENTIFIERS = makeIdentifiersOptionName(language);

const EMBEDDED_LANGUAGE_PARSER = makeParserOptionName(language);

export interface PrettierPluginDepsOptions {
  /* prettier built-in options */
}

export const options = {
  [EMBEDDED_LANGUAGE_IDENTIFIERS]: {
    category: "Embed",
    type: "string",
    array: true,
    default: [{ value: [...DEFAULT_IDENTIFIERS] }],
    description: "Specify embedded ES language identifiers.",
  },
  [EMBEDDED_LANGUAGE_PARSER]: {
    category: "Embed",
    type: "choice",
    default: "babel",
    description: 'Specify the embedded ES language parser. Default is "babel".',
    choices: ES_PARSERS.map((parser) => ({
      value: parser,
      description: `Use "${parser}".`,
    })),
  } satisfies ChoiceSupportOption<EsParser>,
} as const satisfies SupportOptions;

type Options = typeof options;

declare module "../types.js" {
  interface EmbeddedOptions extends Options {}
  interface EmbeddedDefaultIdentifiersHolder extends DefaultIdentifiersHolder {}
  interface PrettierPluginEmbedOptions {
    [EMBEDDED_LANGUAGE_IDENTIFIERS]?: Identifiers;
    [EMBEDDED_LANGUAGE_PARSER]?: EsParser;
  }
}

declare module "prettier" {
  export interface Options extends PrettierPluginDepsOptions {}
}
