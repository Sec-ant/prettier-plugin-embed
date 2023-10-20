import type { CoreCategoryType, SupportOptions } from "prettier";
import { embeddedLanguage } from "./embedded-language.js";
import {
  type AutocompleteStringList,
  type StringListToInterfaceKey,
  makeIdentifiersOptionName,
} from "../utils.js";

/** References:
 * - https://github.com/microsoft/vscode/blob/de0121cf0e05d1673903551b6dbb2871556bfae9/extensions/xml/package.json#L15
 * - https://github.com/github-linguist/linguist/blob/7ca3799b8b5f1acde1dd7a8dfb7ae849d3dfb4cd/lib/linguist/languages.yml#L7712
 */
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
type Identifiers = AutocompleteStringList<typeof DEFAULT_IDENTIFIERS>;
type DefaultIdentifiersHolder = StringListToInterfaceKey<
  typeof DEFAULT_IDENTIFIERS
>;

const embeddedLanguageIdentifiers = makeIdentifiersOptionName(embeddedLanguage);

export interface PrettierPluginDepsOptions {
  xmlSelfClosingSpace?: boolean;
  xmlWhitespaceSensitivity?: "strict" | "preserve" | "ignore";
  xmlSortAttributesByKey?: boolean;
  xmlQuoteAttributes?: "preserve" | "single" | "double";
}

export const options = {
  [embeddedLanguageIdentifiers]: {
    category: "Global",
    type: "string",
    array: true,
    default: [{ value: [...DEFAULT_IDENTIFIERS] }],
    description:
      'Specify embedded XML language identifiers. This requires "@prettier/plugin-xml".',
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
    [embeddedLanguageIdentifiers]?: Identifiers;
    /** @internal */
    __embeddedXmlFragmentRecoverIndex?: [number] | [number, number];
  }
}

declare module "prettier" {
  export interface Options extends PrettierPluginDepsOptions {}
}
