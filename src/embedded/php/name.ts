export const name = "embeddedPhp";

declare module "../types.js" {
  interface EmbeddedNamesHolder {
    [name]: void;
  }
}
