import "./style.css";
import { version as embedVersion } from "../../package.json";
import { Formatter } from "./client";
import { createEditor } from "./editor";
import {
  configuredPluginIds,
  nativePluginNames,
  packageNames,
} from "./package-names";
import {
  builtinPluginIds,
  languagePlugins,
  pluginIds,
  unavailablePlugins,
} from "./plugins";
import { initialState, samples } from "./samples";
import { decodeState, encodeState, parseConfig, savedState } from "./state";
import type { FormatResponse, OptionInfo } from "./types";

const isMac = /Mac/i.test(navigator.platform);
const isLinux = /Linux/i.test(navigator.platform);
const formatShortcut = isLinux
  ? "Ctrl + Shift + I"
  : isMac
    ? "⇧⌥F"
    : "Shift + Alt + F";
const shortcutHint = `${formatShortcut} to format`;

const icons = {
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  share: '<path d="M12 16V3m-5 5 5-5 5 5M5 13v7h14v-7"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/>',
  theme: '<path d="M20 13A8 8 0 0 1 11 4a8 8 0 1 0 9 9Z"/>',
  github:
    '<path d="M9 19c-4 1-4-2-6-2m12 5v-4a3 3 0 0 0-1-2c3 0 6-2 6-5a4 4 0 0 0-1-3 4 4 0 0 0 0-3s-1 0-3 1a11 11 0 0 0-6 0C8 5 7 5 7 5a4 4 0 0 0 0 3 4 4 0 0 0-1 3c0 3 3 5 6 5a3 3 0 0 0-1 2v4"/>',
};
const icon = (name: keyof typeof icons) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">${icons[name]}</svg>`;
const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `
<header class="app-header">
  <a class="wordmark" href="https://github.com/Sec-ant/prettier-plugin-embed" target="_blank" rel="noreferrer" aria-label="prettier-plugin-embed on GitHub"><svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="m11 9-7 7 7 7m10-14 7 7-7 7m-3-18-4 22" stroke="currentColor" stroke-width="2.5"/></svg><span class="wordmark-full">prettier<span class="wordmark-suffix">-plugin-embed</span></span><span class="wordmark-short" aria-hidden="true">embed</span></a>
  <span class="page-name">Playground</span>
  <nav class="header-actions" aria-label="Playground actions">
    <button id="share" class="primary">${icon("share")}<span>Share</span></button>
    <button id="theme" class="icon-button" aria-label="Switch color theme" title="Switch color theme">${icon("theme")}</button>
    <a class="icon-button" href="https://github.com/Sec-ant/prettier-plugin-embed" target="_blank" rel="noreferrer" aria-label="View source on GitHub" title="View source on GitHub">${icon("github")}</a>
  </nav>
</header>
<div id="notice" class="notice" hidden><span id="notice-message" role="status"></span><button id="dismiss-notice" class="icon-button" aria-label="Dismiss notice" title="Dismiss notice">${icon("close")}</button></div>
<div class="workspace">
  <aside class="sidebar" id="settings">
    <div class="settings-header"><div class="tabs" role="tablist" aria-label="Configuration view"><button role="tab" id="options-tab" aria-controls="options-panel" aria-selected="true">Options</button><button role="tab" id="json-tab" aria-controls="json-panel" aria-selected="false" tabindex="-1">.prettierrc</button></div><button id="reset" class="text-button" title="Reset formatting options">Reset</button><button id="close-settings" class="text-button" aria-label="Close options">Close</button></div>
    <div id="options-panel" role="tabpanel" aria-labelledby="options-tab">
      <fieldset id="option-fields"><legend class="sr-only">Formatting options</legend>
        <section class="settings-section"><h2>Formatting</h2><div id="common-options" class="option-list"></div></section>
        <section class="settings-section"><h2>Language plugins</h2><p class="help">Load the formatters your example uses.</p><label class="sr-only" for="plugin-search">Find a language plugin</label><input id="plugin-search" type="search" placeholder="Find a language…" autocomplete="off"/><div id="plugins" class="plugin-list"></div><details class="unavailable"><summary>Node.js only</summary><div id="unavailable"></div></details></section>
        <section class="settings-section"><h2>Language options</h2><p class="help">Options from the loaded plugins.</p><p class="help option-instructions" id="array-option-help">Lists use JSON arrays, such as <code>["html"]</code> or <code>["html", "xhtml"]</code>. Leave a field blank to use its default; <code>[]</code> sets an empty list. Press Enter or leave the field to apply.</p><label class="sr-only" for="option-search">Find an option</label><input id="option-search" type="search" placeholder="Find an option…" autocomplete="off"/><div id="language-options" class="option-list"></div></section>
      </fieldset>
    </div>
    <div id="json-panel" role="tabpanel" aria-labelledby="json-tab" hidden><p class="json-help">Use your .prettierrc options, including plugins and embedded* settings. JSONC comments are supported.</p><div id="config-editor"></div><button id="copy-config" class="config-copy">${icon("copy")} Copy .prettierrc.json</button></div>
  </aside>
  <main class="editors" aria-label="Formatting playground">
    <div class="workspace-toolbar"><button id="toggle-settings" class="text-button" aria-expanded="false" aria-controls="settings">Options</button><label for="example">Example</label><select id="example" aria-label="Load an example"></select><span class="toolbar-spacer"></span><label for="parser">Parser</label><select id="parser"><option>typescript</option><option>babel</option><option>babel-ts</option><option>flow</option><option>espree</option><option>meriyah</option></select><label class="compare"><input id="compare" type="checkbox"/> Compare</label><button id="format" class="primary" title="Format code (${formatShortcut})" aria-keyshortcuts="${isLinux ? "Control+Shift+I" : "Alt+Shift+F"}">Format</button></div>
    <div id="error" role="alert" hidden><strong id="error-title">Formatting error</strong><pre id="error-message"></pre></div>
    <div class="editor-grid">
      <section class="editor-pane input-pane"><div class="pane-header"><h1>Input</h1><span class="pane-hint">Edit your JavaScript or TypeScript</span></div><div id="source-editor" class="editor-mount"></div><div class="pane-footer"><span id="input-size"></span><span id="source-status" role="status">${shortcutHint}</span><button id="copy-report" class="text-button">Copy issue report</button></div></section>
      <section class="editor-pane output-pane"><div class="pane-header"><div class="tabs output-tabs" role="tablist" aria-label="Output formatter"><button id="embed-tab" role="tab" aria-controls="output-panel" aria-selected="true">With embed</button><button id="prettier-tab" role="tab" aria-controls="output-panel" aria-selected="false" tabindex="-1" hidden>Prettier</button></div><button id="copy-output" class="icon-button" aria-label="Copy output" title="Copy output">${icon("copy")}</button></div><div id="output-panel" role="tabpanel" aria-labelledby="embed-tab" class="output-content"><div id="output-editor" class="editor-mount"></div></div><div class="pane-footer"><span id="format-status" role="status" aria-live="polite">Loading formatter…</span></div></section>
    </div>
    <details id="warnings" class="warnings" hidden><summary>Formatter warnings <span id="warning-count"></span></summary><pre id="warning-message"></pre></details>
  </main>
</div>
<footer class="app-footer"><span id="versions">prettier-plugin-embed ${embedVersion}</span><span>Code runs in your browser.<a href="https://github.com/Sec-ant/prettier-plugin-embed#readme" target="_blank" rel="noreferrer">Documentation</a></span></footer>
<div id="toast" class="toast" role="status" hidden></div>`;
const $ = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T;
let state = initialState();
let startupNotice = "";
let dismissedNotice = "";
try {
  state = location.hash ? decodeState(location.hash) : (savedState() ?? state);
} catch (error) {
  startupNotice = `${String(error)} Loaded the default example.`;
}
let last: FormatResponse | undefined;
let failureMessage = "";
let outputMode: "embed" | "prettier" = "embed";
let metadata: OptionInfo[] = [];
let metadataKey = "";
let configValid = true;
let saveTimer: ReturnType<typeof setTimeout>;
let toastTimer: ReturnType<typeof setTimeout>;
let config: Record<string, unknown> = {};
const source = createEditor(
  $("source-editor"),
  "Input source code",
  state.code,
  (code) => {
    state.code = code;
    $<HTMLSelectElement>("example").value = "custom";
    schedule();
  },
);
const output = createEditor($("output-editor"), "Formatted output", "");
const configEditor = createEditor(
  $("config-editor"),
  "Prettier configuration JSONC",
  state.config,
  (text) => {
    state.config = text;
    validateConfig();
    if (configValid) {
      renderOptions();
      renderPlugins();
    }
    schedule();
  },
  "config",
);
const formatter = new Formatter(
  receive,
  (message) => {
    last = undefined;
    showError("Formatter error", message);
  },
  () => {
    $("copy-report").toggleAttribute("disabled", true);
    $("copy-output").toggleAttribute("disabled", true);
    $("format-status").textContent = "Formatting…";
    $("source-status").textContent = "Formatting…";
    $("output-panel").setAttribute("aria-busy", "true");
  },
);

