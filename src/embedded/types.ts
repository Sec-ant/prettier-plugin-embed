import { Parser, SupportOption, Options } from "prettier";
import { Embedder } from "../types.js";

/* eslint-disable @typescript-eslint/consistent-indexed-object-style */
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
export type EmbeddedNames = keyof EmbeddedNamesHolder;
