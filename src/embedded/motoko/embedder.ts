import type { Doc } from "prettier";
import { createEmbedder } from "../create-embedder.js";
import { language } from "./language.js";

export const embedder = createEmbedder({
  parser: "motoko-tt-parse",
  transformDoc: stripTrailingLiteralLine,
});

function stripTrailingLiteralLine(doc: Doc): Doc {
  if (!Array.isArray(doc)) return doc;
  const last = doc.at(-1);
  if (
    last &&
    !Array.isArray(last) &&
    typeof last === "object" &&
    last.type === "line" &&
    last.hard &&
    last.literal
  ) {
    return doc.slice(0, -1);
  }
  return doc;
}

declare module "../types.js" {
  interface EmbeddedEmbedders {
    [language]: typeof embedder;
  }
}