function validateConfig() {
  try {
    config = parseConfig(state.config);
    state.plugins = configuredPluginIds(config.plugins, state.plugins);
    configValid = true;
    $("option-fields").removeAttribute("disabled");
    const parser =
      typeof config.parser === "string" ? config.parser : "typescript";
    $("parser").toggleAttribute("disabled", false);
    const select = $<HTMLSelectElement>("parser");
    if (![...select.options].some((option) => option.value === parser))
      select.add(new Option(parser, parser));
    select.value = parser;
    source.language(parser);
    output.language(parser);
  } catch (error) {
    configValid = false;
    $("option-fields").setAttribute("disabled", "");
    $("parser").toggleAttribute("disabled", true);
    formatter.cancelPending();
    showError(
      "Configuration error",
      error instanceof Error ? error.message : String(error),
    );
  }
}
function updateInputSize() {
  $("input-size").textContent =
    `${state.code.split("\n").length} lines · ${state.code.length.toLocaleString()} characters`;
}
function schedule(immediate = false) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(persist, 500);
  updateInputSize();
  if (configValid) {
    formatter.schedule(
      {
        code: state.code,
        config: state.config,
        plugins: state.plugins,
        compare: state.compare,
      },
      immediate,
    );
  } else {
    formatter.cancelPending();
  }
}
function persist() {
  let hash: string;
  try {
    hash = encodeState({
      ...state,
      versions: last?.versions ?? state.versions,
    });
  } catch {
    return;
  }
  try {
    localStorage.setItem("embed-playground", hash);
  } catch {
    /* Storage can be disabled. */
  }
  try {
    history.replaceState(null, "", hash);
  } catch {
    /* Large examples can still be edited. */
  }
}
function showError(title: string, message: string) {
  failureMessage = message;
  $("copy-report").toggleAttribute("disabled", false);
  $("copy-output").toggleAttribute("disabled", true);
  $("error").hidden = false;
  $("error-title").textContent = title;
  $("error-message").textContent = message;
  $("format-status").textContent = title;
  $("source-status").textContent = title;
  $("output-panel").removeAttribute("aria-busy");
  output.set("");
}
function receive(response: FormatResponse) {
  last = response;
  failureMessage = "";
  $("copy-report").toggleAttribute("disabled", false);
  $("source-status").textContent = shortcutHint;
  $("output-panel").removeAttribute("aria-busy");
  $("versions").textContent =
    `embed ${response.versions.embed} · Prettier ${response.versions.prettier}`;
  const pluginMismatch = state.plugins.some((id) => {
    const name = packageNames[id];
    return (
      name &&
      state.versions?.plugins?.[name] &&
      state.versions.plugins[name] !== response.versions.plugins?.[name]
    );
  });
  if (
    state.versions &&
    (state.versions.embed !== response.versions.embed ||
      state.versions.prettier !== response.versions.prettier ||
      pluginMismatch)
  ) {
    notice(
      `This example was shared with embed ${state.versions.embed} / Prettier ${state.versions.prettier}. This build uses embed ${response.versions.embed} / Prettier ${response.versions.prettier}; results or language-plugin versions may differ.`,
    );
  }
  if (response.options) {
    const key = JSON.stringify(response.options);
    if (key !== metadataKey) {
      metadataKey = key;
      metadata = response.options;
      renderOptions();
    }
  }
  $("warnings").hidden = response.warnings.length === 0;
  $("warning-count").textContent = `(${response.warnings.length})`;
  $("warning-message").textContent = [...new Set(response.warnings)].join("\n");
  renderOutput();
}
function renderOutput() {
  if (!last || !configValid) return;
  const error = outputMode === "prettier" ? last.baselineError : last.error;
  if (error) {
    showError(
      outputMode === "prettier" ? "Prettier error" : "Formatting error",
      error,
    );
    return;
  }
  $("error").hidden = true;
  $("copy-output").toggleAttribute("disabled", false);
  output.set((outputMode === "prettier" ? last.baseline : last.output) ?? "");
  const time =
    last.duration === undefined ? "" : ` · ${last.duration.toFixed(1)} ms`;
  const comparison =
    state.compare && last.baseline !== undefined && last.output !== undefined
      ? last.baseline === last.output
        ? " · same output"
        : " · outputs differ"
      : "";
  $("format-status").textContent = `Formatted${time}${comparison}`;
}
function updateConfig(name: string, value: unknown) {
  if (value === undefined) delete config[name];
  else config[name] = value;
  state.config = JSON.stringify(config, null, 2);
  configEditor.set(state.config);
  validateConfig();
  schedule();
}
function renderOptions() {
  const common = [
    "printWidth",
    "tabWidth",
    "useTabs",
    "singleQuote",
    "semi",
    "trailingComma",
    "bracketSpacing",
  ];
  const defaults: Record<string, OptionInfo> = {
    printWidth: { name: "printWidth", type: "int", default: 80 },
    tabWidth: { name: "tabWidth", type: "int", default: 2 },
    useTabs: { name: "useTabs", type: "boolean", default: false },
    singleQuote: { name: "singleQuote", type: "boolean", default: false },
    semi: { name: "semi", type: "boolean", default: true },
    bracketSpacing: { name: "bracketSpacing", type: "boolean", default: true },
    trailingComma: {
      name: "trailingComma",
      type: "choice",
      default: "all",
      choices: ["all", "es5", "none"].map((value) => ({ value })),
    },
  };
  $("common-options").replaceChildren(
    ...common.map((name) =>
      optionField(
        metadata.find((option) => option.name === name) ?? defaults[name]!,
      ),
    ),
  );
  const scopes = [
    "Json",
    "Es",
    "Ts",
    ...state.plugins.flatMap((id) =>
      id === "sh" ? ["Sh", "Dockerfile"] : [languagePlugins[id].scope],
    ),
  ];
  const search = $<HTMLInputElement>("option-search").value.toLowerCase();
  const available = metadata.filter((option) => {
    if (
      option.deprecated ||
      option.name.startsWith("__") ||
      common.includes(option.name) ||
      option.name === "parser" ||
      option.name === "plugins"
    )
      return false;
    if (!option.name.toLowerCase().includes(search)) return false;
    if (
      option.name.startsWith("embedded") &&
      option.name !== "embeddedOverrides" &&
      option.name !== "embeddedLanguageFormatting"
    ) {
      return scopes.some((scope) =>
        ["Comments", "Tags", "Identifiers", "Parser", "Plugin"].some(
          (suffix) => option.name === `embedded${scope}${suffix}`,
        ),
      );
    }
    return (
      option.category === "Embed" ||
      !["Global", "Common", "Special", "JavaScript", "Other"].includes(
        option.category ?? "Other",
      )
    );
  });
  $("language-options").replaceChildren(...available.map(optionField));
  if (!available.length)
    $("language-options").textContent = metadata.length
      ? "No matching options."
      : "Loading option metadata…";
}
function optionField(option: OptionInfo): HTMLLabelElement {
  const label = document.createElement("label");
  label.className = "option";
  label.title = option.description ?? option.name;
  const name = document.createElement("span");
  name.id = `option-${option.name}-label`;
  name.textContent = option.name;
  label.append(name);
  const value = config[option.name];
  if (option.type === "boolean" && !option.array) {
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = Boolean(value ?? option.default);
    input.addEventListener("change", () =>
      updateConfig(option.name, input.checked),
    );
    label.append(input);
  } else if (option.type === "choice" && !option.array) {
    const select = document.createElement("select");
    for (const choice of option.choices ?? [])
      select.add(
        new Option(String(choice.value), JSON.stringify(choice.value)),
      );
    select.value = JSON.stringify(value ?? option.default);
    select.addEventListener("change", () =>
      updateConfig(option.name, JSON.parse(select.value)),
    );
    label.append(select);
  } else {
    label.classList.add("stacked");
    const input = document.createElement("input");
    input.type = option.type === "int" && !option.array ? "number" : "text";
    input.setAttribute("aria-labelledby", name.id);
    input.value =
      value === undefined
        ? ""
        : option.array
          ? JSON.stringify(value)
          : String(value);
    const tagList =
      option.name === "preserveEmbeddedExteriorWhitespaces" ||
      option.name === "noEmbeddedMultiLineIndentation";
    input.placeholder = option.array
      ? tagList
        ? '["html"]'
        : "JSON array"
      : option.default === undefined
        ? "Default"
        : String(option.default);
    if (option.array)
      input.setAttribute("aria-describedby", "array-option-help");
    input.addEventListener("input", () => {
      input.setCustomValidity("");
      input.removeAttribute("aria-invalid");
    });
    const apply = () => {
      try {
        const next: unknown =
          input.value === "" || (option.array && input.value.trim() === "")
            ? undefined
            : option.array
              ? JSON.parse(input.value)
              : input.type === "number"
                ? Number(input.value)
                : input.value;
        if (option.array && next !== undefined && !Array.isArray(next))
          throw new Error(
            'Enter a JSON array with entries in double quotes, for example ["html"].',
          );
        if (
          option.array &&
          option.type === "string" &&
          Array.isArray(next) &&
          !next.every((item) => typeof item === "string")
        )
          throw new Error(
            'Every entry must be a string, for example ["html", "xhtml"].',
          );
        if (
          input.type === "number" &&
          next !== undefined &&
          !Number.isInteger(next)
        )
          throw new Error("Enter an integer.");
        updateConfig(option.name, next);
      } catch (error) {
        const message =
          option.array && error instanceof SyntaxError
            ? 'Use valid JSON with square brackets and double quotes, for example ["html"].'
            : error instanceof Error
              ? error.message
              : String(error);
        input.setCustomValidity(message);
        input.setAttribute("aria-invalid", "true");
        input.reportValidity();
      }
    };
    input.addEventListener("change", apply);
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.isComposing) {
        event.preventDefault();
        apply();
      }
    });
    label.append(input);
    if (tagList) {
      const help = document.createElement("small");
      help.className = "option-help";
      help.id = `${option.name}-help`;
      help.textContent =
        option.name === "preserveEmbeddedExteriorWhitespaces"
          ? 'Keep the original whitespace at the start and end of matching templates. For html`…` or /* html */ `…`, use ["html"].'
          : 'Skip the extra template indentation; nested HTML elements still get formatted. For html`…` or /* html */ `…`, use ["html"].';
      input.setAttribute("aria-describedby", `array-option-help ${help.id}`);
      label.append(help);
    }
  }
  return label;
}
function renderPlugins() {
  const search = $<HTMLInputElement>("plugin-search").value.toLowerCase();
  const rows = pluginIds
    .filter((id) => languagePlugins[id].label.toLowerCase().includes(search))
    .sort((a, b) =>
      languagePlugins[a].label.localeCompare(languagePlugins[b].label),
    )
    .map((id) => {
      const label = document.createElement("label");
      label.className = "plugin-option";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = state.plugins.includes(id);
      if (builtinPluginIds.includes(id)) {
        input.disabled = true;
        input.checked = true;
        label.title = "Included with the source parsers.";
      }
      input.addEventListener("change", () => {
        state.plugins = input.checked
          ? [...state.plugins, id]
          : state.plugins.filter((item) => item !== id);
        updateConfig("plugins", nativePluginNames(state.plugins));
        if (id === "sql" || id === "sql-cst") {
          const active = input.checked
            ? id
            : state.plugins.find(
                (item) => item === "sql" || item === "sql-cst",
              );
          updateConfig(
            "embeddedSqlPlugin",
            active === "sql"
              ? "prettier-plugin-sql"
              : active === "sql-cst"
                ? "prettier-plugin-sql-cst"
                : undefined,
          );
        }
        metadataKey = "";
        renderOptions();
        schedule();
      });
      const text = document.createElement("span");
      text.textContent = languagePlugins[id].label;
      label.append(input, text);
      return label;
    });
  $("plugins").replaceChildren(...rows);
  if (!rows.length) $("plugins").textContent = "No matching languages.";
}
function notice(message: string) {
  $("notice").hidden = !message || message === dismissedNotice;
  $("notice-message").textContent = message;
}
$("dismiss-notice").addEventListener("click", () => {
  dismissedNotice = $("notice-message").textContent ?? "";
  $("notice").hidden = true;
  $("format").focus();
});
function toast(message: string) {
  clearTimeout(toastTimer);
  $("toast").hidden = false;
  $("toast").textContent = message;
  toastTimer = setTimeout(() => {
    $("toast").hidden = true;
  }, 3500);
}
async function copy(text: string, message: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast(message);
  } catch {
    toast(
      "Clipboard unavailable. Select and copy the text, or copy the link from the address bar.",
    );
  }
}
function activateTabs(ids: string[], active: string) {
  for (const id of ids) {
    const selected = id === active;
    $(id).setAttribute("aria-selected", String(selected));
    $(id).tabIndex = selected ? 0 : -1;
  }
}
for (const id of ["options-tab", "json-tab"])
  $(id).addEventListener("click", () => {
    activateTabs(["options-tab", "json-tab"], id);
    $("options-panel").hidden = id !== "options-tab";
    $("json-panel").hidden = id !== "json-tab";
    configEditor.view.requestMeasure();
  });
