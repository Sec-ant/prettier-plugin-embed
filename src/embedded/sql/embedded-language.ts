export const embeddedLanguage = "embeddedSql";

declare module "../types.js" {
  interface EmbeddedLanguagesHolder {
    [embeddedLanguage]: void;
  }
}
