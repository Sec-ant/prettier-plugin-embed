export const name = "embeddedHtml";

declare module "../types.js" {
  interface EmbeddedNamesHolder {
    [name]: void;
  }
}
