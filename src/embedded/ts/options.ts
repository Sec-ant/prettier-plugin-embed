import type { CoreCategoryType, SupportOptions } from "prettier";
import { name } from "./name.js";
import type { MakeOptionLangType, MakeLangsHolderType } from "../utils.js";

// copied from https://github.com/microsoft/vscode/blob/267f09acea3b2416861661d702b3be767bdeef6e/extensions/typescript-basics/package.json
const DEFAULT_LANGS = ["ts", "cts", "mts", "typescript"] as const;
type OptionLang = MakeOptionLangType<typeof DEFAULT_LANGS>;
type DefaultLangsHolder = MakeLangsHolderType<typeof DEFAULT_LANGS>;

// TODO: keep in sync with prettier somehow
const DEFAULT_TS_PARSERS = ["typescript", "babel-ts"] as const;

type TsParser = (typeof DEFAULT_TS_PARSERS)[number];

const EMBEDDED_TS_PARSER = "embeddedTsParser";

export interface PrettierPluginDepsOptions {
  /* prettier built-in options */
}

export const options = {
  [name]: {
    category: "Global",
    type: "string",
    array: true,
    default: [{ value: [...DEFAULT_LANGS] }],
    description: "Specify embedded TS languages.",
  },
  [EMBEDDED_TS_PARSER]: {
    category: "Global",
    type: "string",
    array: false,
    default: "typescript" satisfies TsParser,
    description: "Specify the parser for the embedded TS languages.",
  },
} satisfies SupportOptions & Record<string, { category: CoreCategoryType }>;

type Options = typeof options;

declare module "../types.js" {
  interface EmbeddedOptions extends Options {}
  interface EmbeddedDefaultLangsHolder extends DefaultLangsHolder {}
  interface PrettierPluginEmbedOptions {
    [name]?: OptionLang;
    [EMBEDDED_TS_PARSER]?: TsParser;
  }
}

declare module "prettier" {
  export interface Options extends PrettierPluginDepsOptions {}
}
