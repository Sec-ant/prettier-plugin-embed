import { createEmbedder } from "../create-embedder.js";
import { language } from "./language.js";

export const embedder = createEmbedder({
  parser: "gherkin",
});

declare module "../types.js" {
  interface EmbeddedEmbedders {
    [language]: typeof embedder;
  }
}
