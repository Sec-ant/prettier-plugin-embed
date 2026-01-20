import parserEspree from "prettier/plugins/acorn.js";
import parserBabel from "prettier/plugins/babel.js";
import parserFlow from "prettier/plugins/flow.js";
import parserMeriyah from "prettier/plugins/meriyah.js";
import parserTypescript from "prettier/plugins/typescript.js";
import { embeddedParsers } from "./embedded/index.js";

export const parsers = {
  // parsers from internal
  ...parserBabel.parsers,
  ...parserEspree.parsers,
  ...parserFlow.parsers,
  ...parserTypescript.parsers,
  ...parserMeriyah.parsers,
  // parsers from this plugin
  ...embeddedParsers,
};
