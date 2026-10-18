import { utils } from "prettier/doc";
import { createEmbedder } from "../create-embedder.js";
import { language } from "./language.js";

export const embedder = createEmbedder({
  parser: "yaml",
  parserOptions: { useTabs: false },
  preserveTrailingWhitespace: true,
  transformDoc: (doc) =>
    utils.mapDoc(doc, (part) => {
      if (part && typeof part === "object" && !Array.isArray(part)) {
        // YAML's final keep-chomping scalar owns an explicit EOF newline.
        // The template boundary prints that newline, so do not print it twice.
        if (
          part.type === "align" &&
          part.n === Number.NEGATIVE_INFINITY &&
          Array.isArray(part.contents) &&
          part.contents.length === 2 &&
          typeof part.contents[0] === "object" &&
          !Array.isArray(part.contents[0]) &&
          part.contents[0]?.type === "line" &&
          part.contents[0].hard &&
          typeof part.contents[1] === "object" &&
          !Array.isArray(part.contents[1]) &&
          part.contents[1]?.type === "break-parent"
        )
          return "";
      }
      return part;
    }),
});

declare module "../types.js" {
  interface EmbeddedEmbedders {
    [language]: typeof embedder;
  }
}
