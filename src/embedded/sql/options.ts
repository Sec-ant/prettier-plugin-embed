import type { ChoiceSupportOption, SupportOptions } from "prettier";
import {
  type AutocompleteStringList,
  type StringListToInterfaceKey,
  fallbackIndicator,
  makeCommentsOptionName,
  makeIdentifiersOptionName,
  makeParserOptionName,
  makePluginOptionName,
  makeTagsOptionName,
} from "../utils.js";
import { language } from "./language.js";

const DEFAULT_COMMENTS_OR_TAGS = ["sql"] as const;

const DEFAULT_COMMENTS = DEFAULT_COMMENTS_OR_TAGS;
type Comments = AutocompleteStringList<(typeof DEFAULT_COMMENTS)[number]>;
type DefaultCommentsHolder = StringListToInterfaceKey<typeof DEFAULT_COMMENTS>;

const DEFAULT_TAGS = DEFAULT_COMMENTS_OR_TAGS;
type Tags = AutocompleteStringList<(typeof DEFAULT_TAGS)[number]>;
type DefaultTagsHolder = StringListToInterfaceKey<typeof DEFAULT_TAGS>;

const SQL_PLUGINS = ["prettier-plugin-sql", "prettier-plugin-sql-cst"] as const;
type SqlPlugin = (typeof SQL_PLUGINS)[number];

const SQL_CST_PARSERS = [
  "sqlite",
  "bigquery",
  "mysql",
  "mariadb",
  "postgresql",
] as const;
type SqlCstParser = (typeof SQL_CST_PARSERS)[number];

const EMBEDDED_LANGUAGE_IDENTIFIERS = makeIdentifiersOptionName(language);

const EMBEDDED_LANGUAGE_COMMENTS = makeCommentsOptionName(language);
const EMBEDDED_LANGUAGE_TAGS = makeTagsOptionName(language);
const EMBEDDED_LANGUAGE_PLUGIN = makePluginOptionName(language);
const EMBEDDED_LANGUAGE_PARSER = makeParserOptionName(language);

export const options = {
  [EMBEDDED_LANGUAGE_IDENTIFIERS]: {
    category: "Embed",
    type: "string",
    array: true,
    default: [{ value: [...DEFAULT_COMMENTS_OR_TAGS] }],
    description:
      "Tag or comment identifiers that make their subsequent template literals be identified as embedded SQL language. This option requires the `prettier-plugin-sql` plugin or the `prettier-plugin-sql-cst` plugin.",
    deprecated: `Please use \`${EMBEDDED_LANGUAGE_COMMENTS}\` or \`${EMBEDDED_LANGUAGE_TAGS}\`.`,
  },
  [EMBEDDED_LANGUAGE_COMMENTS]: {
    category: "Embed",
    type: "string",
    array: true,
    default: [{ value: [fallbackIndicator] }],
    description:
      "Block comments that make their subsequent template literals be identified as embedded SQL language. This option requires the `prettier-plugin-sql` plugin or the `prettier-plugin-sql-cst` plugin.",
  },
  [EMBEDDED_LANGUAGE_TAGS]: {
    category: "Embed",
    type: "string",
    array: true,
    default: [{ value: [fallbackIndicator] }],
    description:
      "Tags that make their subsequent template literals be identified as embedded SQL language. This option requires the `prettier-plugin-sql` plugin or the `prettier-plugin-sql-cst` plugin.",
  },
  [EMBEDDED_LANGUAGE_PLUGIN]: {
    category: "Embed",
    type: "choice",
    default: "prettier-plugin-sql",
    description:
      "The plugin used to format the embedded SQL language. This option requires the `prettier-plugin-sql` plugin or the `prettier-plugin-sql-cst` plugin.",
    choices: SQL_PLUGINS.map((plugin) => ({
      value: plugin,
      description: `Use the "${plugin}" plugin.`,
    })),
  } satisfies ChoiceSupportOption<SqlPlugin>,
  [EMBEDDED_LANGUAGE_PARSER]: {
    category: "Embed",
    type: "choice",
    default: "sqlite",
    description:
      "Specify the embedded SQL language parser. This option is only needed with the `prettier-plugin-sql-cst` plugin.",
    choices: SQL_CST_PARSERS.map((parser) => ({
      value: parser,
      description: `Use the "${parser}" parser.`,
    })),
  } satisfies ChoiceSupportOption<SqlCstParser>,
} as const satisfies SupportOptions;

type Options = typeof options;

declare module "../types.js" {
  interface EmbeddedOptions extends Options {}
  interface EmbeddedDefaultCommentsHolder extends DefaultCommentsHolder {}
  interface EmbeddedDefaultTagsHolder extends DefaultTagsHolder {}
  interface PluginEmbedOptions {
    /**
     * @deprecated Please use `embeddedSqlComments` or `embeddedSqlTags`.
     */
    [EMBEDDED_LANGUAGE_IDENTIFIERS]?: (Comments[number] | Tags[number])[];
    [EMBEDDED_LANGUAGE_COMMENTS]?: Comments;
    [EMBEDDED_LANGUAGE_TAGS]?: Tags;
    [EMBEDDED_LANGUAGE_PLUGIN]?: SqlPlugin;
    [EMBEDDED_LANGUAGE_PARSER]?: SqlCstParser;
  }
}
