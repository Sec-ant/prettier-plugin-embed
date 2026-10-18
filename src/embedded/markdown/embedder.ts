import { createEmbedder } from "../create-embedder.js";
import { language } from "./language.js";

export const embedder = createEmbedder({
  parser: "markdown",
  parserOption: "embeddedMarkdownParser",
  parserOptions: { __inJsTemplate: true },
});

declare module "../types.js" {
  interface EmbeddedEmbedders {
    [language]: typeof embedder;
  }
}
