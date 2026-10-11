export const language = "embeddedHandlebars";

declare module "../types.js" {
  interface EmbeddedLanguagesHolder {
    [language]: undefined;
  }
}
