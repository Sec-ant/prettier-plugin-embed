import dedent from "dedent";
import type { Options } from "prettier";
import { builders, utils } from "prettier/doc";
import type { Embedder } from "../../types.js";
import {
  preparePlaceholder,
  printTemplateExpressions,
  simpleRehydrateDoc,
  throwIfPluginIsNotFound,
} from "../utils.js";
import { language } from "./language.js";

const { hardline, group, line, softline, indent } = builders;
const { mapDoc } = utils;

export const embedder: Embedder<Options> = async (
  textToDoc,
  print,
  path,
  options,
  { identifier, embeddedOverrideOptions },
) => {
  options = {
    ...options,
    ...embeddedOverrideOptions,
  };

  const plugin = options.embeddedSqlPlugin ?? "prettier-plugin-sql";

  throwIfPluginIsNotFound(plugin, options, identifier);

  const { node } = path;

  const { createPlaceholder, placeholderRegex } = preparePlaceholder();

  const text = node.quasis
    .map((quasi, index, { length }) =>
      index === length - 1
        ? quasi.value.cooked
        : quasi.value.cooked + createPlaceholder(index),
    )
    .join("");

  const leadingWhitespaces = text.match(/^\s+/)?.[0] ?? "";
  const trailingWhitespaces = text.match(/\s+$/)?.[0] ?? "";

  const trimmedText = text.slice(
    leadingWhitespaces.length,
    -trailingWhitespaces.length || undefined,
  );

  const expressionDocs = printTemplateExpressions(path, print);

  let contentDoc: builders.Doc[] | builders.DocCommand;

  if (plugin === "prettier-plugin-sql-cst") {
    const doc = await textToDoc(trimmedText, {
      ...options,
      parser: options.embeddedSqlParser ?? "sqlite",
    });
    contentDoc = simpleRehydrateDoc(doc, placeholderRegex, expressionDocs);
  } else {
    const doc = await textToDoc(dedent(trimmedText), {
      ...options,
      parser: "sql",
    });
    contentDoc = mapDoc(doc, (doc) => {
      if (typeof doc !== "string") {
        return doc;
      }
      const parts = [];
      const components = doc.split(placeholderRegex);
      for (let i = 0; i < components.length; i++) {
        let component = components[i]!;
        if (i % 2 == 0) {
          if (!component) {
            continue;
          }
          component = component.replaceAll(/([\\`]|\${)/g, "\\$1");
          component
            .split(/(\n)/)
            .forEach((c) =>
              c === "\n" ? parts.push(hardline) : parts.push(c),
            );
        } else {
          const placeholderIndex = Number(component);
          parts.push(expressionDocs[placeholderIndex]!);
        }
      }
      return parts;
    });
  }

  if (options.preserveEmbeddedExteriorWhitespaces?.includes(identifier)) {
    // TODO: should we label the doc with { hug: false } ?
    // https://github.com/prettier/prettier/blob/5cfb76ee50cf286cab267cf3cb7a26e749c995f7/src/language-js/embed/html.js#L88
    return group([
      "`",
      leadingWhitespaces,
      options.noEmbeddedMultiLineIndentation?.includes(identifier)
        ? [group(contentDoc)]
        : indent([group(contentDoc)]),
      trailingWhitespaces,
      "`",
    ]);
  }

  const leadingLineBreak = leadingWhitespaces.length ? line : softline;
  const trailingLineBreak = trailingWhitespaces.length ? line : softline;

  return group([
    "`",
    options.noEmbeddedMultiLineIndentation?.includes(identifier)
      ? [leadingLineBreak, group(contentDoc)]
      : indent([leadingLineBreak, group(contentDoc)]),
    trailingLineBreak,
    "`",
  ]);
};

/**
 * Register the embedder to the EmbeddedEmbedders
 */
declare module "../types.js" {
  interface EmbeddedEmbedders {
    [language]: typeof embedder;
  }
}
