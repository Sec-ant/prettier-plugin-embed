// patch estree types
import "estree";
declare module "estree" {
  interface Comment {
    leading: boolean;
    trailing: boolean;
    nodeDescription: string;
  }

  interface BaseNode {
    comments?: Comment[];
  }

  interface File extends BaseNode {
    type: "File";
    sourceType: "script" | "module";
    program: Program;
  }

  interface NodeMap {
    File: File;
  }
}
