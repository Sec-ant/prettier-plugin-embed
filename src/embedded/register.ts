import type { Options, Parser, SupportOptions } from "prettier";
import type { Embedder } from "../types.js";
import { insertEmbeddedLanguageName } from "./utils.js";
import { name as embeddedNoopName } from "./noop/index.js";
import type {
  EmbeddedEmbedders,
  EmbeddedName,
  EmbeddedParsers,
  EmbeddedOptions,
} from "./types.js";

export const embeddedNames: EmbeddedName[] = [];
export const embeddedParsers: EmbeddedParsers = {} as EmbeddedParsers;
export const embeddedEmbedders: EmbeddedEmbedders = {} as EmbeddedEmbedders;
export const embeddedOptions: EmbeddedOptions = {} as EmbeddedOptions;

interface EmbeddedExports {
  name: EmbeddedName;
  parser?: Parser;
  embedder?: Embedder<Options>;
  options: SupportOptions;
}

const embedded = import.meta.glob<EmbeddedExports>("./*/index.{ts,js}", {
  eager: true,
});

Object.values(embedded).forEach(({ name, parser, embedder, options }) => {
  insertEmbeddedLanguageName(embeddedNames, name, embeddedNoopName);
  parser && (embeddedParsers[name] = parser);
  embedder && (embeddedEmbedders[name] = embedder);
  Object.assign(embeddedOptions, options);
});
