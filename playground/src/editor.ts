import { indentWithTab } from "@codemirror/commands";
import { cssLanguage } from "@codemirror/lang-css";
import { htmlLanguage } from "@codemirror/lang-html";
import {
  javascript,
  javascriptLanguage,
  tsxLanguage,
} from "@codemirror/lang-javascript";
import { json, jsonLanguage } from "@codemirror/lang-json";
import { StandardSQL, sql } from "@codemirror/lang-sql";
import { xmlLanguage } from "@codemirror/lang-xml";
import {
  HighlightStyle,
  LanguageSupport,
  syntaxHighlighting,
} from "@codemirror/language";
import { Compartment, EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { parseMixed } from "@lezer/common";
import { tags } from "@lezer/highlight";
import { basicSetup } from "codemirror";

const embedded = new Map([
  ["css", cssLanguage.parser],
  ["html", htmlLanguage.parser],
  ["json", jsonLanguage.parser],
  ["sql", StandardSQL.language.parser],
  ["xml", xmlLanguage.parser],
  ["svg", xmlLanguage.parser],
]);
const wrap = parseMixed((node, input) => {
  if (node.name !== "TaggedTemplateExpression") return null;
  const tag = node.node.firstChild;
  const template = tag?.nextSibling;
  if (!tag || template?.name !== "TemplateString") return null;
  const parser = embedded.get(input.read(tag.from, tag.to));
  if (!parser) return null;
  const ranges = [];
  let start = template.from + 1;
  for (let child = template.firstChild; child; child = child.nextSibling) {
    if (child.name !== "Interpolation") continue;
    if (child.from > start) ranges.push({ from: start, to: child.from });
    start = child.to;
  }
  if (start < template.to - 1)
    ranges.push({ from: start, to: template.to - 1 });
  return { parser, overlay: ranges };
});
const highlights = HighlightStyle.define([
  { tag: tags.keyword, color: "var(--syntax-keyword)" },
  { tag: [tags.string, tags.attributeValue], color: "var(--syntax-string)" },
  { tag: [tags.number, tags.bool, tags.null], color: "var(--syntax-number)" },
  { tag: tags.comment, color: "var(--muted)", fontStyle: "italic" },
  {
    tag: [tags.tagName, tags.typeName, tags.className],
    color: "var(--syntax-keyword)",
  },
  {
    tag: [tags.propertyName, tags.attributeName],
    color: "var(--syntax-property)",
  },
]);
export function createEditor(
  parent: HTMLElement,
  label: string,
  value: string,
  onChange?: (text: string) => void,
  mode: "source" | "config" = "source",
) {
  const language = new Compartment();
  let setting = false;
  const view = new EditorView({
    parent,
    state: EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        keymap.of([indentWithTab]),
        language.of(mode === "config" ? json() : sourceLanguage("typescript")),
        syntaxHighlighting(highlights),
        EditorView.lineWrapping,
        EditorView.contentAttributes.of({
          "aria-label": label,
          spellcheck: "false",
          tabindex: "0",
        }),
        EditorState.readOnly.of(!onChange),
        EditorView.editable.of(Boolean(onChange)),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !setting)
            onChange?.(update.state.doc.toString());
        }),
        EditorView.theme({
          "&": {
            height: "100%",
            fontSize: "13px",
            backgroundColor: "var(--editor)",
            color: "var(--text)",
          },
          ".cm-scroller": {
            overflow: "auto",
            fontFamily: "var(--mono)",
            lineHeight: "1.75",
          },
          ".cm-content": { padding: "18px 0", caretColor: "var(--accent)" },
          ".cm-line": { padding: "0 18px 0 12px" },
          ".cm-gutters": {
            backgroundColor: "var(--editor)",
            color: "var(--gutter)",
            border: "none",
            paddingLeft: "6px",
          },
          // CodeMirror draws selections behind the content. Keep line backgrounds
          // translucent so a selection within the active line remains visible.
          ".cm-activeLine": {
            backgroundColor: "var(--editor-active-line)",
          },
          ".cm-activeLineGutter": {
            backgroundColor: "var(--active-line)",
          },
          "&.cm-focused": { outline: "none" },
          "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground":
            { backgroundColor: "var(--selection)" },
          ".cm-cursor": { borderLeftColor: "var(--accent)" },
          ".cm-panels": {
            backgroundColor: "var(--panel)",
            color: "var(--text)",
          },
        }),
      ],
    }),
  });
  return {
    view,
    set(text: string) {
      if (view.state.doc.toString() === text) return;
      setting = true;
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: text },
      });
      setting = false;
    },
    language(parser: string) {
      view.dispatch({ effects: language.reconfigure(sourceLanguage(parser)) });
    },
  };
}
function sourceLanguage(parser: string) {
  const typescript = parser.includes("typescript") || parser === "babel-ts";
  const base = typescript ? tsxLanguage : javascriptLanguage;
  return new LanguageSupport(base.configure({ wrap }), [
    javascript({ typescript, jsx: true }).support,
    sql().support,
  ]);
}
