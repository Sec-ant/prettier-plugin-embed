export const embeddedLanguage = "embeddedXml";

declare module "../types.js" {
  interface EmbeddedLanguagesHolder {
    [embeddedLanguage]: void;
  }
}
