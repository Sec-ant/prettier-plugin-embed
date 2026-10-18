import type { Options } from "prettier";
import { printer as docPrinter } from "prettier/doc";
import { describe, expect, it } from "vitest";
import { embeddedEmbedders, embeddedLanguages } from "../src/embedded/index.js";

it("registers unique language and option names with an embedder for each language", () => {
  const modules = Object.values(
    import.meta.glob<{
      language: string;
      options: Record<string, unknown>;
      embedder?: unknown;
    }>("../src/embedded/*/index.ts", { eager: true }),
  );
  const names = modules.map(({ language }) => language);
  const optionNames = modules.flatMap(({ options }) => Object.keys(options));
  expect(new Set(names).size).toBe(names.length);
  expect(new Set(optionNames).size).toBe(optionNames.length);
  expect(embeddedLanguages[0]).toBe("embeddedNoop");
  for (const { language, embedder } of modules) {
    if (language !== "embeddedNoop") expect(embedder).toBeTypeOf("function");
  }
});

const languageOptions: Options = {
  parser: "babel",
  printWidth: 80,
  tabWidth: 2,
};

it("requires a basic fixture for every registered language", () => {
  const languageDirectories = Object.keys(
    import.meta.glob("../src/embedded/*/index.ts"),
  )
    .map((file) => file.split("/").at(-2))
    .sort();
  const fixtureDirectories = Object.keys(
    import.meta.glob("./fixtures/*/basic.js", { query: "?raw" }),
  )
    .map((file) => file.split("/").at(-2))
    .sort();
  expect(fixtureDirectories).toEqual(languageDirectories);
});
const configurableParsers = new Set([
  "embeddedCss",
  "embeddedEs",
  "embeddedHtml",
  "embeddedJson",
  "embeddedMarkdown",
  "embeddedRuby",
  "embeddedSql",
  "embeddedTs",
  "embeddedSolidity",
  "embeddedXQuery",
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
          const { formatted } = docPrinter.printDocToString(doc, {
            printWidth: 80,
            tabWidth: 2,
            useTabs: false,
          });
          expect(formatted.match(/expression/g)).toHaveLength(1);
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
