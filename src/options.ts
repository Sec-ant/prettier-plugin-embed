import type { SupportOptions, CoreCategoryType } from "prettier";
import { embedded } from "./embedded/index.js";

export const options: SupportOptions = {
  ...Object.fromEntries(
    Object.entries(embedded).map(
      ([name, { option }]) => [name, option] as const,
    ),
  ),
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

// TODO: add options to control multi-line indentation, tabWidth, leading & trailing whitespaces, etc.
