import type { CoreCategoryType, SupportOptions } from "prettier";
import { embeddedLanguage } from "./embedded-language.js";
import {
  type AutocompleteStringList,
  type StringListToInterfaceKey,
  makeIdentifiersOptionName,
} from "../utils.js";

const RUBY_PARSERS = ["ruby", "rbs", "haml"] as const;
export type RubyParser = (typeof RUBY_PARSERS)[number];

// copied from https://github.com/prettier/plugin-ruby/blob/0a2100ca3b8b53d9491270ece64806d95da181a6/src/plugin.js
export const RUBY_PARSER_IDENTIFIERS = [
  "ruby" satisfies RubyParser,
  "arb",
  "axlsx",
  "builder",
  "eye",
  "fcgi",
  "gemfile",
  "gemspec",
  "god",
  "jb",
  "jbuilder",
  "mspec",
  "opal",
  "pluginspec",
  "podspec",
  "rabl",
  "rake",
  "rb",
  "rbi",
  "rbuild",
  "rbw",
  "rbx",
  "ru",
  "thor",
  "watchr",
] as const;
export type RubyParserIdentifier = (typeof RUBY_PARSER_IDENTIFIERS)[number];

export const RBS_PARSER_IDENTIFIERS = ["rbs" satisfies RubyParser] as const;
export type RbsParserIdentifier = (typeof RBS_PARSER_IDENTIFIERS)[number];

export const HAML_PARSER_IDENTIFIERS = ["haml" satisfies RubyParser] as const;
export type HamlParserIdentifier = (typeof HAML_PARSER_IDENTIFIERS)[number];

const DEFAULT_IDENTIFIERS = [
  ...RUBY_PARSER_IDENTIFIERS,
  ...RBS_PARSER_IDENTIFIERS,
  ...HAML_PARSER_IDENTIFIERS,
] as const;
type Identifiers = AutocompleteStringList<typeof DEFAULT_IDENTIFIERS>;
type DefaultIdentifiersHolder = StringListToInterfaceKey<
  typeof DEFAULT_IDENTIFIERS
>;

const EMBEDDED_LANGUAGE_PARSER = "embeddedRubyParser";

const embeddedLanguageIdentifiers = makeIdentifiersOptionName(embeddedLanguage);

export interface PrettierPluginDepsOptions {
  rubyPlugins?: AutocompleteStringList<
    [
      "plugin/single_quotes",
      "plugin/trailing_comma",
      "plugin/disable_auto_ternary",
    ]
  >;
  rubySingleQuote?: boolean;
  rubyExecutablePath?: string;
}

export const options = {
  [embeddedLanguageIdentifiers]: {
    category: "Global",
    type: "string",
    array: true,
    default: [{ value: [...DEFAULT_IDENTIFIERS] }],
    description:
      'Specify embedded Ruby language identifiers. This requires "@prettier/plugin-ruby".',
  },
  [EMBEDDED_LANGUAGE_PARSER]: {
    category: "Global",
    type: "string",
    array: false,
    default: undefined,
    description: "Specify the embedded Ruby language parser.",
  },
} satisfies SupportOptions & Record<string, { category: CoreCategoryType }>;

type Options = typeof options;

declare module "../types.js" {
  interface EmbeddedOptions extends Options {}
  interface EmbeddedDefaultIdentifiersHolder extends DefaultIdentifiersHolder {}
  interface PrettierPluginEmbedOptions {
    [embeddedLanguageIdentifiers]?: Identifiers;
    [EMBEDDED_LANGUAGE_PARSER]?: RubyParser;
  }
}

declare module "prettier" {
  export interface Options extends PrettierPluginDepsOptions {}
}
