/* eslint-disable @typescript-eslint/consistent-indexed-object-style */
import type { Parser, SupportOption, Options } from "prettier";
import type { Embedder } from "../types.js";

export interface EmbeddedParsers {
  [name: string]: Parser | undefined;
}
export interface EmbeddedEmbedders {
  [name: string]: Embedder<Options> | undefined;
}
export interface EmbeddedOptions {
  [name: string]: SupportOption | undefined;
}
export interface EmbeddedNamesHolder {}
export type EmbeddedName = keyof EmbeddedNamesHolder;
