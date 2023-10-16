import type { CoreCategoryType, SupportOptions } from "prettier";
import { embeddedLanguage } from "./embedded-language.js";
import type {
  MakeIdentifiersType,
  MakeIdentifiersHolderType,
} from "../utils.js";

// copied from https://github.com/microsoft/vscode/blob/267f09acea3b2416861661d702b3be767bdeef6e/extensions/typescript-basics/package.json
const DEFAULT_IDENTIFIERS = ["ts", "cts", "mts", "typescript"] as const;
type Identifiers = MakeIdentifiersType<typeof DEFAULT_IDENTIFIERS>;
type DefaultIdentifiersHolder = MakeIdentifiersHolderType<
  typeof DEFAULT_IDENTIFIERS
>;

// TODO: keep in sync with prettier somehow
const DEFAULT_TS_PARSERS = ["typescript", "babel-ts"] as const;

type TsParser = (typeof DEFAULT_TS_PARSERS)[number];

const EMBEDDED_TS_PARSER = "embeddedTsParser";

export interface PrettierPluginDepsOptions {
  /* prettier built-in options */
}

export const options = {
  [embeddedLanguage]: {
    category: "Global",
    type: "string",
    array: true,
    default: [{ value: [...DEFAULT_IDENTIFIERS] }],
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
  interface EmbeddedDefaultIdentifiersHolder extends DefaultIdentifiersHolder {}
  interface PrettierPluginEmbedOptions {
    [embeddedLanguage]?: Identifiers;
    [EMBEDDED_TS_PARSER]?: TsParser;
  }
}

declare module "prettier" {
  export interface Options extends PrettierPluginDepsOptions {}
}