for (const id of ["embed-tab", "prettier-tab"])
  $(id).addEventListener("click", () => {
    activateTabs(["embed-tab", "prettier-tab"], id);
    outputMode = id === "embed-tab" ? "embed" : "prettier";
    $("output-panel").setAttribute("aria-labelledby", id);
    renderOutput();
  });
for (const tablist of document.querySelectorAll<HTMLElement>(
  '[role="tablist"]',
))
  tablist.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    const tabs = [
      ...tablist.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
    ].filter((tab) => !tab.hidden);
    const index = tabs.indexOf(document.activeElement as HTMLButtonElement);
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? tabs.length - 1
          : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) %
            tabs.length;
    event.preventDefault();
    tabs[next]?.focus();
    tabs[next]?.click();
  });
$("compare").addEventListener("change", () => {
  state.compare = $<HTMLInputElement>("compare").checked;
  syncCompare();
  schedule(true);
});
$("parser").addEventListener("change", () =>
  updateConfig("parser", $<HTMLSelectElement>("parser").value),
);
$("format").addEventListener("click", () => schedule(true));
$("reset").addEventListener("click", () => {
  state.config = initialState().config;
  configEditor.set(state.config);
  validateConfig();
  renderPlugins();
  renderOptions();
  schedule(true);
});
$("plugin-search").addEventListener("input", renderPlugins);
$("option-search").addEventListener("input", renderOptions);
const example = $<HTMLSelectElement>("example");
example.add(new Option("Custom input", "custom"));
for (const [id, sample] of Object.entries(samples))
  example.add(new Option(sample.label, id));
