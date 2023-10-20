export const embeddedLanguage = "embeddedPhp";

declare module "../types.js" {
  interface EmbeddedLanguagesHolder {
    [embeddedLanguage]: void;
  }
}
