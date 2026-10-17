// Explicit imports let Vite emit self-hosted, independently cached plugin chunks.
export const languagePlugins = {
  powershell: { label: "PowerShell", scope: "Powershell" },
  pug: { label: "Pug", scope: "Pug" },
  css: { label: "CSS / SCSS", scope: "Css" },
  html: { label: "HTML / Vue / Angular", scope: "Html" },
  json: { label: "JSON / JSONC / JSON5", scope: "Json" },
  yaml: { label: "YAML", scope: "Yaml" },
  markdown: { label: "Markdown / MDX", scope: "Markdown" },
  graphql: { label: "GraphQL", scope: "Graphql" },
  javascript: { label: "JavaScript", scope: "Es" },
  typescript: { label: "TypeScript", scope: "Ts" },
  sql: { label: "SQL · sql-formatter", scope: "Sql" },
  "sql-cst": { label: "SQL · sql-parser-cst", scope: "Sql" },
  xml: { label: "XML / SVG", scope: "Xml" },
  svelte: { label: "Svelte", scope: "Svelte" },
  liquid: { label: "Liquid", scope: "Liquid" },
  jsonata: { label: "JSONata", scope: "Jsonata" },
  toml: { label: "TOML", scope: "Toml" },
  ini: { label: "INI", scope: "Ini" },
  java: { label: "Java", scope: "Java" },
  glsl: { label: "GLSL", scope: "Glsl" },
  gherkin: { label: "Gherkin", scope: "Gherkin" },
  jinja: { label: "Jinja", scope: "Jinja" },
  jte: { label: "JTE", scope: "Jte" },
  latex: { label: "LaTeX", scope: "Latex" },
  handlebars: { label: "Handlebars", scope: "Handlebars" },
  mustache: { label: "Mustache", scope: "Mustache" },
  nunjucks: { label: "Nunjucks", scope: "Nunjucks" },
  nginx: { label: "NGINX", scope: "Nginx" },
  pegjs: { label: "PEG.js", scope: "Pegjs" },
  php: { label: "PHP", scope: "Php" },

  properties: { label: "Properties", scope: "Properties" },
  solidity: { label: "Solidity", scope: "Solidity" },
  xquery: { label: "XQuery", scope: "Xquery" },
  "go-template": { label: "Go templates", scope: "GoTemplate" },
  hugo: { label: "Hugo", scope: "Hugo" },
  marko: { label: "Marko", scope: "Marko" },
  motoko: { label: "Motoko", scope: "Motoko" },
  sh: { label: "Shell / Dockerfile", scope: "Sh" },
} as const;

export type PluginId = keyof typeof languagePlugins;
export const builtinPluginIds: PluginId[] = [
  "css",
  "html",
  "json",
  "yaml",
  "markdown",
  "graphql",
  "javascript",
  "typescript",
];
export const pluginIds = Object.keys(languagePlugins) as PluginId[];
export const unavailablePlugins: Record<string, string> = {
  Astro:
    "The installed formatter uses a native compiler; its threaded WASM requires cross-origin isolation. Use Node.js for this language.",
  Ruby: "Requires Ruby and the syntax_tree gem on the host.",
  Prisma:
    "The installed Prisma formatter loads its WASM using Node filesystem APIs.",
};
