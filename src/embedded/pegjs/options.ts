import type { SupportOptions } from "prettier";
import type { EsParser } from "../es/options.js";
import type { TsParser } from "../ts/options.js";
import {
  type AutocompleteStringList,
  type StringListToInterfaceKey,
  makeIdentifiersOptionName,
} from "../utils.js";
import { language } from "./language.js";

const DEFAULT_IDENTIFIERS = ["pegjs", "peggy", "peg"] as const;
type Identifiers = AutocompleteStringList<typeof DEFAULT_IDENTIFIERS>;
type DefaultIdentifiersHolder = StringListToInterfaceKey<
  typeof DEFAULT_IDENTIFIERS
>;

const EMBEDDED_LANGUAGE_IDENTIFIERS = makeIdentifiersOptionName(language);

export interface PrettierPluginDepsOptions {
  actionParser?: EsParser | TsParser;
}

export const options = {
  [EMBEDDED_LANGUAGE_IDENTIFIERS]: {
    category: "Embed",
    type: "string",
    array: true,
    default: [{ value: [...DEFAULT_IDENTIFIERS] }],
    description:
      "Tag or comment identifiers that make their subsequent template literals be identified as embedded Pegjs language. This option requires the `prettier-plugin-pegjs` plugin.",
  },
} as const satisfies SupportOptions;

type Options = typeof options;

declare module "../types.js" {
  interface EmbeddedOptions extends Options {}
  interface EmbeddedDefaultIdentifiersHolder extends DefaultIdentifiersHolder {}
  interface PrettierPluginEmbedOptions {
    [EMBEDDED_LANGUAGE_IDENTIFIERS]?: Identifiers;
  }
}

declare module "prettier" {
  interface Options extends PrettierPluginDepsOptions {}
}
