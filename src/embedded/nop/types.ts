import { name } from "./name.js";

export interface PrettierPluginEmbedNopOptions {
  [name]?: string[];
}

declare module "prettier" {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface Options extends PrettierPluginEmbedNopOptions {}
}
