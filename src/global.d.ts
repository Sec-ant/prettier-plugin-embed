/// <reference types="vite/client" />
declare const IMPORT_JS_MODULE_WORKER: string;
declare const IMPORT_TS_MODULE_WORKER: string;
declare module "prettier/plugins/estree.mjs" {
  import type { Printer } from "prettier";
  export const printers: {
    estree: Printer;
  };
}
