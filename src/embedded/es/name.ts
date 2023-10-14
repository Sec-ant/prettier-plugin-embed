export const name = "embeddedEs";

declare module "../types.js" {
  interface EmbeddedNamesHolder {
    [name]: void;
  }
}
