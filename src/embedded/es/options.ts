import type { CoreCategoryType, SupportOptions } from "prettier";
import { embeddedLanguage } from "./embedded-language.js";
import type {
  MakeIdentifiersType,
  MakeIdentifiersHolderType,
} from "../utils.js";

// copied from https://github.com/microsoft/vscode/blob/267f09acea3b2416861661d702b3be767bdeef6e/extensions/javascript/package.json
const DEFAULT_IDENTIFIERS = [
  "js",
  "es",
  "es6",
  "mjs",
  "cjs",
  "pac",
  "javascript",
] as const;
type Identifiers = MakeIdentifiersType<typeof DEFAULT_IDENTIFIERS>;
type DefaultIdentifiersHolder = MakeIdentifiersHolderType<
  typeof DEFAULT_IDENTIFIERS
>;

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
  [embeddedLanguage]: {
    category: "Global",
    type: "string",
    array: true,
    default: [{ value: [...DEFAULT_IDENTIFIERS] }],
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
  interface EmbeddedDefaultIdentifiersHolder extends DefaultIdentifiersHolder {}
  interface PrettierPluginEmbedOptions {
    [embeddedLanguage]?: Identifiers;
    [EMBEDDED_ES_PARSER]?: EsParser;
  }
}

declare module "prettier" {
  export interface Options extends PrettierPluginDepsOptions {}
}
