import type { Options, Doc, AstPath } from "prettier";
import type { TemplateLiteral } from "estree";

export type InternalPrintFun = (
  selector?: string | number | (string | number)[] | AstPath<TemplateLiteral>,
) => Doc;

export type Embedder = (
  textToDoc: (text: string, options: Options) => Promise<Doc>,
  print: InternalPrintFun,
  path: AstPath<TemplateLiteral>,
  options: Options,
) => Promise<Doc>;
