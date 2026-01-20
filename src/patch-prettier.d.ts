declare module "prettier/plugins/estree.js" {
  import type { Printer } from "prettier";
  export const printers: {
    estree: Printer;
  };
}
