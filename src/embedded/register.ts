import type { Options, Parser, SupportOptions } from "prettier";
import type { Embedder } from "../types.js";
import { language as embeddedNoop } from "./noop/index.js";
import type {
  EmbeddedEmbedders,
  EmbeddedLanguage,
  EmbeddedOptions,
  EmbeddedParsers,
} from "./types.js";
import { insertLanguage } from "./utils.js";

export const embeddedLanguages: EmbeddedLanguage[] = [];
export const embeddedParsers: EmbeddedParsers = {} as EmbeddedParsers;
export const embeddedEmbedders: EmbeddedEmbedders = {} as EmbeddedEmbedders;
export const embeddedOptions: EmbeddedOptions = {} as EmbeddedOptions;

interface EmbeddedExports {
  language: EmbeddedLanguage;
  parser?: Parser;
  embedder?: Embedder<Options>;
  options: SupportOptions;
}

const embedded = import.meta.glob<EmbeddedExports>("./*/index.{ts,js}", {
  eager: true,
});

// TODO: check duplicate names or options before assign or merge
for (const { language, parser, embedder, options } of Object.values(embedded)) {
  insertLanguage(embeddedLanguages, language, embeddedNoop);
  parser && (embeddedParsers[language] = parser);
  embedder && (embeddedEmbedders[language] = embedder);
  Object.assign(embeddedOptions, options);
}