example.addEventListener("change", () => {
  const sample = samples[example.value]!;
  if (!sample) return;
  state = {
    v: 1,
    code: sample.code,
    config: sample.config,
    plugins: [...sample.plugins],
    compare: state.compare,
  };
  source.set(state.code);
  configEditor.set(state.config);
  validateConfig();
  renderPlugins();
  renderOptions();
  notice("");
  schedule(true);
});
$("share").addEventListener("click", () => {
  persist();
  try {
    const url = new URL(location.href);
    url.hash = encodeState({
      ...state,
      versions: last?.versions ?? state.versions,
    });
    void copy(url.href, "Playground link copied");
  } catch (error) {
    toast(error instanceof Error ? error.message : String(error));
  }
});
$("copy-output").addEventListener("click", () => {
  void copy(output.view.state.doc.toString(), "Output copied");
});
$("copy-config").addEventListener("click", async () => {
  if (!configValid) {
    toast("Fix the JSONC configuration before copying it.");
    return;
  }
  const plugins = [
    "prettier-plugin-embed",
    ...new Set(
      state.plugins.flatMap((id) =>
        packageNames[id] ? [packageNames[id]!] : [],
      ),
    ),
  ];
  void copy(
    JSON.stringify(
      {
        plugins,
        ...(state.plugins.includes("php") ? { phpVersion: "8.5" } : {}),
        ...config,
      },
      null,
      2,
    ),
    "Prettier configuration copied",
  );
});
function fenced(text: string, language: string) {
  const length =
    Math.max(
      2,
      ...Array.from(text.matchAll(/`+/g), (match) => match[0].length),
    ) + 1;
  const fence = "`".repeat(length);
  return `${fence}${language}\n${text}\n${fence}`;
}
$("copy-report").addEventListener("click", () => {
  persist();
  const versions = last?.versions;
  const packages = new Set(state.plugins.map((id) => packageNames[id]));
  const versionLines = [
    `prettier-plugin-embed ${versions?.embed ?? embedVersion}`,
    `Prettier ${versions?.prettier ?? "unknown"}`,
    ...Object.entries(versions?.plugins ?? {})
      .filter(([name]) => packages.has(name))
      .map(([name, version]) => `${name} ${version}`),
  ];
  let sharedUrl: string;
  try {
    const url = new URL(location.href);
    url.hash = encodeState({ ...state, versions });
    sharedUrl = url.href;
  } catch {
    sharedUrl = `${location.origin}${location.pathname} (Example too large for a shared link; see the input below.)`;
  }
  const report = [
    "### Versions",
    versionLines.join("\n"),
    "### Playground",
    sharedUrl,
    "### Input",
    fenced(state.code, "typescript"),
    "### Configuration",
    fenced(
      configValid && config.plugins === undefined
        ? JSON.stringify(
            { plugins: nativePluginNames(state.plugins), ...config },
            null,
            2,
          )
        : state.config,
      "jsonc",
    ),
    "### Output",
    fenced(
      (!configValid
        ? failureMessage
        : (last?.error ?? last?.output ?? failureMessage)) || "",
      "typescript",
    ),
  ].join("\n\n");
  void copy(report, "Issue report copied");
});
$("close-settings").addEventListener("click", () => {
  app.classList.remove("settings-open");
  $("toggle-settings").setAttribute("aria-expanded", "false");
  source.view.requestMeasure();
  output.view.requestMeasure();
  $("toggle-settings").focus();
});
$("toggle-settings").addEventListener("click", () => {
  const open = !app.classList.contains("settings-open");
  app.classList.toggle("settings-open", open);
  $("toggle-settings").setAttribute("aria-expanded", String(open));
  if (open) $($("json-panel").hidden ? "options-tab" : "json-tab").focus();
});
function setTheme(theme: "light" | "dark") {
  document.documentElement.dataset.theme = theme;
  $("theme").setAttribute(
    "aria-label",
    `Switch to ${theme === "dark" ? "light" : "dark"} theme`,
  );
}
const systemTheme = matchMedia("(prefers-color-scheme: dark)");
let themePreference: string | null = null;
try {
  themePreference = localStorage.getItem("embed-theme");
} catch {
  /* System theme remains available. */
}
setTheme(
  themePreference === "light" || themePreference === "dark"
    ? themePreference
    : systemTheme.matches
      ? "dark"
      : "light",
);
systemTheme.addEventListener("change", () => {
  if (!themePreference) setTheme(systemTheme.matches ? "dark" : "light");
});
$("theme").addEventListener("click", () => {
  themePreference =
    document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  setTheme(themePreference as "light" | "dark");
  try {
    localStorage.setItem("embed-theme", themePreference);
  } catch {
    /* Session theme still applies. */
  }
});
window.addEventListener("keydown", (event) => {
  if (
    source.view.hasFocus &&
    event.shiftKey &&
    !event.metaKey &&
    (isLinux
      ? event.ctrlKey && !event.altKey && event.code === "KeyI"
      : event.altKey && !event.ctrlKey && event.code === "KeyF")
  ) {
    event.preventDefault();
    schedule(true);
  }
});
window.addEventListener("hashchange", () => {
  if (!location.hash) return;
  try {
    state = decodeState(location.hash);
    source.set(state.code);
    syncExample();
    configEditor.set(state.config);
    syncCompare();
    validateConfig();
    renderPlugins();
    renderOptions();
    schedule(true);
  } catch (error) {
    notice(String(error));
  }
});
window.addEventListener("pagehide", () => {
  persist();
  formatter.destroy();
});
window.addEventListener("pageshow", (event) => {
  if (event.persisted) schedule(true);
});
function syncCompare() {
  $<HTMLInputElement>("compare").checked = state.compare;
  $("prettier-tab").hidden = !state.compare;
  source.view.requestMeasure();
  output.view.requestMeasure();
  if (!state.compare) $("embed-tab").click();
}
$("unavailable").replaceChildren(
  ...Object.entries(unavailablePlugins).map(([name, reason]) => {
    const p = document.createElement("p");
    p.textContent = `${name}: ${reason}`;
    return p;
  }),
);
function syncExample() {
  example.value =
    Object.entries(samples).find(
      ([, sample]) => sample.code === state.code,
    )?.[0] ?? "custom";
}
notice(startupNotice);
syncExample();
$("json-tab").click();
syncCompare();
validateConfig();
renderPlugins();
renderOptions();
schedule(true);
