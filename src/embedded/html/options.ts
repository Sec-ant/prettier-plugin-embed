import type { ChoiceSupportOption, SupportOptions } from "prettier";
import {
  type AutocompleteStringList,
  type StringListToInterfaceKey,
  fallbackIndicator,
  makeCommentsOptionName,
  makeIdentifiersOptionName,
  makeParserOptionName,
  makeTagsOptionName,
} from "../utils.js";
import { language } from "./language.js";

const DEFAULT_COMMENTS_OR_TAGS = ["html", "xhtml"] as const;

const DEFAULT_COMMENTS = DEFAULT_COMMENTS_OR_TAGS;
type Comments = AutocompleteStringList<(typeof DEFAULT_COMMENTS)[number]>;
type DefaultCommentsHolder = StringListToInterfaceKey<typeof DEFAULT_COMMENTS>;

const DEFAULT_TAGS = DEFAULT_COMMENTS_OR_TAGS;
type Tags = AutocompleteStringList<(typeof DEFAULT_TAGS)[number]>;
type DefaultTagsHolder = StringListToInterfaceKey<typeof DEFAULT_TAGS>;

const HTML_PARSERS = ["html", "vue", "angular", "lwc"] as const;
type HtmlParser = (typeof HTML_PARSERS)[number];

const EMBEDDED_LANGUAGE_IDENTIFIERS = makeIdentifiersOptionName(language);

const EMBEDDED_LANGUAGE_COMMENTS = makeCommentsOptionName(language);
const EMBEDDED_LANGUAGE_TAGS = makeTagsOptionName(language);
const EMBEDDED_LANGUAGE_PARSER = makeParserOptionName(language);

export const options = {
  [EMBEDDED_LANGUAGE_IDENTIFIERS]: {
    category: "Embed",
    type: "string",
    array: true,
    default: [{ value: [...DEFAULT_COMMENTS_OR_TAGS] }],
    description:
      "Tag or comment identifiers that make their subsequent template literals be identified as embedded HTML language.",
    deprecated: `Please use \`${EMBEDDED_LANGUAGE_COMMENTS}\` or \`${EMBEDDED_LANGUAGE_TAGS}\`.`,
  },
  [EMBEDDED_LANGUAGE_COMMENTS]: {
    category: "Embed",
    type: "string",
    array: true,
    default: [{ value: [fallbackIndicator] }],
    description:
      "Block comments that make their subsequent template literals be identified as embedded HTML language.",
  },
  [EMBEDDED_LANGUAGE_TAGS]: {
    category: "Embed",
    type: "string",
    array: true,
    default: [{ value: [fallbackIndicator] }],
    description:
      "Tags that make their subsequent template literals be identified as embedded HTML language.",
  },
  [EMBEDDED_LANGUAGE_PARSER]: {
    category: "Embed",
    type: "choice",
    default: "html",
    description: "The parser used to parse the embedded HTML language.",
    choices: HTML_PARSERS.map((parser) => ({
      value: parser,
      description: `Use the "${parser}" parser.`,
    })),
  } satisfies ChoiceSupportOption<HtmlParser>,
} as const satisfies SupportOptions;

type Options = typeof options;

declare module "../types.js" {
  interface EmbeddedOptions extends Options {}
  interface EmbeddedDefaultCommentsHolder extends DefaultCommentsHolder {}
  interface EmbeddedDefaultTagsHolder extends DefaultTagsHolder {}
  interface PluginEmbedOptions {
    /**
     * @deprecated Please use `embeddedHtmlComments` or `embeddedHtmlTags`.
     */
    [EMBEDDED_LANGUAGE_IDENTIFIERS]?: (Comments[number] | Tags[number])[];
    [EMBEDDED_LANGUAGE_COMMENTS]?: Comments;
    [EMBEDDED_LANGUAGE_TAGS]?: Tags;
    [EMBEDDED_LANGUAGE_PARSER]?: HtmlParser;
  }
}
