export const embeddedLanguage = "embeddedTs";

declare module "../types.js" {
  interface EmbeddedLanguagesHolder {
    [embeddedLanguage]: void;
  }
}
