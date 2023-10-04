import type { Parser, SupportOptions } from "prettier";
import type { EmbeddedPrinter } from "../types.js";

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

export const embeddedLanguageNames = [
  embeddedXmlName,
  embeddedSqlName,
] as const;

export const embeddedParsers: Record<string, Parser> = {
  [embeddedXmlName]: embeddedXmlParser,
};

export const embeddedPrinters: Record<string, EmbeddedPrinter> = {
  [embeddedXmlName]: embeddedXmlPrinter,
  [embeddedSqlName]: embeddedSqlPrinter,
};

export const embeddedOptions: SupportOptions = {
  [embeddedXmlName]: embeddedXmlOption,
  [embeddedSqlName]: embeddedSqlOption,
};
