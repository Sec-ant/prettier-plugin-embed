import type { Options, Parser, Printer, SupportOptions } from "prettier";
import type { Embedder } from "../types.js";
import { language as embeddedNoop } from "./noop/index.js";
import type {
  EmbeddedEmbedders,
  EmbeddedLanguage,
  EmbeddedOptions,
  EmbeddedParsers,
  EmbeddedPrinters,
} from "./types.js";
import { insertLanguage } from "./utils.js";

export const embeddedLanguages: EmbeddedLanguage[] = [];
export const embeddedParsers: EmbeddedParsers = {} as EmbeddedParsers;
export const embeddedPrinters: EmbeddedPrinters = {} as EmbeddedPrinters;
export const embeddedEmbedders: EmbeddedEmbedders = {} as EmbeddedEmbedders;
export const embeddedOptions: EmbeddedOptions = {} as EmbeddedOptions;

interface EmbeddedExports {
  language: EmbeddedLanguage;
  parser?: Parser;
  printer?: Printer;
  embedder?: Embedder<Options>;
  options: SupportOptions;
}

const embedded = import.meta.glob<EmbeddedExports>("./*/index.{ts,js}", {
  eager: true,
});

for (const { language, parser, printer, embedder, options } of Object.values(
  embedded,
)) {
  insertLanguage(embeddedLanguages, language, embeddedNoop);
  parser && (embeddedParsers[language] = parser);
  printer && (embeddedPrinters[language] = printer);
  embedder && (embeddedEmbedders[language] = embedder);
  Object.assign(embeddedOptions, options);
}
