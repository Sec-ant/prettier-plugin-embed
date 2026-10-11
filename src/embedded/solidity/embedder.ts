import { createEmbedder } from "../create-embedder.js";
import { language } from "./language.js";

export const embedder = createEmbedder({
  parser: "slang",
  parserOption: `${language}Parser`,
});

declare module "../types.js" {
  interface EmbeddedEmbedders {
    [language]: typeof embedder;
  }
}
