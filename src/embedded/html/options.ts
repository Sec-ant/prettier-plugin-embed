import type { CoreCategoryType, SupportOptions } from "prettier";
import { embeddedLanguage } from "./embedded-language.js";
import type {
  AutocompleteStringList,
  StringListToInterfaceKey,
} from "../utils.js";

// copied from https://github.com/microsoft/vscode/blob/6a7a661757dec1983ff05ef908a2bbb75ce841e0/extensions/html/package.json
const DEFAULT_IDENTIFIERS = [
  "html",
  "htm",
  "shtml",
  "xhtml",
  "xht",
  "mdoc",
  "jsp",
  "asp",
  "aspx",
  "jshtm",
  "volt",
  "rhtml",
] as const;
type Identifiers = AutocompleteStringList<typeof DEFAULT_IDENTIFIERS>;
type DefaultIdentifiersHolder = StringListToInterfaceKey<
  typeof DEFAULT_IDENTIFIERS
>;

export interface PrettierPluginDepsOptions {
  /* prettier built-in options */
}

export const options = {
  [embeddedLanguage]: {
    category: "Global",
    type: "string",
    array: true,
    default: [{ value: [...DEFAULT_IDENTIFIERS] }],
    description: "Specify embedded HTML languages.",
  },
} satisfies SupportOptions & Record<string, { category: CoreCategoryType }>;

type Options = typeof options;

declare module "../types.js" {
  interface EmbeddedOptions extends Options {}
  interface EmbeddedDefaultIdentifiersHolder extends DefaultIdentifiersHolder {}
  interface PrettierPluginEmbedOptions {
    [embeddedLanguage]?: Identifiers;
  }
}

declare module "prettier" {
  export interface Options extends PrettierPluginDepsOptions {}
}
