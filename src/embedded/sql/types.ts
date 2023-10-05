import { name } from "./name.js";
import type { SqlBaseOptions as PrettierPluginSqlOptions } from "prettier-plugin-sql";

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

export type SqlFormatterLanguage = (typeof SQL_FORMATTER_LANGUAGES)[number];

export type NodeSqlParserDataBase = (typeof NODE_SQL_PARSER_DATABASES)[number];

export interface PrettierPluginEmbedSqlOptions {
  [name]?: SqlFormatterLanguage[] | NodeSqlParserDataBase[] | string[];
}

declare module "prettier" {
  export interface Options
    extends PrettierPluginSqlOptions,
      PrettierPluginEmbedSqlOptions {}
}
