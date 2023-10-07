import type { SupportOptions, CoreCategoryType } from "prettier";
import {
  embeddedOptions,
  PrettierPluginEmbedOptions,
} from "./embedded/index.js";

export const options: SupportOptions = {
  ...embeddedOptions,
  noEmbeddedDetectionByComment: {
    category: "Global" satisfies CoreCategoryType,
    type: "string",
    array: true,
    default: [{ value: [] }],
    description:
      'This option turns off "/* lang */`...`" comment-based language detection for the specified languages.',
  },
  noEmbeddedDetectionByTag: {
    category: "Global" satisfies CoreCategoryType,
    type: "string",
    array: true,
    default: [{ value: [] }],
    description:
      'This option turns off "lang`...`" tag-based language detection for the specified languages.',
  },
};

declare module "./embedded/types.js" {
  interface PrettierPluginEmbedOptions {
    noEmbeddedDetectionByComment?: string[];
    noEmbeddedDetectionByTag?: string[];
  }
}

declare module "prettier" {
  interface Options extends PrettierPluginEmbedOptions {}
}

// TODO: add options to control multi-line indentation, tabWidth, leading & trailing whitespaces, etc.
