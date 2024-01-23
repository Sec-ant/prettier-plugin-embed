import type { AutocompleteStringList } from "../utils.js";

export interface PluginRubyOptions {
  rubyPlugins?: AutocompleteStringList<
    | "plugin/single_quotes"
    | "plugin/trailing_comma"
    | "plugin/disable_auto_ternary"
  >;
  rubySingleQuote?: boolean;
  rubyExecutablePath?: string;
}
