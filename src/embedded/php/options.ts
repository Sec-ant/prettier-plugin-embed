import type { SupportOptions } from "prettier";
import {
  makeIdentifiersOptionName,
  type AutocompleteStringList,
  type StringListToInterfaceKey,
} from "../utils.js";
import { language } from "./language.js";

/**
 * References
 *
 * - https://github.com/microsoft/vscode/blob/de0121cf0e05d1673903551b6dbb2871556bfae9/extensions/php/package.json#L15
 * - https://github.com/github-linguist/linguist/blob/7ca3799b8b5f1acde1dd7a8dfb7ae849d3dfb4cd/lib/linguist/languages.yml#L4971
 */
const DEFAULT_IDENTIFIERS = ["php", "php5"] as const;
type Identifiers = AutocompleteStringList<typeof DEFAULT_IDENTIFIERS>;
type DefaultIdentifiersHolder = StringListToInterfaceKey<
  typeof DEFAULT_IDENTIFIERS
>;

const EMBEDDED_LANGUAGE_IDENTIFIERS = makeIdentifiersOptionName(language);

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

export const options = {
  [EMBEDDED_LANGUAGE_IDENTIFIERS]: {
    category: "Embed",
    type: "string",
    array: true,
    default: [{ value: [...DEFAULT_IDENTIFIERS] }],
    description:
      'Specify embedded PHP language identifiers. This requires "@prettier/plugin-php".',
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
  export interface Options extends PrettierPluginDepsOptions {}
}
