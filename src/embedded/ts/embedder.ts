import { createEmbedder } from "../create-embedder.js";
import { language } from "./language.js";

export const embedder = createEmbedder({
  parser: "typescript",
  parserOption: "embeddedTsParser",
  // Prettier detects JSX from the embedded source rather than the host file extension.
  parserOptions: { filepath: undefined },
});

declare module "../types.js" {
  interface EmbeddedEmbedders {
    [language]: typeof embedder;
  }
}
