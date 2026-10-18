import type { TemplateLiteral } from "estree";
import { parsers } from "prettier/plugins/babel";

type LocatedTemplate = TemplateLiteral & { start: number; end: number };

export async function templates(source: string) {
  const result: LocatedTemplate[] = [];
  const ast = await parsers["babel-ts"]!.parse(source, {
    parser: "babel-ts",
  } as never);
  function visit(value: unknown) {
    if (Array.isArray(value)) {
      for (const child of value) visit(child);
    } else if (value && typeof value === "object") {
      const node = value as Record<string, unknown>;
      if (node.type === "TemplateLiteral")
        result.push(node as unknown as LocatedTemplate);
      for (const [key, child] of Object.entries(node)) {
        if (key !== "loc" && key !== "tokens" && key !== "comments")
          visit(child);
      }
    }
  }
  visit(ast);
  return result;
}

// Independent test oracle: remove a uniform space/tab margin and boundary
// blank lines, while retaining indentation on the first content line.
export function unindentTemplate(value: string) {
  const lines = value.split("\n");
  const nonempty = lines.filter((line) => /\S/.test(line));
  const width = Math.min(
    ...nonempty.map((line) => /^[\t ]*/.exec(line)![0].length),
  );
  return lines
    .map((line) => line.slice(Number.isFinite(width) ? width : 0))
    .join("\n");
}

export function templateContent(value: string) {
  return unindentTemplate(value).replace(
    /^(?:[\t ]*\r?\n)+|(?:\r?\n[\t ]*)+$/g,
    "",
  );
}

export async function contents(source: string) {
  return (await templates(source)).map((node) =>
    templateContent(
      node.quasis.map((quasi) => quasi.value.cooked).join("<expression>"),
    ),
  );
}

export async function addTemplateMargin(source: string, margin: string) {
  for (const node of (await templates(source)).sort(
    (a, b) => b.start - a.start,
  )) {
    if (node.expressions.length)
      throw new Error("Use an interpolation-free margin fixture.");
    const body = source.slice(node.start + 1, node.end - 1);
    source =
      source.slice(0, node.start + 1) +
      margin +
      body.replaceAll("\n", `\n${margin}`) +
      source.slice(node.end - 1);
  }
  return source;
}
