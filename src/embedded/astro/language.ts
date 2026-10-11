export const language = "embeddedAstro";

declare module "../types.js" {
  interface EmbeddedLanguagesHolder {
    [language]: undefined;
  }
}
