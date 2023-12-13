import type {
  ChoiceSupportOption,
  CoreCategoryType,
  SupportOptions,
} from "prettier";
import type { SqlBaseOptions as PrettierPluginSqlOptions } from "prettier-plugin-sql";
import type { SqlPluginOptions as PrettierPluginSqlCstRequiredOptions } from "prettier-plugin-sql-cst";
import {
  makeIdentifiersOptionName,
  makeParserOptionName,
  makePluginOptionName,
  type AutocompleteStringList,
  type StringListToInterfaceKey,
} from "../utils.js";
import { embeddedLanguage } from "./embedded-language.js";

/** References
 * - https://github.com/un-ts/prettier/blob/master/packages/sql/src/index.ts
 * "sql" is the default dialect, so we only have "sql" as the default identifier to avoid confusion.
 */
const DEFAULT_IDENTIFIERS = ["sql"] as const;

type Identifiers = AutocompleteStringList<typeof DEFAULT_IDENTIFIERS>;
type DefaultIdentifiersHolder = StringListToInterfaceKey<
  typeof DEFAULT_IDENTIFIERS
>;

const SQL_PLUGINS = ["prettier-plugin-sql", "prettier-plugin-sql-cst"] as const;
type SqlPlugin = (typeof SQL_PLUGINS)[number];

const SQL_CST_PARSERS = ["sqlite", "bigquery"] as const;
type SqlCstParser = (typeof SQL_CST_PARSERS)[number];

const EMBEDDED_LANGUAGE_IDENTIFIERS =
  makeIdentifiersOptionName(embeddedLanguage);

const EMBEDDED_LANGUAGE_PLUGIN = makePluginOptionName(embeddedLanguage);

const EMBEDDED_LANGUAGE_PARSER = makeParserOptionName(embeddedLanguage);

type PrettierPluginSqlCstOptions = Partial<PrettierPluginSqlCstRequiredOptions>;

export interface PrettierPluginDepsOptions
  extends PrettierPluginSqlOptions,
    PrettierPluginSqlCstOptions {}

export const options = {
  [EMBEDDED_LANGUAGE_IDENTIFIERS]: {
    category: "Global",
    type: "string",
    array: true,
    default: [{ value: [...DEFAULT_IDENTIFIERS] }],
    description:
      'Specify embedded SQL language identifiers. This requires "prettier-plugin-sql" or "prettier-plugin-sql-cst".',
  },
  [EMBEDDED_LANGUAGE_PLUGIN]: {
    category: "Global" as const,
    type: "choice",
    default: "prettier-plugin-sql",
    description:
      'Specify the Prettier plugin for parsing and formatting SQL. Default is "prettier-plugin-sql"',
    choices: [
      {
        value: "prettier-plugin-sql",
        description: 'Use "prettier-plugin-sql".',
      },
      {
        value: "prettier-plugin-sql-cst",
        description: 'Use "prettier-plugin-sql-cst".',
      },
    ],
  } satisfies ChoiceSupportOption<SqlPlugin>,
  [EMBEDDED_LANGUAGE_PARSER]: {
    category: "Global" as const,
    type: "choice",
    default: "sqlite",
    description:
      'Specify the embedded SQL language parser. Default is "sqlite". This option is only for "prettier-plugin-sql-cst".',
    choices: [
      {
        value: "sqlite",
        description: "SQLite parser.",
      },
      {
        value: "bigquery",
        description: "BigQuery parser.",
      },
    ],
  } satisfies ChoiceSupportOption<SqlCstParser>,
} satisfies SupportOptions & Record<string, { category: CoreCategoryType }>;

type Options = typeof options;

declare module "../types.js" {
  interface EmbeddedOptions extends Options {}
  interface EmbeddedDefaultIdentifiersHolder extends DefaultIdentifiersHolder {}
  interface PrettierPluginEmbedOptions {
    [EMBEDDED_LANGUAGE_IDENTIFIERS]?: Identifiers;
    [EMBEDDED_LANGUAGE_PLUGIN]?: SqlPlugin;
    [EMBEDDED_LANGUAGE_PARSER]?: SqlCstParser;
  }
}

declare module "prettier" {
  export interface Options extends PrettierPluginDepsOptions {}
}
