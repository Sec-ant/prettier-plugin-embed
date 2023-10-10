import type { CoreCategoryType, SupportOptions } from "prettier";
import { name } from "./name.js";
import type { MakeOptionLangType, MakeLangsHolderType } from "../utils.js";

// copied from https://raw.githubusercontent.com/microsoft/vscode/main/extensions/xml/package.json
const DEFAULT_LANGS = [
  "xml",
  "xsd",
  "ascx",
  "atom",
  "axml",
  "axaml",
  "bpmn",
  "cpt",
  "csl",
  "csproj",
  "dita",
  "ditamap",
  "dtd",
  "ent",
  "mod",
  "dtml",
  "fsproj",
  "fxml",
  "iml",
  "isml",
  "jmx",
  "launch",
  "menu",
  "mxml",
  "nuspec",
  "opml",
  "owl",
  "proj",
  "props",
  "pt",
  "publishsettings",
  "pubxml",
  "rbxlx",
  "rbxmx",
  "rdf",
  "rng",
  "rss",
  "shproj",
  "storyboard",
  "svg",
  "targets",
  "tld",
  "tmx",
  "vbproj",
  "vcxproj",
  "wsdl",
  "wxi",
  "wxl",
  "wxs",
  "xaml",
  "xbl",
  "xib",
  "xlf",
  "xliff",
  "xpdl",
  "xul",
  "xoml",
] as const;
type OptionLang = MakeOptionLangType<typeof DEFAULT_LANGS>;
type DefaultLangsHolder = MakeLangsHolderType<typeof DEFAULT_LANGS>;

export interface PrettierPluginDepsOptions {
  xmlSelfClosingSpace?: boolean;
  xmlWhitespaceSensitivity?: "strict" | "preserve" | "ignore";
  xmlSortAttributesByKey?: boolean;
  xmlQuoteAttributes?: "preserve" | "single" | "double";
}

export const options = {
  [name]: {
    category: "Global",
    type: "string",
    array: true,
    default: [{ value: [...DEFAULT_LANGS] }],
    description:
      "Specify embedded XML languages. This requires @prettier/plugin-xml",
  },
  /** @internal */
  __embeddedXmlFragmentRecoverIndex: {
    category: "Global",
    type: "int",
    array: true,
    default: [{ value: [] }],
    description:
      "This option is read only and used as a workaround to support xml fragments",
  },
} satisfies SupportOptions & Record<string, { category: CoreCategoryType }>;

type Options = typeof options;

declare module "../types.js" {
  interface EmbeddedOptions extends Options {}
  interface EmbeddedDefaultLangsHolder extends DefaultLangsHolder {}
  interface PrettierPluginEmbedOptions {
    [name]?: OptionLang;
    /** @internal */
    __embeddedXmlFragmentRecoverIndex?: [number] | [number, number];
  }
}

declare module "prettier" {
  export interface Options extends PrettierPluginDepsOptions {}
}
