import prettier from "prettier";
import { parsers } from "prettier/plugins/babel";

const formattingMetadata = new Set([
  "start",
  "end",
  "loc",
  "range",
  "extra",
  "comments",
  "leadingComments",
  "trailingComments",
  "innerComments",
]);

function normalizeExpression(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeExpression);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !formattingMetadata.has(key))
        .map(([key, child]) => [key, normalizeExpression(child)]),
    );
  }
  return value;
}

export async function templateExpressions(source: string) {
  const templates: unknown[] = [];
  function visit(value: unknown) {
    if (Array.isArray(value)) {
      for (const child of value) visit(child);
    } else if (value && typeof value === "object") {
      const node = value as Record<string, unknown>;
      if (node.type === "TemplateLiteral") {
        templates.push(normalizeExpression(node.expressions));
      }
      for (const [key, child] of Object.entries(node)) {
        if (!formattingMetadata.has(key)) visit(child);
      }
    }
  }
  const parser = parsers["babel-ts"]!;
  await prettier.format(source, {
    parser: "babel-ts",
    embeddedLanguageFormatting: "off",
    plugins: [
      {
        parsers: {
          "babel-ts": {
            ...parser,
            async parse(text, options) {
              const ast = await parser.parse(text, options);
              visit(ast);
              return ast;
            },
          },
        },
      },
    ],
  });
  return templates;
}
