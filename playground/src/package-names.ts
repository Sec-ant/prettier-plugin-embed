import { builtinPluginIds, type PluginId } from "./plugins.ts";

export const packageNames: Partial<Record<PluginId, string>> = {
  powershell: "prettier-plugin-powershell",
  pug: "@prettier/plugin-pug",
  sql: "prettier-plugin-sql",
  "sql-cst": "prettier-plugin-sql-cst",
  xml: "@prettier/plugin-xml",
  svelte: "prettier-plugin-svelte",
  liquid: "@shopify/prettier-plugin-liquid",
  jsonata: "@stedi/prettier-plugin-jsonata",
  toml: "prettier-plugin-toml",
  ini: "prettier-plugin-ini",
  java: "prettier-plugin-java",
  glsl: "prettier-plugin-glsl",
  gherkin: "prettier-plugin-gherkin",
  jinja: "prettier-plugin-jinja-template",
  jte: "prettier-plugin-jte",
  latex: "prettier-plugin-latex",
  handlebars: "@poliklot/prettier-plugin-handlebars",
  mustache: "prettier-plugin-mustache",
  nunjucks: "prettier-plugin-nunjucks",
  nginx: "prettier-plugin-nginx",
  pegjs: "prettier-plugin-pegjs",
  php: "@prettier/plugin-php",
  properties: "prettier-plugin-properties",
  solidity: "prettier-plugin-solidity",
  xquery: "prettier-plugin-xquery",
  "go-template": "@htnabe/prettier-plugin-go-template",
  hugo: "@htnabe/prettier-plugin-hugo-post",
  marko: "prettier-plugin-marko",
  motoko: "prettier-plugin-motoko",
  sh: "prettier-plugin-sh",
};

export function configuredPluginIds(
  value: unknown,
  fallback: PluginId[],
): PluginId[] {
  if (value === undefined) return fallback;
  if (!Array.isArray(value) || !value.every((name) => typeof name === "string"))
    throw new Error(
      'plugins must be an array of package names, such as ["prettier-plugin-embed", "prettier-plugin-sql"].',
    );
  const ids: PluginId[] = [...builtinPluginIds];
  for (const name of value) {
    if (name === "prettier-plugin-embed") continue;
    const entry = Object.entries(packageNames).find(([, pkg]) => pkg === name);
    if (!entry)
      throw new Error(
        `The plugin "${name}" is not available in this browser playground. Use a bundled language plugin or run this configuration locally.`,
      );
    ids.push(entry[0] as PluginId);
  }
  return [...new Set(ids)];
}

export function nativePluginNames(ids: PluginId[]) {
  return [
    "prettier-plugin-embed",
    ...new Set(
      ids.flatMap((id) => (packageNames[id] ? [packageNames[id]!] : [])),
    ),
  ];
}
