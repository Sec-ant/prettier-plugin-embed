import parserBabel from "prettier/parser-babel";
import parserEspree from "prettier/parser-espree";
import parserFlow from "prettier/parser-flow";
import parserTypescript from "prettier/parser-typescript";
import { embeddedParsers } from "./embedded/index.js";

export const parsers = {
  // parsers from internal
  // TODO: find out which parsers are required and which are optional
  ...parserBabel.parsers,
  ...parserEspree.parsers,
  ...parserFlow.parsers,
  ...parserTypescript.parsers,
  // parsers from this plugin
  ...embeddedParsers,
};
