import type { CoreCategoryType, SupportOptions } from "prettier";
import type { SqlBaseOptions as PrettierPluginDepsOptions } from "prettier-plugin-sql";
import {
  makeIdentifiersOptionName,
  type AutocompleteStringList,
  type StringListToInterfaceKey,
} from "../utils.js";
import { embeddedLanguage } from "./embedded-language.js";

/** References
 * - https://github.com/un-ts/prettier/blob/master/packages/sql/src/index.ts
 * "sql" is the default dialect, so we only have "sql" as the default identifier to avoid confusion.
 */
const DEFAULT_IDENTIFIERS = ["sql"] as const;

type Identifiers = AutocompleteStringList<typeof DEFAULT_IDENTIFIERS>;
type DefaultIdentifiersHolder = StringListToInterfaceKey<
  typeof DEFAULT_IDENTIFIERS
>;

const EMBEDDED_LANGUAGE_IDENTIFIERS =
  makeIdentifiersOptionName(embeddedLanguage);

export { PrettierPluginDepsOptions };

export const options = {
  [EMBEDDED_LANGUAGE_IDENTIFIERS]: {
    category: "Global",
    type: "string",
    array: true,
    default: [{ value: [...DEFAULT_IDENTIFIERS] }],
    description:
      'Specify embedded SQL language identifiers. This requires "prettier-plugin-sql".',
  },
} satisfies SupportOptions & Record<string, { category: CoreCategoryType }>;

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
