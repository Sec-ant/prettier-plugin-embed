import type { CoreCategoryType, SupportOptions } from "prettier";
import { name } from "./name.js";
import type { MakeOptionLangType, MakeLangsHolderType } from "../utils.js";

// copied from https://github.com/microsoft/vscode/blob/267f09acea3b2416861661d702b3be767bdeef6e/extensions/javascript/package.json
const DEFAULT_LANGS = [
  "js",
  "es",
  "es6",
  "mjs",
  "cjs",
  "pac",
  "javascript",
] as const;
type OptionLang = MakeOptionLangType<typeof DEFAULT_LANGS>;
type DefaultLangsHolder = MakeLangsHolderType<typeof DEFAULT_LANGS>;

// TODO: keep in sync with prettier somehow
const DEFAULT_ES_PARSERS = [
  "babel",
  "babel-flow",
  "acorn",
  "espree",
  "flow",
  "meriyah",
] as const;

type EsParser = (typeof DEFAULT_ES_PARSERS)[number];

const EMBEDDED_ES_PARSER = "embeddedEsParser";

export interface PrettierPluginDepsOptions {
  /* prettier built-in options */
}

export const options = {
  [name]: {
    category: "Global",
    type: "string",
    array: true,
    default: [{ value: [...DEFAULT_LANGS] }],
    description: "Specify embedded ES languages.",
  },
  [EMBEDDED_ES_PARSER]: {
    category: "Global",
    type: "string",
    array: false,
    default: "babel" satisfies EsParser,
    description: "Specify the parser for the embedded ES languages.",
  },
} satisfies SupportOptions & Record<string, { category: CoreCategoryType }>;

type Options = typeof options;

declare module "../types.js" {
  interface EmbeddedOptions extends Options {}
  interface EmbeddedDefaultLangsHolder extends DefaultLangsHolder {}
  interface PrettierPluginEmbedOptions {
    [name]?: OptionLang;
    [EMBEDDED_ES_PARSER]?: EsParser;
  }
}

declare module "prettier" {
  export interface Options extends PrettierPluginDepsOptions {}
}
