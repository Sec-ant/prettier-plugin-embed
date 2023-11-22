import type { CoreCategoryType, SupportOptions } from "prettier";
import {
  makeIdentifiersOptionName,
  type AutocompleteStringList,
  type StringListToInterfaceKey,
} from "../utils.js";
import { embeddedLanguage } from "./embedded-language.js";

/** References:
 * - https://github.com/microsoft/vscode/blob/de0121cf0e05d1673903551b6dbb2871556bfae9/extensions/css/package.json#L22
 * - https://github.com/github-linguist/linguist/blob/7ca3799b8b5f1acde1dd7a8dfb7ae849d3dfb4cd/lib/linguist/languages.yml#L887
 */
const DEFAULT_IDENTIFIERS = ["css"] as const;
type Identifiers = AutocompleteStringList<typeof DEFAULT_IDENTIFIERS>;
type DefaultIdentifiersHolder = StringListToInterfaceKey<
  typeof DEFAULT_IDENTIFIERS
>;

const embeddedLanguageIdentifiersOptionName =
  makeIdentifiersOptionName(embeddedLanguage);

export interface PrettierPluginDepsOptions {
  /* prettier built-in options */
}

export const options = {
  [embeddedLanguageIdentifiersOptionName]: {
    category: "Global",
    type: "string",
    array: true,
    default: [{ value: [...DEFAULT_IDENTIFIERS] }],
    description: "Specify embedded CSS language identifiers.",
  },
} satisfies SupportOptions & Record<string, { category: CoreCategoryType }>;

type Options = typeof options;

declare module "../types.js" {
  interface EmbeddedOptions extends Options {}
  interface EmbeddedDefaultIdentifiersHolder extends DefaultIdentifiersHolder {}
  interface PrettierPluginEmbedOptions {
    [embeddedLanguageIdentifiersOptionName]?: Identifiers;
  }
}

declare module "prettier" {
  export interface Options extends PrettierPluginDepsOptions {}
}
