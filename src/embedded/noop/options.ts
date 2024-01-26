import type { SupportOptions } from "prettier";
import type { EmbeddedDefaultComment, EmbeddedDefaultTag } from "../types.js";
import {
  type AutocompleteStringList,
  makeCommentsOptionName,
  makeIdentifiersOptionName,
  makeTagsOptionName,
} from "../utils.js";
import { language } from "./language.js";

type EmbeddedCommentsOrTags = AutocompleteStringList<
  EmbeddedDefaultComment | EmbeddedDefaultTag
>;

const EMBEDDED_LANGUAGE_IDENTIFIERS = makeIdentifiersOptionName(language);

const EMBEDDED_LANGUAGE_COMMENTS = makeCommentsOptionName(language);
const EMBEDDED_LANGUAGE_TAGS = makeTagsOptionName(language);

export const options = {
  [EMBEDDED_LANGUAGE_IDENTIFIERS]: {
    category: "Embed",
    type: "string",
    array: true,
    default: [{ value: [] }],
    description:
      "Tag or comment identifiers that prevent their subsequent template literals from being identified as embedded languages and thus from being formatted.",
    deprecated: `Please use \`${EMBEDDED_LANGUAGE_COMMENTS}\` or \`${EMBEDDED_LANGUAGE_TAGS}\`.`,
  },
  [EMBEDDED_LANGUAGE_COMMENTS]: {
    category: "Embed",
    type: "string",
    array: true,
    default: [{ value: [] }],
    description:
      "Block comments that prevent their subsequent template literals from being identified as embedded languages and thus from being formatted.",
  },
  [EMBEDDED_LANGUAGE_TAGS]: {
    category: "Embed",
    type: "string",
    array: true,
    default: [{ value: [] }],
    description:
      "Tags that prevent their subsequent template literals from being identified as embedded languages and thus from being formatted.",
  },
} as const satisfies SupportOptions;

type Options = typeof options;

declare module "../types.js" {
  interface EmbeddedOptions extends Options {}
  interface PluginEmbedOptions {
    /**
     * @deprecated Please use `embeddedNoopComments` or `embeddedNoopTags`.
     */
    [EMBEDDED_LANGUAGE_IDENTIFIERS]?: EmbeddedCommentsOrTags;
    [EMBEDDED_LANGUAGE_COMMENTS]?: EmbeddedCommentsOrTags;
    [EMBEDDED_LANGUAGE_TAGS]?: EmbeddedCommentsOrTags;
  }
}
