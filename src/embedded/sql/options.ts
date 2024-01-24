import type { ChoiceSupportOption, SupportOptions } from "prettier";
import {
  type AutocompleteStringList,
  type StringListToInterfaceKey,
  makeIdentifiersOptionName,
  makeParserOptionName,
  makePluginOptionName,
} from "../utils.js";
import { language } from "./language.js";

/**
 * References
 *
 * - https://github.com/un-ts/prettier/blob/master/packages/sql/src/index.ts "sql" is the default
 *   dialect, so we only have "sql" as the default identifier to avoid confusion.
 */
const DEFAULT_IDENTIFIERS = ["sql"] as const;

type Identifiers = AutocompleteStringList<(typeof DEFAULT_IDENTIFIERS)[number]>;
type DefaultIdentifiersHolder = StringListToInterfaceKey<
  typeof DEFAULT_IDENTIFIERS
>;

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

const EMBEDDED_LANGUAGE_PLUGIN = makePluginOptionName(language);

const EMBEDDED_LANGUAGE_PARSER = makeParserOptionName(language);

export const options = {
  [EMBEDDED_LANGUAGE_IDENTIFIERS]: {
    category: "Embed",
    type: "string",
    array: true,
    default: [{ value: [...DEFAULT_IDENTIFIERS] }],
    description:
      "Tag or comment identifiers that make their subsequent template literals be identified as embedded SQL language. This option requires the `prettier-plugin-sql` plugin or the `prettier-plugin-sql-cst` plugin.",
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
  interface EmbeddedDefaultIdentifiersHolder extends DefaultIdentifiersHolder {}
  interface PluginEmbedOptions {
    [EMBEDDED_LANGUAGE_IDENTIFIERS]?: Identifiers;
    [EMBEDDED_LANGUAGE_PLUGIN]?: SqlPlugin;
    [EMBEDDED_LANGUAGE_PARSER]?: SqlCstParser;
  }
}
