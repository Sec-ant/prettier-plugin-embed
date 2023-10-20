import type { CoreCategoryType, SupportOptions } from "prettier";
import { embeddedLanguage } from "./embedded-language.js";
import {
  type AutocompleteStringList,
  type StringListToInterfaceKey,
  makeIdentifiersOptionName,
} from "../utils.js";

// copied from https://github.com/NaridaL/glsl-language-toolkit/blob/a7bd08d3f31355b335ae002b6a44c2999998b952/packages/prettier-plugin-glsl/src/prettier-plugin.ts
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

const embeddedLanguageIdentifiers = makeIdentifiersOptionName(embeddedLanguage);

export interface PrettierPluginDepsOptions {}

export const options = {
  [embeddedLanguageIdentifiers]: {
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
    [embeddedLanguageIdentifiers]?: Identifiers;
  }
}

declare module "prettier" {
  export interface Options extends PrettierPluginDepsOptions {}
}
