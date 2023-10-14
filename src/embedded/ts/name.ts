export const name = "embeddedTs";

declare module "../types.js" {
  interface EmbeddedNamesHolder {
    [name]: void;
  }
}
