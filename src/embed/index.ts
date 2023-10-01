import type { Embedder } from "./types.js";
import printEmbedXml from "./xml.js";

export const embedders: Record<string, Embedder> = {
  xml: printEmbedXml,
};

export * from "./types.js";
