import { name } from "./name.js";

export interface PrettierPluginPhpOptions {
  phpVersion?:
    | "5.0"
    | "5.1"
    | "5.2"
    | "5.3"
    | "5.4"
    | "5.5"
    | "5.6"
    | "7.0"
    | "7.1"
    | "7.2"
    | "7.3"
    | "7.4"
    | "8.0"
    | "8.1"
    | "8.2";
  trailingCommaPHP?: boolean;
  braceStyle?: "psr-2" | "per-cs" | "1tbs";
}

export interface PrettierPluginEmbedPhpOptions {
  [name]?: string[];
}

declare module "prettier" {
  export interface Options
    extends PrettierPluginPhpOptions,
      PrettierPluginEmbedPhpOptions {}
}
