declare module "prettier/plugins/estree.mjs" {
  import type { Printer } from "prettier";
  export const printers: {
    estree: Printer;
  };
}
