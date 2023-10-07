/* eslint-disable @typescript-eslint/consistent-indexed-object-style */
import type { Parser, SupportOption, Options } from "prettier";
import type { Embedder } from "../types.js";

type EmbeddedNameConvention = `embedded${string}`;

export interface EmbeddedParsers {
  [name: EmbeddedNameConvention]: Parser | undefined;
}
export interface EmbeddedEmbedders {
  [name: EmbeddedNameConvention]: Embedder<Options> | undefined;
}
export interface EmbeddedOptions {
  [name: EmbeddedNameConvention]: SupportOption | undefined;
}
export interface EmbeddedNamesHolder {}
export type EmbeddedName = keyof EmbeddedNamesHolder;
export interface PrettierPluginEmbedOptions {}

declare module "prettier" {
  interface Options extends PrettierPluginEmbedOptions {}
}
