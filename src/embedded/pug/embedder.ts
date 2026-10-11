import { createEmbedder } from "../create-embedder.js";
import { language } from "./language.js";

export const embedder = createEmbedder({
  parser: "pug",
  newlineHandling: "hardline",
});

declare module "../types.js" {
  interface EmbeddedEmbedders {
    [language]: typeof embedder;
  }
}
