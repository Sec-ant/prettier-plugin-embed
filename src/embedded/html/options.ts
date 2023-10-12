import type { CoreCategoryType, SupportOptions } from "prettier";
import { name } from "./name.js";
import type { MakeOptionLangType, MakeLangsHolderType } from "../utils.js";

// copied from https://github.com/microsoft/vscode/blob/6a7a661757dec1983ff05ef908a2bbb75ce841e0/extensions/html/package.json
const DEFAULT_LANGS = [
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
type OptionLang = MakeOptionLangType<typeof DEFAULT_LANGS>;
type DefaultLangsHolder = MakeLangsHolderType<typeof DEFAULT_LANGS>;

export interface PrettierPluginDepsOptions {
  /* prettier built-in options */
}

export const options = {
  [name]: {
    category: "Global",
    type: "string",
    array: true,
    default: [{ value: [...DEFAULT_LANGS] }],
    description: "Specify embedded HTML languages.",
  },
} satisfies SupportOptions & Record<string, { category: CoreCategoryType }>;

type Options = typeof options;

declare module "../types.js" {
  interface EmbeddedOptions extends Options {}
  interface EmbeddedDefaultLangsHolder extends DefaultLangsHolder {}
  interface PrettierPluginEmbedOptions {
    [name]?: OptionLang;
  }
}

declare module "prettier" {
  export interface Options extends PrettierPluginDepsOptions {}
}
