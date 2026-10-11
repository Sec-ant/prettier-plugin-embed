import type { SupportOptions } from "prettier";
import {
  type AutocompleteStringList,
  makeCommentsOptionName,
  makeTagsOptionName,
  type StringListToInterfaceKey,
} from "../utils.js";
import { language } from "./language.js";

const DEFAULT_COMMENTS_OR_TAGS = ["xquery", "xq"] as const;
type CommentsOrTags = AutocompleteStringList<
  (typeof DEFAULT_COMMENTS_OR_TAGS)[number]
>;
type Defaults = StringListToInterfaceKey<typeof DEFAULT_COMMENTS_OR_TAGS>;

const EMBEDDED_LANGUAGE_COMMENTS = makeCommentsOptionName(language);
const EMBEDDED_LANGUAGE_TAGS = makeTagsOptionName(language);

const EMBEDDED_LANGUAGE_PARSER = `${language}Parser` as const;

export const options = {
  [EMBEDDED_LANGUAGE_COMMENTS]: {
    category: "Embed",
    type: "string",
    array: true,
    default: [{ value: [...DEFAULT_COMMENTS_OR_TAGS] }],
    description:
      "Block comments that identify embedded XQuery in template literals. Requires the `prettier-plugin-xquery` plugin.",
  },
  [EMBEDDED_LANGUAGE_TAGS]: {
    category: "Embed",
    type: "string",
    array: true,
    default: [{ value: [...DEFAULT_COMMENTS_OR_TAGS] }],
    description:
      "Tags that identify embedded XQuery in template literals. Requires the `prettier-plugin-xquery` plugin.",
  },
  [EMBEDDED_LANGUAGE_PARSER]: {
    category: "Embed",
    type: "choice",
    default: "xquery",
    description: "The parser used to format embedded XQuery.",
    choices: [
      { value: "xquery", description: "Use the `xquery` parser." },
      { value: "xquery4", description: "Use the `xquery4` parser." },
    ],
  },
} as const satisfies SupportOptions;

type Options = typeof options;

declare module "../types.js" {
  interface EmbeddedOptions extends Options {}
  interface EmbeddedDefaultCommentsHolder extends Defaults {}
  interface EmbeddedDefaultTagsHolder extends Defaults {}
  interface PluginEmbedOptions {
    [EMBEDDED_LANGUAGE_COMMENTS]?: CommentsOrTags;
    [EMBEDDED_LANGUAGE_TAGS]?: CommentsOrTags;
    [EMBEDDED_LANGUAGE_PARSER]?: "xquery" | "xquery4";
  }
}
