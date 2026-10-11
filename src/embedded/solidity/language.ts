export const language = "embeddedSolidity";

declare module "../types.js" {
  interface EmbeddedLanguagesHolder {
    [language]: undefined;
  }
}
