import type { SupportOptions } from "prettier";
import {
  makeIdentifiersOptionName,
  type AutocompleteStringList,
  type StringListToInterfaceKey,
} from "../utils.js";
import { language } from "./language.js";

const DEFAULT_IDENTIFIERS = ["pug", "jade"] as const;
type Identifiers = AutocompleteStringList<typeof DEFAULT_IDENTIFIERS>;
type DefaultIdentifiersHolder = StringListToInterfaceKey<
  typeof DEFAULT_IDENTIFIERS
>;

const EMBEDDED_LANGUAGE_IDENTIFIERS = makeIdentifiersOptionName(language);

/**
 * Location: node_modules/@prettier/plugin-pug/src/printer.ts
 */
export interface PrettierPluginDepsOptions {
  pugPrintWidth?: number;
  pugSingleQuote?: boolean;
  pugTabWidth?: number;
  pugUseTabs?: boolean;
  pugBracketSpacing?: boolean;
  pugArrowParens?: "avoid" | "always";
  pugSemi?: boolean;
  pugBracketSameLine?: boolean;

  pugAttributeSeparator?: "always" | "as-needed" | "none";
  pugCommentPreserveSpaces?: "keep-all" | "keep-leading" | "trim-all";
  pugSortAttributes?: "asc" | "desc" | "as-is";
  pugSortAttributesBeginning?: string[];
  pugSortAttributesEnd?: string[];
  pugWrapAttributesThreshold?: number;
  pugWrapAttributesPattern?: string;
  pugClassLocation?: "before-attributes" | "after-attributes";
  pugClassNotation?: "literal" | "attribute" | "as-is";
  pugIdNotation?: "literal" | "as-is";
  pugEmptyAttributes?: "as-is" | "none" | "all";
  pugEmptyAttributesForceQuotes?: "as-is" | "none" | "all";
  pugSingleFileComponentIndentation?: boolean;
  pugFramework?: "auto" | "vue" | "svelte" | "angular";
  pugExplicitDiv?: boolean;
  pugPreserveAttributeBrackets?: boolean;
}

export const options = {
  [EMBEDDED_LANGUAGE_IDENTIFIERS]: {
    category: "Embed",
    type: "string",
    array: true,
    default: [{ value: [...DEFAULT_IDENTIFIERS] }],
    description:
      "Tag or comment identifiers that make their subsequent template literals be identified as embedded Pug language. This option requires the `@prettier/plugin-pug` plugin.",
  },
} as const satisfies SupportOptions;

type Options = typeof options;

declare module "../types.js" {
  interface EmbeddedOptions extends Options {}
  interface EmbeddedDefaultIdentifiersHolder extends DefaultIdentifiersHolder {}
  interface PrettierPluginEmbedOptions {
    [EMBEDDED_LANGUAGE_IDENTIFIERS]?: Identifiers;
  }
}

declare module "prettier" {
  interface Options extends PrettierPluginDepsOptions {}
}
