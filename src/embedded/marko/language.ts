export const language = "embeddedMarko";

declare module "../types.js" {
  interface EmbeddedLanguagesHolder {
    [language]: undefined;
  }
}
