import type { CoreCategoryType, SupportOptions } from "prettier";
import { embeddedLanguage } from "./embedded-language.js";
import {
  type AutocompleteStringList,
  type StringListToInterfaceKey,
  makeIdentifiersOptionName,
  makeParserOptionName,
} from "../utils.js";

// copied from https://github.com/microsoft/vscode/blob/267f09acea3b2416861661d702b3be767bdeef6e/extensions/javascript/package.json
const DEFAULT_IDENTIFIERS = [
  "js",
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
