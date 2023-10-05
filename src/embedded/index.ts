import type { Options, Parser, SupportOption } from "prettier";
import type { EmbeddedPrinter } from "../types.js";
import { compareNames } from "./utils.js";

import {
  name as embeddedXmlName,
  embeddedParser as embeddedXmlParser,
  embeddedPrinter as embeddedXmlPrinter,
  embeddedOption as embeddedXmlOption,
} from "./xml/index.js";

import {
  name as embeddedSqlName,
  embeddedPrinter as embeddedSqlPrinter,
  embeddedOption as embeddedSqlOption,
} from "./sql/index.js";

import {
  name as embeddedPhpName,
  embeddedPrinter as embeddedPhpPrinter,
  embeddedOption as embeddedPhpOption,
} from "./php/index.js";

import {
  name as embeddedNopName,
  embeddedOption as embeddedNopOption,
} from "./nop/index.js";

type EmbeddedName =
  | typeof embeddedXmlName
  | typeof embeddedSqlName
  | typeof embeddedPhpName
  | typeof embeddedNopName;

type Embedded = Record<
  EmbeddedName,
  {
    parser?: Parser;
    printer?: EmbeddedPrinter<Options>;
    option: SupportOption;
  }
>;

export const embedded: Embedded = {
  [embeddedXmlName]: {
    parser: embeddedXmlParser,
    printer: embeddedXmlPrinter,
    option: embeddedXmlOption,
  },
  [embeddedSqlName]: {
    printer: embeddedSqlPrinter,
    option: embeddedSqlOption,
  },
  [embeddedPhpName]: {
    printer: embeddedPhpPrinter,
    option: embeddedPhpOption,
  },
  [embeddedNopName]: {
    option: embeddedNopOption,
  },
};

// sort names to provide a stable order
// when same languages are specified in different options
export const embeddedLanguageNames = Object.keys(embedded).sort(
  compareNames,
) as EmbeddedName[];
