import type { SupportOptions } from "prettier";
import type { NginxOptions } from "prettier-plugin-nginx";
import {
  type AutocompleteStringList,
  type StringListToInterfaceKey,
  type UnionToIntersection,
  makeIdentifiersOptionName,
} from "../utils.js";
import { language } from "./language.js";

const DEFAULT_IDENTIFIERS = ["nginx"] as const;
type Identifiers = AutocompleteStringList<typeof DEFAULT_IDENTIFIERS>;
type DefaultIdentifiersHolder = StringListToInterfaceKey<
  typeof DEFAULT_IDENTIFIERS
>;

const EMBEDDED_LANGUAGE_IDENTIFIERS = makeIdentifiersOptionName(language);

export interface PrettierPluginDepsOptions
  extends Partial<UnionToIntersection<NginxOptions>> {}

export const options = {
  [EMBEDDED_LANGUAGE_IDENTIFIERS]: {
    category: "Embed",
    type: "string",
    array: true,
    default: [{ value: [...DEFAULT_IDENTIFIERS] }],
    description:
      "Tag or comment identifiers that make their subsequent template literals be identified as embedded NGINX language. This option requires the `prettier-plugin-nginx` plugin.",
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
