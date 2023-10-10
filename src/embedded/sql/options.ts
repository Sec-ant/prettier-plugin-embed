import type { CoreCategoryType, SupportOptions } from "prettier";
import type { SqlBaseOptions as PrettierPluginDepsOptions } from "prettier-plugin-sql";
import { name } from "./name.js";
import { MakeOptionLangType, MakeLangsHolderType } from "../utils.js";

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

type OptionLang = MakeOptionLangType<
  typeof SQL_FORMATTER_LANGUAGES | typeof NODE_SQL_PARSER_DATABASES
>;
type DefaultLangsHolder = MakeLangsHolderType<
  typeof SQL_FORMATTER_LANGUAGES | typeof NODE_SQL_PARSER_DATABASES
>;

export type SqlFormatterLanguage = (typeof SQL_FORMATTER_LANGUAGES)[number];

export type NodeSqlParserDataBase = (typeof NODE_SQL_PARSER_DATABASES)[number];

export { PrettierPluginDepsOptions };

export const options = {
  [name]: {
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
  interface EmbeddedDefaultLangsHolder extends DefaultLangsHolder {}
  interface PrettierPluginEmbedOptions {
    [name]?: OptionLang;
  }
}

declare module "prettier" {
  export interface Options extends PrettierPluginDepsOptions {}
}
