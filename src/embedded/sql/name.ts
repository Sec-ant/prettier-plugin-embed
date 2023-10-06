export const name = "embeddedSql";

declare module "../types.js" {
  interface EmbeddedNamesHolder {
    [name]: void;
  }
}
