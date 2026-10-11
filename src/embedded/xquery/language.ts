export const language = "embeddedXQuery";

declare module "../types.js" {
  interface EmbeddedLanguagesHolder {
    [language]: undefined;
  }
}
