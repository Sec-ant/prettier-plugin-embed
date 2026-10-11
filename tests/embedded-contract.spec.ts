import type { Options } from "prettier";
import { describe, expect, it } from "vitest";
import { embeddedEmbedders, embeddedLanguages } from "../src/embedded/index.js";

const languageOptions: Options = {
  parser: "babel",
  printWidth: 80,
  tabWidth: 2,
};
const configurableParsers = new Set([
  "embeddedCss",
  "embeddedEs",
  "embeddedHtml",
  "embeddedJson",
  "embeddedMarkdown",
  "embeddedRuby",
  "embeddedSql",
  "embeddedTs",
]);

for (const language of embeddedLanguages.filter(
  (language) => language !== "embeddedNoop",
)) {
  const embedder = embeddedEmbedders[language];
  if (!embedder) continue;

  describe(language, () => {
    it("accepts template literals with and without exterior whitespace", async () => {
      const parserOption = `${language}Parser`;
      const parserModes = configurableParsers.has(language)
        ? [undefined, "contract-parser"]
        : [undefined];

      for (const customParser of parserModes) {
        const options = {
          ...languageOptions,
          ...(customParser ? { [parserOption]: customParser } : {}),
          ...(language === "embeddedSql" && customParser
            ? { embeddedSqlPlugin: "prettier-plugin-sql-cst" }
            : {}),
          ...(language === "embeddedHtml" ? { __embeddedInHtml: true } : {}),
          ...(language === "embeddedMarkdown" && customParser
            ? {
                preserveEmbeddedExteriorWhitespaces: ["contract"],
                noEmbeddedMultiLineIndentation: ["contract"],
              }
            : {}),
        } as Options;

        const templates = [
          [" \n  alpha\n ", "\n  omega\n "],
          ["alpha", "omega"],
          ...(language === "embeddedHtml" ? [["script", "</script>"]] : []),
        ];

        for (const [leading, trailing] of templates) {
          const expression = { type: "Identifier", name: "value" };
          const node = {
            quasis: [
              { value: { cooked: leading, raw: leading } },
              { value: { cooked: trailing, raw: trailing } },
            ],
            expressions: [expression],
          };
          const path = {
            node,
            map: (
              callback: (
                path: { node: typeof expression },
                i: number,
              ) => unknown,
            ) =>
              node.expressions.map((node, index) => callback({ node }, index)),
          };
          const parsedOptions: Options[] = [];
          const textToDoc = async (source: string, parserOptions: Options) => {
            parsedOptions.push(parserOptions);
            return source;
          };

          const doc = await embedder(
            textToDoc as never,
            (() => "expression") as never,
            path as never,
            options,
            {
              commentOrTag: "contract",
              kind: "tag",
              embeddedOverrideOptions: undefined,
            },
          );

          expect(doc).toBeDefined();
          expect(parsedOptions).toHaveLength(1);
          if (customParser) {
            expect(parsedOptions[0]).toMatchObject({
              parser: customParser,
            });
          } else {
            expect(typeof parsedOptions[0]?.parser).toBe("string");
          }
        }
      }
    });
  });
}
