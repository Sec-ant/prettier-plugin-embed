import type { SupportOptions } from "prettier";
import {
  embeddedOptions,
  type AutocompleteStringList,
  type EmbeddedDefaultIdentifier,
  type PrettierPluginEmbedOptions,
} from "./embedded/index.js";

type EmbeddedIdentifiers = AutocompleteStringList<EmbeddedDefaultIdentifier[]>;

const NO_EMBEDDED_IDENTIFICATION_BY_COMMENT =
  "noEmbeddedIdentificationByComment";
const NO_EMBEDDED_IDENTIFICATION_BY_TAG = "noEmbeddedIdentificationByTag";
const PRESERVE_EMBEDDED_EXTERIOR_WHITESPACES =
  "preserveEmbeddedExteriorWhitespaces";
const NO_EMBEDDED_MULTI_LINE_INDENTATION = "noEmbeddedMultiLineIndentation";
const EMBEDDED_OVERRIDES = "embeddedOverrides";

export const options = {
  ...embeddedOptions,
  [NO_EMBEDDED_IDENTIFICATION_BY_COMMENT]: {
    category: "Embed",
    type: "string",
    array: true,
    default: [{ value: [] }],
    description:
      'This option turns off "/* identifier */ `...`" comment-based language identification for the specified identifiers.',
  },
  [NO_EMBEDDED_IDENTIFICATION_BY_TAG]: {
    category: "Embed",
    type: "string",
    array: true,
    default: [{ value: [] }],
    description:
      'This option turns off "identifier`...`" tag-based language identification for the specified identifiers.',
  },
  [PRESERVE_EMBEDDED_EXTERIOR_WHITESPACES]: {
    category: "Config",
    type: "string",
    array: true,
    default: [{ value: [] }],
    description:
      "This option preserves leading and trailing whitespaces in the formatting results for the specified identifiers.",
  },
  [NO_EMBEDDED_MULTI_LINE_INDENTATION]: {
    category: "Embed",
    type: "string",
    array: true,
    default: [{ value: [] }],
    description:
      "This option turns off auto indentation in the formatting results for the specified identifiers when they are formatted to span multi lines.",
  },
  [EMBEDDED_OVERRIDES]: {
    category: "Embed",
    type: "string",
    array: false,
    default: undefined,
    description:
      "This option accepts option overrides for the specified identifiers. It should either be a stringified JSON or an absolute filepath to the option overrides file.",
  },
} as const satisfies SupportOptions;

export interface PrettierPluginGlobalOptions {
  [NO_EMBEDDED_IDENTIFICATION_BY_COMMENT]?: EmbeddedIdentifiers;
  [NO_EMBEDDED_IDENTIFICATION_BY_TAG]?: EmbeddedIdentifiers;
  [PRESERVE_EMBEDDED_EXTERIOR_WHITESPACES]?: EmbeddedIdentifiers;
  [NO_EMBEDDED_MULTI_LINE_INDENTATION]?: EmbeddedIdentifiers;
  [EMBEDDED_OVERRIDES]?: string;
}

declare module "./embedded/types.js" {
  interface PrettierPluginEmbedOptions extends PrettierPluginGlobalOptions {}
}

declare module "prettier" {
  interface Options extends PrettierPluginEmbedOptions {}
}
