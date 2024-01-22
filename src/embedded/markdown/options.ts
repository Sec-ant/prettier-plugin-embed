import type { ChoiceSupportOption, SupportOptions } from "prettier";
import {
  type AutocompleteStringList,
  type StringListToInterfaceKey,
  makeIdentifiersOptionName,
  makeParserOptionName,
} from "../utils.js";
import { language } from "./language.js";

/**
 * References:
 *
 * - https://github.com/microsoft/vscode/blob/de0121cf0e05d1673903551b6dbb2871556bfae9/extensions/markdown-basics/package.json#L19
 * - https://github.com/github-linguist/linguist/blob/7ca3799b8b5f1acde1dd7a8dfb7ae849d3dfb4cd/lib/linguist/languages.yml#L4060
 */
const DEFAULT_IDENTIFIERS = ["md", "markdown"] as const;
type Identifiers = AutocompleteStringList<typeof DEFAULT_IDENTIFIERS>;
type DefaultIdentifiersHolder = StringListToInterfaceKey<
  typeof DEFAULT_IDENTIFIERS
>;

const MARKDOWN_PARSERS = ["markdown", "mdx", "remark"] as const;

type MarkdownParser = (typeof MARKDOWN_PARSERS)[number];

const EMBEDDED_LANGUAGE_IDENTIFIERS = makeIdentifiersOptionName(language);

const EMBEDDED_LANGUAGE_PARSER = makeParserOptionName(language);

export interface PrettierPluginDepsOptions {
  __inJsTemplate?: boolean;
}

export const options = {
  [EMBEDDED_LANGUAGE_IDENTIFIERS]: {
    category: "Embed",
    type: "string",
    array: true,
    default: [{ value: [...DEFAULT_IDENTIFIERS] }],
    description:
      "Tag or comment identifiers that make their subsequent template literals be identified as embedded Markdown language.",
  },
  [EMBEDDED_LANGUAGE_PARSER]: {
    category: "Embed",
    type: "choice",
    default: "markdown",
    description: "The parser used to parse the embedded Markdown language.",
    choices: MARKDOWN_PARSERS.map((parser) => ({
      value: parser,
      description: `Use the "${parser}" parser.`,
    })),
  } satisfies ChoiceSupportOption<MarkdownParser>,
} as const satisfies SupportOptions;

type Options = typeof options;

declare module "../types.js" {
  interface EmbeddedOptions extends Options {}
  interface EmbeddedDefaultIdentifiersHolder extends DefaultIdentifiersHolder {}
  interface PrettierPluginEmbedOptions {
    [EMBEDDED_LANGUAGE_IDENTIFIERS]?: Identifiers;
    [EMBEDDED_LANGUAGE_PARSER]?: MarkdownParser;
  }
}

declare module "prettier" {
  interface Options extends PrettierPluginDepsOptions {}
}
