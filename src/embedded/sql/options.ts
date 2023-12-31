import type { ChoiceSupportOption, SupportOptions } from "prettier";
import type { SqlBaseOptions as PrettierPluginSqlOptions } from "prettier-plugin-sql";
import type { SqlPluginOptions as PrettierPluginSqlCstRequiredOptions } from "prettier-plugin-sql-cst";
import {
  makeIdentifiersOptionName,
  makeParserOptionName,
  makePluginOptionName,
  type AutocompleteStringList,
  type StringListToInterfaceKey,
  type UnionToIntersection,
} from "../utils.js";
import { language } from "./language.js";

/**
 * References
 *
 * - https://github.com/un-ts/prettier/blob/master/packages/sql/src/index.ts "sql" is the default
 *   dialect, so we only have "sql" as the default identifier to avoid confusion.
 */
const DEFAULT_IDENTIFIERS = ["sql"] as const;

type Identifiers = AutocompleteStringList<typeof DEFAULT_IDENTIFIERS>;
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

type PrettierPluginSqlCstOptions = Partial<PrettierPluginSqlCstRequiredOptions>;

export interface PrettierPluginDepsOptions
  extends UnionToIntersection<PrettierPluginSqlOptions>,
    PrettierPluginSqlCstOptions {}

export const options = {
  [EMBEDDED_LANGUAGE_IDENTIFIERS]: {
    category: "Embed",
    type: "string",
    array: true,
    default: [{ value: [...DEFAULT_IDENTIFIERS] }],
    description:
      'Specify embedded SQL language identifiers. This requires "prettier-plugin-sql" or "prettier-plugin-sql-cst".',
  },
  [EMBEDDED_LANGUAGE_PLUGIN]: {
    category: "Embed",
    type: "choice",
    default: "prettier-plugin-sql",
    description:
      'Specify the Prettier plugin for parsing and formatting SQL. Default is "prettier-plugin-sql"',
    choices: SQL_PLUGINS.map((plugin) => ({
      value: plugin,
      description: `Use "${plugin}".`,
    })),
  } satisfies ChoiceSupportOption<SqlPlugin>,
  [EMBEDDED_LANGUAGE_PARSER]: {
    category: "Embed",
    type: "choice",
    default: "sqlite",
    description:
      'Specify the embedded SQL language parser. Default is "sqlite". This option is only for "prettier-plugin-sql-cst".',
    choices: SQL_CST_PARSERS.map((parser) => ({
      value: parser,
      description: `Use "${parser}" parser.`,
    })),
  } satisfies ChoiceSupportOption<SqlCstParser>,
} as const satisfies SupportOptions;

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
