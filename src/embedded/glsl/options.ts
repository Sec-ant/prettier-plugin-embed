import type { CoreCategoryType, SupportOptions } from "prettier";
import {
  makeIdentifiersOptionName,
  type AutocompleteStringList,
  type StringListToInterfaceKey,
} from "../utils.js";
import { embeddedLanguage } from "./embedded-language.js";

/** References:
 * - https://github.com/NaridaL/glsl-language-toolkit/blob/a7bd08d3f31355b335ae002b6a44c2999998b952/packages/prettier-plugin-glsl/src/prettier-plugin.ts#L88
 * - https://github.com/github-linguist/linguist/blob/7ca3799b8b5f1acde1dd7a8dfb7ae849d3dfb4cd/lib/linguist/languages.yml#L2180
 */
const DEFAULT_IDENTIFIERS = [
  "glsl",
  "fp",
  "frag",
  "frg",
  "fs",
  "fsh",
  "fshader",
  "geo",
  "geom",
  "glslf",
  "glslv",
  "gs",
  "gshader",
  "rchit",
  "rmiss",
  "shader",
  "tesc",
  "tese",
  "vert",
  "vrx",
  "vsh",
  "vshader",
] as const;
type Identifiers = AutocompleteStringList<typeof DEFAULT_IDENTIFIERS>;
type DefaultIdentifiersHolder = StringListToInterfaceKey<
  typeof DEFAULT_IDENTIFIERS
>;

const EMBEDDED_LANGUAGE_IDENTIFIERS =
  makeIdentifiersOptionName(embeddedLanguage);

export interface PrettierPluginDepsOptions {}

export const options = {
  [EMBEDDED_LANGUAGE_IDENTIFIERS]: {
    category: "Global",
    type: "string",
    array: true,
    default: [{ value: [...DEFAULT_IDENTIFIERS] }],
    description:
      'Specify embedded GLSL language identifiers. This requires "prettier-plugin-glsl".',
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
