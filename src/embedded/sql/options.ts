import type { CoreCategoryType, SupportOptions } from "prettier";
import type { SqlBaseOptions as PrettierPluginDepsOptions } from "prettier-plugin-sql";
import { embeddedLanguage } from "./embedded-language.js";
import { MakeIdentifiersType, MakeIdentifiersHolderType } from "../utils.js";

export const SQL_FORMATTER_LANGUAGES = [
  "sql",
  "bigquery",
  "hive",
  "mariadb",
  "mysql",
  "postgresql",
  "db2",
  "plsql",
  "n1ql",
  "redshift",
  "singlestoredb",
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
] as const;

type Identifiers = MakeIdentifiersType<
  typeof SQL_FORMATTER_LANGUAGES | typeof NODE_SQL_PARSER_DATABASES
>;
type DefaultIdentifiersHolder = MakeIdentifiersHolderType<
  typeof SQL_FORMATTER_LANGUAGES | typeof NODE_SQL_PARSER_DATABASES
>;

export type SqlFormatterLanguage = (typeof SQL_FORMATTER_LANGUAGES)[number];

export type NodeSqlParserDataBase = (typeof NODE_SQL_PARSER_DATABASES)[number];

export { PrettierPluginDepsOptions };

export const options = {
  [embeddedLanguage]: {
    category: "Global",
    type: "string",
    array: true,
    default: [{ value: [...SQL_FORMATTER_LANGUAGES] }],
    description:
      "Specify embedded SQL languages. This requires prettier-plugin-sql",
  },
} satisfies SupportOptions & Record<string, { category: CoreCategoryType }>;

type Options = typeof options;

declare module "../types.js" {
  interface EmbeddedOptions extends Options {}
  interface EmbeddedDefaultIdentifiersHolder extends DefaultIdentifiersHolder {}
  interface PrettierPluginEmbedOptions {
    [embeddedLanguage]?: Identifiers;
  }
}

declare module "prettier" {
  export interface Options extends PrettierPluginDepsOptions {}
}
