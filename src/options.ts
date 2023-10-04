import type { SupportOptions } from "prettier";
import { embeddedOptions } from "./embedded/index.js";

export const options: SupportOptions = {
  ...embeddedOptions,
};
