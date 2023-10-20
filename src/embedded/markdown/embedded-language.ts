export const embeddedLanguage = "embeddedMarkdown";

declare module "../types.js" {
  interface EmbeddedLanguagesHolder {
    [embeddedLanguage]: void;
  }
}
