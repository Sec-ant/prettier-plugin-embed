import type { Options, Parser, SupportOption } from "prettier";
import type { Embedder } from "../types.js";
import { insertEmbeddedLanguageName } from "./utils.js";
import { name as embeddedNoopName } from "./noop/index.js";
import type {
  EmbeddedEmbedders,
  EmbeddedNames,
  EmbeddedParsers,
  EmbeddedOptions,
} from "./types.js";

export const embeddedNames: EmbeddedNames[] = [];
export const embeddedParsers: EmbeddedParsers = {} as EmbeddedParsers;
export const embeddedEmbedders: EmbeddedEmbedders = {} as EmbeddedEmbedders;
export const embeddedOptions: EmbeddedOptions = {} as EmbeddedOptions;

interface EmbeddedExports {
  name: EmbeddedNames;
  parser?: Parser;
  embedder?: Embedder<Options>;
  option: SupportOption;
}

const embedded = import.meta.glob<EmbeddedExports>("./*/index.{ts,js}", {
  eager: true,
});

Object.values(embedded).forEach(({ name, parser, embedder, option }) => {
  insertEmbeddedLanguageName(embeddedNames, name, embeddedNoopName);
  parser && (embeddedParsers[name] = parser);
  embedder && (embeddedEmbedders[name] = embedder);
  embeddedOptions[name] = option;
});
