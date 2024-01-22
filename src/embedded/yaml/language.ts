export const language = "embeddedYaml";

/**
 * Register the language to the EmbeddedLanguagesHolder
 */
declare module "../types.js" {
  interface EmbeddedLanguagesHolder {
    [language]: undefined;
  }
}
