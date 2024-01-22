import type { ChoiceSupportOption, SupportOptions } from "prettier";
import {
  type AutocompleteStringList,
  type StringListToInterfaceKey,
  makeIdentifiersOptionName,
} from "../utils.js";
import { language } from "./language.js";

/**
 * References
 *
 * - https://github.com/prettier/plugin-ruby/blob/0a2100ca3b8b53d9491270ece64806d95da181a6/src/plugin.js#L194
 */
const DEFAULT_IDENTIFIERS = ["ruby"] as const;
type Identifiers = AutocompleteStringList<typeof DEFAULT_IDENTIFIERS>;
type DefaultIdentifiersHolder = StringListToInterfaceKey<
  typeof DEFAULT_IDENTIFIERS
>;

const RUBY_PARSERS = ["ruby", "rbs", "haml"] as const;
export type RubyParser = (typeof RUBY_PARSERS)[number];

const EMBEDDED_LANGUAGE_PARSER = "embeddedRubyParser";

const EMBEDDED_LANGUAGE_IDENTIFIERS = makeIdentifiersOptionName(language);

export const options = {
  [EMBEDDED_LANGUAGE_IDENTIFIERS]: {
    category: "Embed",
    type: "string",
    array: true,
    default: [{ value: [...DEFAULT_IDENTIFIERS] }],
    description:
      "Tag or comment identifiers that make their subsequent template literals be identified as embedded Ruby language. This option requires the `@prettier/plugin-ruby` plugin.",
  },
  [EMBEDDED_LANGUAGE_PARSER]: {
    category: "Embed",
    type: "choice",
    default: "ruby",
    description:
      "The parser used to parse the embedded Ruby language. This option requires the `@prettier/plugin-ruby` plugin.",
    choices: RUBY_PARSERS.map((parser) => ({
      value: parser,
      description: `Use the "${parser}" parser.`,
    })),
  } satisfies ChoiceSupportOption<RubyParser>,
} as const satisfies SupportOptions;

type Options = typeof options;

declare module "../types.js" {
  interface EmbeddedOptions extends Options {}
  interface EmbeddedDefaultIdentifiersHolder extends DefaultIdentifiersHolder {}
  interface PrettierPluginEmbedOptions {
    [EMBEDDED_LANGUAGE_IDENTIFIERS]?: Identifiers;
    [EMBEDDED_LANGUAGE_PARSER]?: RubyParser;
  }
}
