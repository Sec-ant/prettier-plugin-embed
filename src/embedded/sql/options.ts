import type { CoreCategoryType, SupportOptions } from "prettier";
import type { SqlBaseOptions as PrettierPluginDepsOptions } from "prettier-plugin-sql";
import {
  makeIdentifiersOptionName,
  type AutocompleteStringList,
  type StringListToInterfaceKey,
} from "../utils.js";
import { embeddedLanguage } from "./embedded-language.js";

// TODO: we shouldn't hardcode the dialects because they may differ in different plugin versions
// TODO: reach out to the maintainer of prettier-plugin-sql to export them.
/** References
 * - https://github.com/un-ts/prettier/blob/a5f1aae6464aa54749377d69a8237a70a6509a13/packages/sql/src/index.ts
 */
export const SQL_FORMATTER_LANGUAGES = [
  "sql",
  "bigquery",
  "db2",
  "db2i",
  "hive",
  "mariadb",
  "mysql",
  "n1ql",
  "postgresql",
  "plsql",
  "redshift",
  "singlestoredb",
  "snowflake",
  "spark",
  "sqlite",
  "transactsql",
  "tsql",
  "trino",
] as const;

export const NODE_SQL_PARSER_DATABASES = [
  "bigquery",
  "db2",
  "hive",
  "mariadb",
  "mysql",
  "postgresql",
  "transactsql",
  "flinksql",
  "snowflake",
] as const;

type Identifiers = AutocompleteStringList<
  typeof SQL_FORMATTER_LANGUAGES | typeof NODE_SQL_PARSER_DATABASES
>;
type DefaultIdentifiersHolder = StringListToInterfaceKey<
  typeof SQL_FORMATTER_LANGUAGES | typeof NODE_SQL_PARSER_DATABASES
>;

export type SqlFormatterLanguage = (typeof SQL_FORMATTER_LANGUAGES)[number];

export type NodeSqlParserDataBase = (typeof NODE_SQL_PARSER_DATABASES)[number];

const embeddedLanguageIdentifiers = makeIdentifiersOptionName(embeddedLanguage);

export { PrettierPluginDepsOptions };

export const options = {
  [embeddedLanguageIdentifiers]: {
    category: "Global",
    type: "string",
    array: true,
    // TODO: remove these hardcoded defaults once supported diacts are exported from prettier-plugin-sql
    default: [{ value: ["sql", "mysql", "mariadb", "postgresql"] }],
    description:
      'Specify embedded SQL language identifiers. This requires "prettier-plugin-sql".',
  },
} satisfies SupportOptions & Record<string, { category: CoreCategoryType }>;

type Options = typeof options;

declare module "../types.js" {
  interface EmbeddedOptions extends Options {}
  interface EmbeddedDefaultIdentifiersHolder extends DefaultIdentifiersHolder {}
  interface PrettierPluginEmbedOptions {
    [embeddedLanguageIdentifiers]?: Identifiers;
  }
}

declare module "prettier" {
  export interface Options extends PrettierPluginDepsOptions {}
}
