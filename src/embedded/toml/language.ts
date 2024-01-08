export const language = "embeddedToml";

/**
 * Register the language to the EmbeddedLanguagesHolder
 */
declare module "../types.js" {
  interface EmbeddedLanguagesHolder {
    [language]: void;
  }
}
