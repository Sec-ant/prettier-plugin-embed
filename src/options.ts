import type { SupportOptions } from "prettier";
import {
  type EmbeddedComment,
  type EmbeddedTag,
  embeddedOptions,
} from "./embedded/index.js";

type EmbeddedCommentsOrTags = (EmbeddedComment | EmbeddedTag)[];

// biome-ignore format: no line break
const NO_EMBEDDED_IDENTIFICATION_BY_COMMENT = "noEmbeddedIdentificationByComment";
// biome-ignore format: no line break
const NO_EMBEDDED_IDENTIFICATION_BY_TAG = "noEmbeddedIdentificationByTag";
// biome-ignore format: no line break
const PRESERVE_EMBEDDED_EXTERIOR_WHITESPACES = "preserveEmbeddedExteriorWhitespaces";
// biome-ignore format: no line break
const NO_EMBEDDED_MULTI_LINE_INDENTATION = "noEmbeddedMultiLineIndentation";
const EMBEDDED_OVERRIDES = "embeddedOverrides";

export const options = {
  ...embeddedOptions,
  /**
   * @deprecated Please use `embedded<Language>Comments` or `embedded<Language>Tags` to configure each embedded language, and you won't need this option anymore.
   */
  [NO_EMBEDDED_IDENTIFICATION_BY_COMMENT]: {
    category: "Embed",
    type: "string",
    array: true,
    default: [{ value: [] }],
    description:
      "Turns off `` /* comment */ `...` `` comment-based embedded language identification for the specified identifiers.",
    deprecated:
      "Please use `embedded<Language>Comments` or `embedded<Language>Tags` to configure each embedded language, and you won't need this option anymore.",
  },
  /**
   * @deprecated Please use `embedded<Language>Comments` or `embedded<Language>Tags` to configure each embedded language, and you won't need this option anymore.
   */
  [NO_EMBEDDED_IDENTIFICATION_BY_TAG]: {
    category: "Embed",
    type: "string",
    array: true,
    default: [{ value: [] }],
    description:
      "Turns off `` tag`...` `` tag-based embedded language identification for the specified identifiers.",
    deprecated:
      "Please use `embedded<Language>Comments` or `embedded<Language>Tags` to configure each embedded language, and you won't need this option anymore.",
  },
  [PRESERVE_EMBEDDED_EXTERIOR_WHITESPACES]: {
    category: "Embed",
    type: "string",
    array: true,
    default: [{ value: [] }],
    description:
      "Preserves leading and trailing whitespaces in the formatting results for the specified comments or tags.",
  },
  [NO_EMBEDDED_MULTI_LINE_INDENTATION]: {
    category: "Embed",
    type: "string",
    array: true,
    default: [{ value: [] }],
    description:
      "Turns off auto indentation in the formatting results for the specified comments or tags when they are formatted to span multi lines.",
  },
  [EMBEDDED_OVERRIDES]: {
    category: "Embed",
    type: "string",
    array: false,
    default: undefined,
    description:
      "Option overrides for the specified comments or tags. It should either be a stringified JSON or an absolute filepath to the option overrides file.",
  },
} as const satisfies SupportOptions;

export interface PluginEmbedLanguageAgnosticOptions {
  /**
   * @deprecated Please use `embedded<Language>Comments` or `embedded<Language>Tags` to configure each embedded language, and you won't need this option anymore.
   */
  [NO_EMBEDDED_IDENTIFICATION_BY_COMMENT]?: EmbeddedCommentsOrTags;
  /**
   * @deprecated Please use `embedded<Language>Comments` or `embedded<Language>Tags` to configure each embedded language, and you won't need this option anymore.
   */
  [NO_EMBEDDED_IDENTIFICATION_BY_TAG]?: EmbeddedCommentsOrTags;
  [PRESERVE_EMBEDDED_EXTERIOR_WHITESPACES]?: EmbeddedCommentsOrTags;
  [NO_EMBEDDED_MULTI_LINE_INDENTATION]?: EmbeddedCommentsOrTags;
  [EMBEDDED_OVERRIDES]?: string;
}

declare module "./embedded/types.js" {
  interface PluginEmbedOptions extends PluginEmbedLanguageAgnosticOptions {}
}
