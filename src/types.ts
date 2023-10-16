import type { Options, Doc, AstPath } from "prettier";
import type { Node as EsTreeNode, TemplateLiteral, Comment } from "estree";

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

export type Embedder<T extends Options = Options> = (
  textToDoc: (text: string, options: T) => Promise<Doc>,
  print: InternalPrintFun,
  path: AstPath<TemplateLiteral>,
  options: T,
  identifier: string,
  identifiers: string[],
) => Promise<Doc>;
