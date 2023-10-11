import type { CoreCategoryType, SupportOptions } from "prettier";
import { name } from "./name.js";
import type { MakeOptionLangType, MakeLangsHolderType } from "../utils.js";

// copied from https://github.com/microsoft/vscode/blob/6a7a661757dec1983ff05ef908a2bbb75ce841e0/extensions/php/package.json
const DEFAULT_LANGS = ["php", "php5", "phtml", "ctp"] as const;
type OptionLang = MakeOptionLangType<typeof DEFAULT_LANGS>;
type DefaultLangsHolder = MakeLangsHolderType<typeof DEFAULT_LANGS>;

export const options = {
  [name]: {
    category: "Global",
    type: "string",
    array: true,
    default: [{ value: [...DEFAULT_LANGS] }],
    description:
      "Specify embedded PHP languages. This requires @prettier/plugin-php",
  },
} satisfies SupportOptions & Record<string, { category: CoreCategoryType }>;

type Options = typeof options;

export interface PrettierPluginDepsOptions {
  phpVersion?:
    | "5.0"
    | "5.1"
    | "5.2"
    | "5.3"
    | "5.4"
    | "5.5"
    | "5.6"
    | "7.0"
    | "7.1"
    | "7.2"
    | "7.3"
    | "7.4"
    | "8.0"
    | "8.1"
    | "8.2";
  trailingCommaPHP?: boolean;
  braceStyle?: "psr-2" | "per-cs" | "1tbs";
}

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
