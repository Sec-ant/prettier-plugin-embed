import type { SupportOptions, CoreCategoryType } from "prettier";
import { embeddedOptions } from "./embedded/index.js";

export const options: SupportOptions = {
  ...embeddedOptions,
  disableEmbeddedDetectionByComment: {
    category: "Global" satisfies CoreCategoryType,
    type: "string",
    array: true,
    default: [{ value: [] }],
    description:
      'This option turns off "/* lang */`...`" comment-based language detection for the specified languages.',
  },
  disableEmbeddedDetectionByTag: {
    category: "Global" satisfies CoreCategoryType,
    type: "string",
    array: true,
    default: [{ value: [] }],
    description:
      'This option turns off "lang`...`" tag-based language detection for the specified languages.',
  },
};

declare module "prettier" {
  interface Options {
    disableEmbeddedDetectionByComment?: string[];
    disableEmbeddedDetectionByTag?: string[];
  }
}

// TODO: add options to control multi-line indentation, tabWidth, leading & trailing whitespaces, etc.
