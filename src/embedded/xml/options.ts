import type { CoreCategoryType, SupportOptions } from "prettier";
import { embeddedLanguage } from "./embedded-language.js";
import type {
  MakeIdentifiersType,
  MakeIdentifiersHolderType,
} from "../utils.js";

// copied from https://github.com/microsoft/vscode/blob/6a7a661757dec1983ff05ef908a2bbb75ce841e0/extensions/xml/package.json
const DEFAULT_IDENTIFIERS = [
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
type Identifiers = MakeIdentifiersType<typeof DEFAULT_IDENTIFIERS>;
type DefaultIdentifiersHolder = MakeIdentifiersHolderType<
  typeof DEFAULT_IDENTIFIERS
>;

export interface PrettierPluginDepsOptions {
  xmlSelfClosingSpace?: boolean;
  xmlWhitespaceSensitivity?: "strict" | "preserve" | "ignore";
  xmlSortAttributesByKey?: boolean;
  xmlQuoteAttributes?: "preserve" | "single" | "double";
}

export const options = {
  [embeddedLanguage]: {
    category: "Global",
    type: "string",
    array: true,
    default: [{ value: [...DEFAULT_IDENTIFIERS] }],
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
  interface EmbeddedDefaultIdentifiersHolder extends DefaultIdentifiersHolder {}
  interface PrettierPluginEmbedOptions {
    [embeddedLanguage]?: Identifiers;
    /** @internal */
    __embeddedXmlFragmentRecoverIndex?: [number] | [number, number];
  }
}

declare module "prettier" {
  export interface Options extends PrettierPluginDepsOptions {}
}
