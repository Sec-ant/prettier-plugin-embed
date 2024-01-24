/**
 * Location: node_modules/@prettier/plugin-pug/src/printer.ts
 */
export interface PluginPugOptions {
  pugPrintWidth?: number;
  pugSingleQuote?: boolean;
  pugTabWidth?: number;
  pugUseTabs?: boolean;
  pugBracketSpacing?: boolean;
  pugArrowParens?: "avoid" | "always";
  pugSemi?: boolean;
  pugBracketSameLine?: boolean;

  pugAttributeSeparator?: "always" | "as-needed" | "none";
  pugCommentPreserveSpaces?: "keep-all" | "keep-leading" | "trim-all";
  pugSortAttributes?: "asc" | "desc" | "as-is";
  pugSortAttributesBeginning?: string[];
  pugSortAttributesEnd?: string[];
  pugWrapAttributesThreshold?: number;
  pugWrapAttributesPattern?: string;
  pugClassLocation?: "before-attributes" | "after-attributes";
  pugClassNotation?: "literal" | "attribute" | "as-is";
  pugIdNotation?: "literal" | "as-is";
  pugEmptyAttributes?: "as-is" | "none" | "all";
  pugEmptyAttributesForceQuotes?: "as-is" | "none" | "all";
  pugSingleFileComponentIndentation?: boolean;
  pugFramework?: "auto" | "vue" | "svelte" | "angular";
  pugExplicitDiv?: boolean;
  pugPreserveAttributeBrackets?: boolean;
}
