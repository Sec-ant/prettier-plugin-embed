import type { CoreCategoryType, SupportOptions } from "prettier";
import { embeddedLanguage } from "./embedded-language.js";
import {
  type AutocompleteStringList,
  type StringListToInterfaceKey,
  makeIdentifiersOptionName,
} from "../utils.js";

// copied from https://github.com/microsoft/vscode/blob/267f09acea3b2416861661d702b3be767bdeef6e/extensions/typescript-basics/package.json
const DEFAULT_IDENTIFIERS = ["ts", "cts", "mts", "typescript"] as const;
type Identifiers = AutocompleteStringList<typeof DEFAULT_IDENTIFIERS>;
type DefaultIdentifiersHolder = StringListToInterfaceKey<
  typeof DEFAULT_IDENTIFIERS
>;

// TODO: keep in sync with prettier somehow
const DEFAULT_TS_PARSERS = ["typescript", "babel-ts"] as const;

type TsParser = (typeof DEFAULT_TS_PARSERS)[number];

const EMBEDDED_LANGUAGE_PARSER = "embeddedTsParser";

const embeddedLanguageIdentifiers = makeIdentifiersOptionName(embeddedLanguage);

export interface PrettierPluginDepsOptions {
  /* prettier built-in options */
}

export const options = {
  [embeddedLanguageIdentifiers]: {
    category: "Global",
    type: "string",
    array: true,
    default: [{ value: [...DEFAULT_IDENTIFIERS] }],
    description: "Specify embedded TS language parsers.",
  },
  [EMBEDDED_LANGUAGE_PARSER]: {
    category: "Global",
    type: "string",
    array: false,
    default: "typescript" satisfies TsParser,
    description: "Specify the embedded TS language parser.",
  },
} satisfies SupportOptions & Record<string, { category: CoreCategoryType }>;

type Options = typeof options;

declare module "../types.js" {
  interface EmbeddedOptions extends Options {}
  interface EmbeddedDefaultIdentifiersHolder extends DefaultIdentifiersHolder {}
  interface PrettierPluginEmbedOptions {
    [embeddedLanguageIdentifiers]?: Identifiers;
    [EMBEDDED_LANGUAGE_PARSER]?: TsParser;
  }
}

declare module "prettier" {
  export interface Options extends PrettierPluginDepsOptions {}
}
