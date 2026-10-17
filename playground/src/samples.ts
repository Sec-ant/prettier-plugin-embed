import { nativePluginNames } from "./package-names";
import { builtinPluginIds, type PluginId } from "./plugins";
import type { PlaygroundState } from "./types";

const basic = import.meta.glob<string>("../../tests/fixtures/*/basic.js", {
  eager: true,
  query: "?raw",
  import: "default",
});
const configs = import.meta.glob<{
  plugins?: string[];
  [key: string]: unknown;
}>("../../tests/fixtures/*/options.json", { eager: true, import: "default" });
export const corePlugins = builtinPluginIds;
const aliases: Record<string, PluginId> = {
  es: "javascript",
  ts: "typescript",
  dockerfile: "sh",
};
export interface Sample {
  label: string;
  code: string;
  plugins: PluginId[];
  config: string;
}
const mixed = `// Tags, comments and JavaScript expressions work together.
const query = sql\`
select id,name,email from users where active=true order by name
\`;

const styles = css\`
.card{display:grid;gap:16px;color:rebeccapurple}
\`;

const view = html\`
<section class="card"><h1>\${title}</h1><p>Format the languages inside your code.</p></section>
\`;

const settings = /* json */ \`
{"theme":"light","editor":{"tabSize":2,"wordWrap":true}}
\`;
`;
export const samples: Record<string, Sample> = {
  mixed: {
    label: "Mixed languages",
    code: mixed,
    plugins: [...corePlugins, "sql"],
    config: JSON.stringify(
      {
        plugins: nativePluginNames([...corePlugins, "sql"]),
        parser: "typescript",
        printWidth: 80,
      },
      null,
      2,
    ),
  },
};
for (const [file, code] of Object.entries(basic)) {
  const language = file.split("/").at(-2)!;
  if (["astro", "ruby", "prisma", "noop"].includes(language)) continue;
  const { plugins: _, ...options } =
    configs[`../../tests/fixtures/${language}/options.json`] ?? {};
  const plugin = aliases[language] ?? (language as PluginId);
  samples[language] = {
    label:
      language === "es"
        ? "JavaScript"
        : language === "ts"
          ? "TypeScript"
          : language,
    code,
    plugins: [...new Set([...corePlugins, plugin])],
    config: JSON.stringify(
      {
        plugins: nativePluginNames([...corePlugins, plugin]),
        parser: "typescript",
        printWidth: 80,
        ...options,
      },
      null,
      2,
    ),
  };
}
export function initialState(): PlaygroundState {
  const sample = samples.mixed!;
  return {
    v: 1,
    code: sample.code,
    config: sample.config,
    plugins: [...sample.plugins],
    compare: false,
  };
}
