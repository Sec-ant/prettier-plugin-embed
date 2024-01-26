import type { SupportOptions } from "prettier";
import {
  type AutocompleteStringList,
  type StringListToInterfaceKey,
  makeCommentsOptionName,
  makeIdentifiersOptionName,
  makeTagsOptionName,
} from "../utils.js";
import { language } from "./language.js";

const DEFAULT_COMMENTS_OR_TAGS = ["xml", "opml", "rss", "svg"] as const;

const DEFAULT_COMMENTS = DEFAULT_COMMENTS_OR_TAGS;
type Comments = AutocompleteStringList<(typeof DEFAULT_COMMENTS)[number]>;
type DefaultCommentsHolder = StringListToInterfaceKey<typeof DEFAULT_COMMENTS>;

const DEFAULT_TAGS = DEFAULT_COMMENTS_OR_TAGS;
type Tags = AutocompleteStringList<(typeof DEFAULT_TAGS)[number]>;
type DefaultTagsHolder = StringListToInterfaceKey<typeof DEFAULT_TAGS>;

const EMBEDDED_LANGUAGE_IDENTIFIERS = makeIdentifiersOptionName(language);

const EMBEDDED_LANGUAGE_COMMENTS = makeCommentsOptionName(language);
const EMBEDDED_LANGUAGE_TAGS = makeTagsOptionName(language);

export const options = {
  [EMBEDDED_LANGUAGE_IDENTIFIERS]: {
    category: "Embed",
    type: "string",
    array: true,
    default: [{ value: [...DEFAULT_COMMENTS_OR_TAGS] }],
    description:
      "Tag or comment identifiers that make their subsequent template literals be identified as embedded XML language. This option requires the `@prettier/plugin-xml` plugin.",
    deprecated: `Please use \`${EMBEDDED_LANGUAGE_COMMENTS}\` or \`${EMBEDDED_LANGUAGE_TAGS}\`.`,
  },
  [EMBEDDED_LANGUAGE_COMMENTS]: {
    category: "Embed",
    type: "string",
    array: true,
    default: [{ value: [] }],
    description:
      "Block comments that make their subsequent template literals be identified as embedded XML language. This option requires the `@prettier/plugin-xml` plugin.",
  },
  [EMBEDDED_LANGUAGE_TAGS]: {
    category: "Embed",
    type: "string",
    array: true,
    default: [{ value: [] }],
    description:
      "Tags that make their subsequent template literals be identified as embedded XML language. This option requires the `@prettier/plugin-xml` plugin.",
  },
  /**
   * @internal
   */
  __embeddedXmlFragmentRecoverIndex: {
    category: "Embed",
    type: "int",
    array: true,
    default: [{ value: [] }],
    description:
      "This option is read only and is used internally as a workaround to support xml fragments",
  },
} as const satisfies SupportOptions;

type Options = typeof options;

declare module "../types.js" {
  interface EmbeddedOptions extends Options {}
  interface EmbeddedDefaultCommentsHolder extends DefaultCommentsHolder {}
  interface EmbeddedDefaultTagsHolder extends DefaultTagsHolder {}
  interface PluginEmbedOptions {
    /**
     * @deprecated Please use `embeddedXmlComments` or `embeddedXmlTags`.
     */
    [EMBEDDED_LANGUAGE_IDENTIFIERS]?: (Comments[number] | Tags[number])[];
    [EMBEDDED_LANGUAGE_COMMENTS]?: Comments;
    [EMBEDDED_LANGUAGE_TAGS]?: Tags;
    /**
     * @internal
     */
    __embeddedXmlFragmentRecoverIndex?: [number] | [number, number];
  }
}
