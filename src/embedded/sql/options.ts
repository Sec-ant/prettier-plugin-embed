import type { CoreCategoryType, SupportOptions } from "prettier";
import type { SqlBaseOptions as PrettierPluginDepsOptions } from "prettier-plugin-sql";
import { name } from "./name.js";

export const options = {
  [name]: {
    category: "Global" satisfies CoreCategoryType,
    type: "string",
    array: true,
    default: [{ value: ["sql"] }],
    description:
      "Specify embedded SQL languages. This requires prettier-plugin-sql",
  },
} satisfies SupportOptions;

type Options = typeof options;

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

export { PrettierPluginDepsOptions };

declare module "../types.js" {
  interface EmbeddedOptions extends Options {}
  interface PrettierPluginEmbedOptions {
    [name]?: SqlFormatterLanguage[] | NodeSqlParserDataBase[] | string[];
  }
}

declare module "prettier" {
  export interface Options extends PrettierPluginDepsOptions {}
}
