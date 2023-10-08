import type { SupportOptions, CoreCategoryType } from "prettier";
import {
  embeddedOptions,
  PrettierPluginEmbedOptions,
} from "./embedded/index.js";

const NO_EMBEDDED_DETECTION_BY_COMMENT = "noEmbeddedDetectionByComment";
const NO_EMBEDDED_DETECTION_BY_TAG = "noEmbeddedDetectionByTag";
const NO_EMBEDDED_MULTILINE_INDENTATION = "noEmbeddedMultilineIndentation";

export const options: SupportOptions = {
  ...embeddedOptions,
  [NO_EMBEDDED_DETECTION_BY_COMMENT]: {
    category: "Global" satisfies CoreCategoryType,
    type: "string",
    array: true,
    default: [{ value: [] }],
    description:
      'This option turns off "/* lang */`...`" comment-based language detection for the specified languages.',
  },
  [NO_EMBEDDED_DETECTION_BY_TAG]: {
    category: "Global" satisfies CoreCategoryType,
    type: "string",
    array: true,
    default: [{ value: [] }],
    description:
      'This option turns off "lang`...`" tag-based language detection for the specified languages.',
  },
  // TODO: not implemented yet
  [NO_EMBEDDED_MULTILINE_INDENTATION]: {
    category: "Global" satisfies CoreCategoryType,
    type: "string",
    array: true,
    default: [{ value: [] }],
    description:
      "This option turns off auto indentation for the specified languages when they are formatted to span multilines.",
  },
};

declare module "./embedded/types.js" {
  interface PrettierPluginEmbedOptions {
    [NO_EMBEDDED_DETECTION_BY_COMMENT]?: string[];
    [NO_EMBEDDED_DETECTION_BY_TAG]?: string[];
    [NO_EMBEDDED_MULTILINE_INDENTATION]?: string[];
  }
}

declare module "prettier" {
  interface Options extends PrettierPluginEmbedOptions {}
}

// TODO: add options to control multi-line indentation, tabWidth, leading & trailing whitespaces, etc.
