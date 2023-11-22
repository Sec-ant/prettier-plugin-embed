import type { Options, Parser, SupportOptions } from "prettier";
import type { Embedder } from "../types.js";
import { embeddedLanguage as embeddedNoop } from "./noop/index.js";
import type {
  EmbeddedEmbedders,
  EmbeddedLanguage,
  EmbeddedOptions,
  EmbeddedParsers,
} from "./types.js";
import { insertEmbeddedLanguage } from "./utils.js";

export const embeddedLanguages: EmbeddedLanguage[] = [];
export const embeddedParsers: EmbeddedParsers = {} as EmbeddedParsers;
export const embeddedEmbedders: EmbeddedEmbedders = {} as EmbeddedEmbedders;
export const embeddedOptions: EmbeddedOptions = {} as EmbeddedOptions;

interface EmbeddedExports {
  embeddedLanguage: EmbeddedLanguage;
  parser?: Parser;
  embedder?: Embedder<Options>;
  options: SupportOptions;
}

const embedded = import.meta.glob<EmbeddedExports>("./*/index.{ts,js}", {
  eager: true,
});

// TODO: check duplicate names or options before assign or merge
Object.values(embedded).forEach(
  ({ embeddedLanguage, parser, embedder, options }) => {
    insertEmbeddedLanguage(embeddedLanguages, embeddedLanguage, embeddedNoop);
    parser && (embeddedParsers[embeddedLanguage] = parser);
    embedder && (embeddedEmbedders[embeddedLanguage] = embedder);
    Object.assign(embeddedOptions, options);
  },
);
