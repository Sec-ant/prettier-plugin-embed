import { Options, Doc, AstPath } from "prettier";
import type { Node as EsTreeNode, TemplateLiteral, Comment } from "estree";

export * from "./embedded/types.js";

export type PrettierNode = EsTreeNode & {
  comments?: (Comment & {
    leading: boolean;
    trailing: boolean;
    nodeDescription: string;
  })[];
};

export type InternalPrintFun = (
  selector?: string | number | (string | number)[] | AstPath<TemplateLiteral>,
) => Doc;

export type EmbeddedPrinter<T extends Options = Options> = (
  textToDoc: (text: string, options: T) => Promise<Doc>,
  print: InternalPrintFun,
  path: AstPath<TemplateLiteral>,
  options: T,
  lang: string,
  langs: string[],
) => Promise<Doc>;

// see "./options.ts"
declare module "prettier" {
  export interface Options {
    disableEmbeddedDetectionByComment?: string[];
    disableEmbeddedDetectionByTag?: string[];
  }
}
