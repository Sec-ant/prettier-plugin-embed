import { Parser } from "prettier";
import parserBabel from "prettier/parser-babel";
import parserEspree from "prettier/parser-espree";
import parserFlow from "prettier/parser-flow";
import parserTypescript from "prettier/parser-typescript";

import { embedded } from "./embedded/index.js";

// TODO: find out which parsers are required and which are optional
export const parsers = {
  // parsers from internal
  ...parserBabel.parsers,
  ...parserEspree.parsers,
  ...parserFlow.parsers,
  ...parserTypescript.parsers,
  // parsers from plugin
  ...(Object.fromEntries(
    Object.entries(embedded).map(([name, { parser }]) =>
      parser ? [name, parser] : [],
    ),
  ) as Record<string, Parser>),
};
