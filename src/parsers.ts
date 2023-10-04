import parserBabel from "prettier/parser-babel";
import parserEspree from "prettier/parser-espree";
import parserFlow from "prettier/parser-flow";
import parserTypescript from "prettier/parser-typescript";

import { embeddedParsers } from "./embedded/index.js";

// TODO: find out which parsers are required and which are optional
export const parsers = {
  // parsers from internal
  ...parserBabel.parsers,
  ...parserEspree.parsers,
  ...parserFlow.parsers,
  ...parserTypescript.parsers,
  // parsers from plugin
  ...embeddedParsers,
};
