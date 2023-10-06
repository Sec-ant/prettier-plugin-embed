export const name = "embeddedNoop";

declare module "../types.js" {
  interface EmbeddedNamesHolder {
    [name]: void;
  }
}
