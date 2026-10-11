<div align="center">

![prettier-plugin-embed-wide-logo](./asset/prettier-plugin-embed-wide-light.svg#gh-light-mode-only)
![prettier-plugin-embed-wide-logo](./asset/prettier-plugin-embed-wide-dark.svg#gh-dark-mode-only)

# Prettier Plugin Embed

[![npm version](https://img.shields.io/npm/v/prettier-plugin-embed?cacheSeconds=300)](https://www.npmjs.com/package/prettier-plugin-embed/v/latest) [![npm downloads](https://img.shields.io/npm/dm/prettier-plugin-embed?cacheSeconds=300)](https://www.npmjs.com/package/prettier-plugin-embed/v/latest) [![npm license](https://img.shields.io/npm/l/prettier-plugin-embed?cacheSeconds=300)](https://www.npmjs.com/package/prettier-plugin-embed/v/latest) [![All Contributors](https://img.shields.io/github/all-contributors/Sec-ant/prettier-plugin-embed?color=56b3b4)](#contributors)

[![github last commit](https://img.shields.io/github/last-commit/Sec-ant/prettier-plugin-embed?cacheSeconds=300)](https://github.com/Sec-ant/prettier-plugin-embed) [![bundlephobia minzipped](https://img.shields.io/bundlephobia/minzip/prettier-plugin-embed?cacheSeconds=300)](https://bundlephobia.com/package/prettier-plugin-embed@latest) [![](https://img.shields.io/jsdelivr/npm/hm/prettier-plugin-embed?cacheSeconds=300&color=ff5627)](https://www.jsdelivr.com/package/npm/prettier-plugin-embed)

A configurable [Prettier](https://prettier.io/) [plugin](https://prettier.io/docs/en/plugins.html) to format [embedded languages](https://prettier.io/docs/en/options.html#embedded-language-formatting) in JS/TS Files.

```bash
npm i -D prettier prettier-plugin-embed
```

</div>

## Introduction

This plugin formats embedded languages in JavaScript and TypeScript template literals. Block comments and tags identify the language, and each integration delegates formatting to Prettier or a loaded language plugin.

It adds per-language controls, configurable identifiers, and per-identifier overrides to Prettier's embedded formatting. See [prettier/prettier#4424](https://github.com/prettier/prettier/issues/4424) and [prettier/prettier#5588](https://github.com/prettier/prettier/issues/5588) for related use cases.

## Features

- **Supported Languages:** Format embedded CSS, JavaScript/TypeScript, HTML, GraphQL, JSON/JSONata, SQL, XML, YAML, and more. The [language matrix](#language-specific-options) lists every supported language, its default identifiers, and any required language plugin.

- **Dual Identification Modes:** Identify embedded languages by block comments `` /* comment */ `...` `` or tags `` tag`...` `` preceding the template literals.

- **Customizable Language Comments or Tags:** Customize the comments or tags used for identifying the embedded languages.

- **Formatting Opt-out Mechanism:** Offer the capability to deactivate formatting for certain comments or tags, including the built-in ones (`html`, `css`...) supported by the `embedded-language-formatting` option.

- **Configurable Formatting Style:** Provide additional options to tailor the formatting style for embedded languages.

- **Strongly Typed API:** Benefit from comprehensive type support for configuring this plugin's options.

- **Easy Integration:** Integrate with the existing Prettier setup seamlessly, requiring minimal configuration to get started.

## Installation

```bash
npm i -D prettier prettier-plugin-embed
```

Prettier is a peer dependency. Install the formatter plugin for each embedded language you use as a separate project dependency; the language table below shows which integrations require one.

Choose a Prettier version accepted by this plugin and every loaded language plugin. Each language plugin declares its own Prettier peer range.

## Usage

### Getting Started

This is a Prettier plugin, which follows the [standard usage pattern](https://prettier.io/docs/en/plugins.html#using-plugins) of many other Prettier plugins:

#### [CLI](https://prettier.io/docs/en/cli):

Via `--plugin`:

```bash
prettier --write main.ts --plugin=prettier-plugin-embed
```

#### [API](https://prettier.io/docs/en/api):

Via the `plugins` options:

```ts
await prettier.format(code, {
  filepath: "main.ts",
  plugins: ["prettier-plugin-embed"],
});
```

#### [Configuration File](https://prettier.io/docs/en/configuration):

```json
{
  "plugins": ["prettier-plugin-embed"]
}
```

For Yarn Plug'n'Play, load plugin objects from a JavaScript config so the imports resolve through Yarn's dependency map.

```js
import * as prettierPluginEmbed from "prettier-plugin-embed";

export default {
  plugins: [prettierPluginEmbed],
};
```

### Quick Start Config Examples

See [Config Examples](./ConfigExamples.md) for complete language plugin configurations and sample output.

### Language identification and overrides

Set `embeddedLanguageFormatting` to `"auto"` (Prettier's default) to enable embedded formatting. Prettier supplies the parsers for built-in languages. Install and load the additional plugins listed in the language table for other languages.

A block comment such as `` /* sql */ `...` `` or a tag such as `` sql`...` `` selects an embedded language. Configure each language with `embedded<Language>Comments` and `embedded<Language>Tags`.

Identification follows these rules:

1. A leading block comment is checked first. A recognized comment selects its language; an unrecognized comment uses Prettier's built-in behavior.
2. Templates without a leading block comment are matched by their tag. Tags support exact identifiers, member expressions, and regular expression strings in `/pattern/flags` form.
3. `embeddedNoopComments` and `embeddedNoopTags` take priority among matching languages and preserve template content as written.
4. Other overlapping matches use the first matching language in the internal registry. Assign distinct identifiers or non-overlapping patterns to select a language explicitly.

For example, this JSON configuration matches `prisma.$queryRaw`, `client.$queryRaw`, and `ctx.prisma.$queryRaw`. JSON and JavaScript strings escape each backslash as `\\`:

```json
{
  "plugins": ["prettier-plugin-embed", "prettier-plugin-sql"],
  "embeddedSqlTags": ["/\\.\\$queryRaw$/"]
}
```

Simple identifiers support patterns too: `"/^query$/"` matches the tag `query`. Member and call expressions are represented in a normalized form for pattern matching; for example, `factory(argument).query` becomes `factory().query`.

Per-tag overrides refer to the matching entry from `embedded<Language>Tags`, including the pattern string when a regular expression matches. The first matching override applies. For example, this JavaScript configuration gives embedded JavaScript selected by `query` its own quote style:

```js
export default {
  plugins: ["prettier-plugin-embed"],
  embeddedEsTags: ["/^query$/"],
  embeddedOverrides: JSON.stringify([
    { tags: ["/^query$/"], options: { singleQuote: true } },
  ]),
};
```

Embedded parsers receive the override options. The resulting document is laid out with the surrounding JavaScript or TypeScript document, using the outer Prettier `printWidth`.

### Compatibility

This plugin supports Prettier 3. Choose a version within the peer ranges of all loaded language plugins. XML formatting obtains its parser through the consumer's installed `@prettier/plugin-xml` dependency.

The packed consumer suite covers npm, pnpm 10/11/12, Yarn Classic, Yarn Berry with node-modules and Plug'n'Play, and Bun installs. The Bun profile runs formatting with the Bun runtime; the other profiles use Node.js. The suite exercises JavaScript and TypeScript through the API and CLI, JSON/YAML/CommonJS/ESM configuration, and selected older and newer language plugin versions. Use the JavaScript configuration with imported plugin objects shown above for Yarn Plug'n'Play.

For language-specific installation and configuration examples, see [Config Examples](./ConfigExamples.md). For adding an integration and its tests, see [Contributing](./CONTRIBUTING.md).

### Language-Specific Options

Supported embedded languages and their default identifiers are listed here. Identifiers can be changed with each language's `embedded<Language>Comments` and `embedded<Language>Tags` options.

| Language                                               | Default comment/tag identifiers                             | Required language plugin                           |
| ------------------------------------------------------ | ----------------------------------------------------------- | -------------------------------------------------- |
| [CSS](#css)                                            | `css`                                                       | Prettier built in                                  |
| [ES (ECMAScript/JavaScript)](#es-ecmascriptjavascript) | `js`, `jsx`, `es`, `es6`, `mjs`, `cjs`, `pac`, `javascript` | Prettier built in                                  |
| [GLSL](#glsl)                                          | `glsl`, `shader`                                            | `prettier-plugin-glsl`                             |
| [GraphQL](#graphql)                                    | `graphql`, `gql`                                            | Prettier built in                                  |
| [HTML](#html)                                          | `html`, `xhtml`                                             | Prettier built in                                  |
| [INI](#ini)                                            | `ini`, `cfg`, `pro`                                         | `prettier-plugin-ini`                              |
| [Java](#java)                                          | `java`                                                      | `prettier-plugin-java`                             |
| [JSON](#json)                                          | `json`, `jsonl`                                             | Prettier built in                                  |
| [JSONata](#jsonata)                                    | `jsonata`                                                   | `@stedi/prettier-plugin-jsonata`                   |
| [LaTeX](#latex)                                        | `latex`, `tex`, `aux`, `cls`, `bbl`, `bib`, `toc`, `sty`    | `prettier-plugin-latex`                            |
| [Markdown](#markdown)                                  | `md`, `markdown`                                            | Prettier built in                                  |
| [NGINX](#nginx)                                        | `nginx`                                                     | `prettier-plugin-nginx`                            |
| [Pegjs](#pegjs)                                        | `pegjs`, `peggy`, `peg`                                     | `prettier-plugin-pegjs`                            |
| [PHP](#php)                                            | `php`, `php5`                                               | `@prettier/plugin-php`                             |
| [Prisma](#prisma)                                      | `prisma`                                                    | `prettier-plugin-prisma`                           |
| [Properties](#properties)                              | `properties`                                                | `prettier-plugin-properties`                       |
| [Pug](#pug)                                            | `pug`, `jade`                                               | `@prettier/plugin-pug`                             |
| [Ruby](#ruby)                                          | `ruby`                                                      | `@prettier/plugin-ruby`                            |
| [Sh (Shell)](#sh-shell)                                | `sh`                                                        | `prettier-plugin-sh`                               |
| [SQL](#sql)                                            | `sql`                                                       | `prettier-plugin-sql` or `prettier-plugin-sql-cst` |
| [TOML](#TOML)                                          | `toml`                                                      | `prettier-plugin-toml`                             |
| [TS (TypeScript)](#ts-typescript)                      | `ts`, `tsx`, `cts`, `mts`, `typescript`                     | Prettier built in                                  |
| [XML](#xml)                                            | `xml`, `opml`, `rss`, `svg`                                 | `@prettier/plugin-xml`                             |
| [YAML](#yaml)                                          | `yaml`, `yml`                                               | Prettier built in                                  |

<details open>
<summary>
Click Here to Toggle
</summary>

#### NOOP

##### `embeddedNoopComments`

- **Type**: `string[]`
- **Default**: [`[]`](./src/embedded/noop/options.ts)
- **Description**: Block comments that prevent their subsequent template literals from being identified as embedded languages and thus from being formatted.

##### `embeddedNoopTags`

- **Type**: `string[]`
- **Default**: [`[]`](./src/embedded/noop/options.ts)
- **Description**: Tags that prevent their subsequent template literals from being identified as embedded languages and thus from being formatted.

This built-in option can override native embedded language formatting for the specified comments or tags, preserving their template literal content as written.

#### CSS

##### `embeddedCssComments`

- **Type**: `string[]`
- **Default**: [`["css"]`](./src/embedded/css/options.ts)
- **Description**: Block comments that make their subsequent template literals be identified as embedded CSS language.

##### `embeddedCssTags`

- **Type**: `string[]`
- **Default**: [`["css"]`](./src/embedded/css/options.ts)
- **Description**: Tags that make their subsequent template literals be identified as embedded CSS language.

##### `embeddedCssParser`

- **Type**: [`"css" | "less" | "scss"`](./src/embedded/css/options.ts)
- **Default**: [`"scss"`](./src/embedded/css/options.ts)
- **Description**: The parser used to parse the embedded CSS language.

Embedded CSS uses the parsers and printers included with Prettier.

This can override the native formatting behavior for embedded CSS language. If you want to keep the native behavior, set `embeddedCssComments` or `embeddedCssTags` to `[]` or other values.

If you want to specify different parsers for different comments or tags, check [`embeddedOverrides`](#embeddedoverrides-1).

#### ES (ECMAScript/JavaScript)

##### `embeddedEsComments`

- **Type**: `string[]`
- **Default**: [`["js", "jsx", "es", "es6", "mjs", "cjs", "pac", "javascript"]`](./src/embedded/es/options.ts)
- **Description**: Block comments that make their subsequent template literals be identified as embedded ECMAScript/JavaScript language.

##### `embeddedEsTags`

- **Type**: `string[]`
- **Default**: [`["js", "jsx", "es", "es6", "mjs", "cjs", "pac", "javascript"]`](./src/embedded/es/options.ts)
- **Description**: Tags that make their subsequent template literals be identified as embedded ECMAScript/JavaScript language.

##### `embeddedEsParser`

- **Type**: [`"babel" | "babel-flow" | "acorn" | "espree" | "flow" | "meriyah"`](./src/embedded/es/options.ts)
- **Default**: [`"babel"`](./src/embedded/es/options.ts)
- **Description**: The parser used to parse the embedded ECMASCript/JavaScript language.

Embedded ECMAScript and JavaScript use the parsers and printers included with Prettier.

If you want to specify different parsers for different comments or tags, check [`embeddedOverrides`](#embeddedoverrides-1).

#### GLSL

##### `embeddedGlslComments`

- **Type**: `string[]`
- **Default**: [`["glsl", "shader"]`](./src/embedded/glsl/options.ts)
- **Description**: Block comments that make their subsequent template literals be identified as embedded GLSL language. This option requires the `prettier-plugin-glsl` plugin.

##### `embeddedGlslTags`

- **Type**: `string[]`
- **Default**: [`["glsl", "shader"]`](./src/embedded/glsl/options.ts)
- **Description**: Tags that make their subsequent template literals be identified as embedded GLSL language. This option requires the `prettier-plugin-glsl` plugin.

Formatting embedded GLSL language requires the [`prettier-plugin-glsl`](https://github.com/NaridaL/glsl-language-toolkit/tree/main/packages/prettier-plugin-glsl) plugin to be loaded as well.

#### GraphQL

##### `embeddedGraphqlComments`

- **Type**: `string[]`
- **Default**: [`["graphql", "gql"]`](./src/embedded/graphql/options.ts)
- **Description**: Block comments that make their subsequent template literals be identified as embedded GraphQL language.

##### `embeddedGraphqlTags`

- **Type**: `string[]`
- **Default**: [`["graphql", "gql"]`](./src/embedded/graphql/options.ts)
- **Description**: Tags that make their subsequent template literals be identified as embedded GraphQL language.

Embedded GraphQL uses the parsers and printers included with Prettier.

This can override the native formatting behavior for embedded GraphQL language. If you want to keep the native behavior, set `embeddedGraphqlComments` or `embeddedGraphqlTags` to `[]` or other values.

#### HTML

##### `embeddedHtmlComments`

- **Type**: `string[]`
- **Default**: [`["html", "xhtml"]`](./src/embedded/html/options.ts)
- **Description**: Block comments that make their subsequent template literals be identified as embedded HTML language.

##### `embeddedHtmlTags`

- **Type**: `string[]`
- **Default**: [`["html", "xhtml"]`](./src/embedded/html/options.ts)
- **Description**: Tags that make their subsequent template literals be identified as embedded HTML language.

##### `embeddedHtmlParser`

- **Type**: [`"html" | "vue" | "angular" | "lwc"`](./src/embedded/html/options.ts)
- **Default**: [`"html"`](./src/embedded/html/options.ts)
- **Description**: The parser used to parse the embedded HTML language.

Embedded HTML uses the parsers and printers included with Prettier.

This can override the native formatting behavior for embedded HTML language. If you want to keep the native behavior, set `embeddedHtmlComments` or `embeddedHtmlTags` to `[]` or other values.

If you want to specify different parsers for different comments or tags, check [`embeddedOverrides`](#embeddedoverrides-1).

#### INI

##### `embeddedIniComments`

- **Type**: `string[]`
- **Default**: [`["ini", "cfg", "pro"]`](./src/embedded/ini/options.ts)
- **Description**: Block comments that make their subsequent template literals be identified as embedded INI language. This option requires the `prettier-plugin-ini` plugin.

##### `embeddedIniTags`

- **Type**: `string[]`
- **Default**: [`["ini", "cfg", "pro"]`](./src/embedded/ini/options.ts)
- **Description**: Tags that make their subsequent template literals be identified as embedded INI language. This option requires the `prettier-plugin-ini` plugin.

Formatting embedded INI language requires the [`prettier-plugin-ini`](https://github.com/kddnewton/prettier-plugin-ini) plugin to be loaded as well. And [options](https://github.com/kddnewton/prettier-plugin-ini#configuration) supported by `prettier-plugin-ini` can therefore be used to further control the formatting behavior.

#### Java

##### `embeddedJavaComments`

- **Type**: `string[]`
- **Default**: [`["java"]`](./src/embedded/java/options.ts)
- **Description**: Block comments that make their subsequent template literals be identified as embedded Java language. This option requires the `prettier-plugin-java` plugin.

##### `embeddedJavaTags`

- **Type**: `string[]`
- **Default**: [`["java"]`](./src/embedded/java/options.ts)
- **Description**: Tags that make their subsequent template literals be identified as embedded Java language. This option requires the `prettier-plugin-java` plugin.

Formatting embedded Java language requires the [`prettier-plugin-java`](https://github.com/jhipster/prettier-java/tree/main/packages/prettier-plugin-java) plugin to be loaded as well. And [options](https://github.com/jhipster/prettier-java/tree/main/packages/prettier-plugin-java#options) supported by `prettier-plugin-java` can therefore be used to further control the formatting behavior.

#### JSON

##### `embeddedJsonComments`

- **Type**: `string[]`
- **Default**: [`["json", "jsonl"]`](./src/embedded/json/options.ts)
- **Description**: Block comments that make their subsequent template literals be identified as embedded JSON language.

##### `embeddedJsonTags`

- **Type**: `string[]`
- **Default**: [`["json", "jsonl"]`](./src/embedded/json/options.ts)
- **Description**: Tags that make their subsequent template literals be identified as embedded JSON language.

##### `embeddedJsonParser`

- **Type**: [`"json" | "json5" | "jsonc" | "json-stringify"`](./src/embedded/json/options.ts)
- **Default**: [`"json"`](./src/embedded/json/options.ts)
- **Description**: The parser used to parse the embedded JSON language.

Embedded JSON uses the parsers and printers included with Prettier.

If you want to specify different parsers for different comments or tags, check [`embeddedOverrides`](#embeddedoverrides-1).

#### JSONata

##### `embeddedJsonataComments`

- **Type**: `string[]`
- **Default**: [`["jsonata"]`](./src/embedded/jsonata/options.ts)
- **Description**: Block comments that make their subsequent template literals be identified as embedded JSONata language. This option requires the `@stedi/prettier-plugin-jsonata` plugin.

##### `embeddedJsonataTags`

- **Type**: `string[]`
- **Default**: [`["jsonata"]`](./src/embedded/jsonata/options.ts)
- **Description**: Tags that make their subsequent template literals be identified as embedded JSONata language. This option requires the `@stedi/prettier-plugin-jsonata` plugin.

Formatting embedded JSONata language requires the [`@stedi/prettier-plugin-jsonata`](https://github.com/Stedi/prettier-plugin-jsonata) plugin to be loaded as well.

#### LaTeX

##### `embeddedLatexComments`

- **Type**: `string[]`
- **Default**: [`["latex", "tex", "aux", "cls", "bbl", "bib", "toc", "sty"]`](./src/embedded/latex/options.ts)
- **Description**: Block comments that make their subsequent template literals be identified as embedded LaTeX language. This option requires the `prettier-plugin-latex` plugin.

##### `embeddedLatexTags`

- **Type**: `string[]`
- **Default**: [`["latex", "tex", "aux", "cls", "bbl", "bib", "toc", "sty"]`](./src/embedded/latex/options.ts)
- **Description**: Tags that make their subsequent template literals be identified as embedded LaTeX language. This option requires the `prettier-plugin-latex` plugin.

Formatting embedded LaTeX language requires the [`prettier-plugin-latex`](https://github.com/siefkenj/prettier-plugin-latex) plugin to be loaded as well.

#### Markdown

##### `embeddedMarkdownComments`

- **Type**: `string[]`
- **Default**: [`["md", "markdown"]`](./src/embedded/markdown/options.ts)
- **Description**: Block comments that make their subsequent template literals be identified as embedded Markdown language.

##### `embeddedMarkdownTags`

- **Type**: `string[]`
- **Default**: [`["md", "markdown"]`](./src/embedded/markdown/options.ts)
- **Description**: Tags that make their subsequent template literals be identified as embedded Markdown language.

##### `embeddedMarkdownParser`

- **Type**: [`"markdown" | "mdx" | "remark"`](./src/embedded/markdown/options.ts)
- **Default**: [`"markdown"`](./src/embedded/markdown/options.ts)
- **Description**: The parser used to parse the embedded Markdown language.

Embedded Markdown uses the parsers and printers included with Prettier.

This can override the native formatting for embedded Markdown language. If you want to keep the native behavior, set `embeddedMarkdownComments` or `embeddedMarkdownTags` to `[]` or other values.

If you want to specify different parsers for different comments or tags, check [`embeddedOverrides`](#embeddedoverrides-1).

The `remark` parser is [an alias of the `markdown` parser](https://github.com/prettier/prettier/blob/ed23dacc9e655c3876971b30859497b17ff2cf9f/src/language-markdown/parser-markdown.js#L57).

#### NGINX

##### `embeddedNginxComments`

- **Type**: `string[]`
- **Default**: [`["nginx"]`](./src/embedded/nginx/options.ts)
- **Description**: Block comments that make their subsequent template literals be identified as embedded NGINX language. This option requires the `prettier-plugin-nginx` plugin.

##### `embeddedNginxTags`

- **Type**: `string[]`
- **Default**: [`["nginx"]`](./src/embedded/nginx/options.ts)
- **Description**: Tags that make their subsequent template literals be identified as embedded NGINX language. This option requires the `prettier-plugin-nginx` plugin.

Formatting embedded NGINX language requires the [`prettier-plugin-nginx`](https://github.com/jxddk/prettier-plugin-nginx) plugin to be loaded as well. And [options](https://github.com/jxddk/prettier-plugin-nginx?tab=readme-ov-file#configuration) supported by `prettier-plugin-nginx` can therefore be used to further control the formatting behavior.

#### Pegjs

##### `embeddedPegjsComments`

- **Type**: `string[]`
- **Default**: [`["pegjs", "peggy", "peg"]`](./src/embedded/pegjs/options.ts)
- **Description**: Block comments that make their subsequent template literals be identified as embedded Pegjs language. This option requires the `prettier-plugin-pegjs` plugin.

##### `embeddedPegjsTags`

- **Type**: `string[]`
- **Default**: [`["pegjs", "peggy", "peg"]`](./src/embedded/pegjs/options.ts)
- **Description**: Tags that make their subsequent template literals be identified as embedded Pegjs language. This option requires the `prettier-plugin-pegjs` plugin.

Formatting embedded Pegjs language requires the [`prettier-plugin-pegjs`](https://github.com/siefkenj/prettier-plugin-pegjs) plugin to be loaded as well. And [options](https://github.com/siefkenj/prettier-plugin-pegjs?tab=readme-ov-file#options) supported by `prettier-plugin-pegjs` can therefore be used to further control the formatting behavior.

Note that `prettier-plugin-pegjs` supports different parsers for the action blocks and they are specified by the [`actionParser` option](https://github.com/siefkenj/prettier-plugin-pegjs?tab=readme-ov-file#options). If you want to specify different action parsers for different comments or tags, check [`embeddedOverrides`](#embeddedoverrides-1).

#### PHP

##### `embeddedPhpComments`

- **Type**: `string[]`
- **Default**: [`["php", "php5"]`](./src/embedded/php/options.ts)
- **Description**: Block comments that make their subsequent template literals be identified as embedded PHP language. This option requires the `@prettier/plugin-php` plugin.

##### `embeddedPhpTags`

- **Type**: `string[]`
- **Default**: [`["php", "php5"]`](./src/embedded/php/options.ts)
- **Description**: Tags that make their subsequent template literals be identified as embedded PHP language. This option requires the `@prettier/plugin-php` plugin.

Formatting embedded PHP language requires the [`@prettier/plugin-php`](https://github.com/prettier/plugin-php) plugin to be loaded as well. And [options](https://github.com/prettier/plugin-php#configuration) supported by `@prettier/plugin-php` can therefore be used to further control the formatting behavior.

#### Prisma

##### `embeddedPrismaComments`

- **Type**: `string[]`
- **Default**: [`["prisma"]`](./src/embedded/prisma/options.ts)
- **Description**: Block comments that make their subsequent template literals be identified as embedded Prisma language. This option requires the `prettier-plugin-prisma` plugin.

##### `embeddedPrismaTags`

- **Type**: `string[]`
- **Default**: [`["prisma"]`](./src/embedded/prisma/options.ts)
- **Description**: Tags that make their subsequent template literals be identified as embedded Prisma language. This option requires the `prettier-plugin-prisma` plugin.

Formatting embedded Prisma language requires the [`prettier-plugin-prisma`](https://github.com/avocadowastaken/prettier-plugin-prisma) plugin to be loaded as well.

#### Properties

##### `embeddedPropertiesComments`

- **Type**: `string[]`
- **Default**: [`["properties"]`](./src/embedded/properties/options.ts)
- **Description**: Block comments that make their subsequent template literals be identified as embedded Properties language. This option requires the `prettier-plugin-properties` plugin.

##### `embeddedPropertiesTags`

- **Type**: `string[]`
- **Default**: [`["properties"]`](./src/embedded/properties/options.ts)
- **Description**: Tags that make their subsequent template literals be identified as embedded Properties language. This option requires the `prettier-plugin-properties` plugin.

Formatting embedded Properties language requires the [`prettier-plugin-properties`](https://github.com/eemeli/prettier-plugin-properties) plugin to be loaded as well. And [options](https://github.com/eemeli/prettier-plugin-properties#configuration) supported by `prettier-plugin-properties` can therefore be used to further control the formatting behavior.

#### Pug

##### `embeddedPugComments`

- **Type**: `string[]`
- **Default**: [`["pug", "jade"]`](./src/embedded/pug/options.ts)
- **Description**: Block comments that make their subsequent template literals be identified as embedded Pug language. This option requires the `@prettier/plugin-pug` plugin.

##### `embeddedPugTags`

- **Type**: `string[]`
- **Default**: [`["pug", "jade"]`](./src/embedded/pug/options.ts)
- **Description**: Tags that make their subsequent template literals be identified as embedded Pug language. This option requires the `@prettier/plugin-pug` plugin.

Formatting embedded Pug language requires the [`@prettier/plugin-pug`](https://github.com/prettier/plugin-pug) plugin to be loaded as well. And [options](https://github.com/prettier/plugin-pug?tab=readme-ov-file#configuration) supported by `@prettier/plugin-pug` can therefore be used to further control the formatting behavior.

#### Ruby

##### `embeddedRubyComments`

- **Type**: `string[]`
- **Default**: [`["ruby"]`](./src/embedded/ruby/options.ts)
- **Description**: Block comments that make their subsequent template literals be identified as embedded Ruby language. This option requires the `@prettier/plugin-ruby` plugin.

##### `embeddedRubyTags`

- **Type**: `string[]`
- **Default**: [`["ruby"]`](./src/embedded/ruby/options.ts)
- **Description**: Tags that make their subsequent template literals be identified as embedded Ruby language. This option requires the `@prettier/plugin-ruby` plugin.

##### `embeddedRubyParser`

- **Type**: [`"ruby" | "rbs" | "haml"`](./src/embedded/ruby/options.ts)
- **Default**: [`"ruby"`](./src/embedded/ruby/options.ts)
- **Description**: The parser used to parse the embedded Ruby language. This option requires the `@prettier/plugin-ruby` plugin.

Formatting embedded Ruby language requires the [`@prettier/plugin-ruby`](https://github.com/prettier/plugin-ruby) to be loaded and [its dependencies to be installed](https://github.com/prettier/plugin-ruby#getting-started) as well. And [options](https://github.com/prettier/plugin-ruby#configuration) supported by `@prettier/plugin-ruby` can therefore be used to further control the formatting behavior.

If you want to specify different parsers for different comments or tags, check [`embeddedOverrides`](#embeddedoverrides-1).

#### Sh (Shell)

##### `embeddedShComments`

- **Type**: `string[]`
- **Default**: [`["sh"]`](./src/embedded/sh/options.ts)
- **Description**: Block comments that make their subsequent template literals be identified as embedded Shell language. This option requires the `prettier-plugin-sh` plugin.

##### `embeddedShTags`

- **Type**: `string[]`
- **Default**: [`["sh"]`](./src/embedded/sh/options.ts)
- **Description**: Tags that make their subsequent template literals be identified as embedded Shell language. This option requires the `prettier-plugin-sh` plugin.

Formatting embedded Shell language requires the [`prettier-plugin-sh`](https://github.com/un-ts/prettier/tree/master/packages/sh#readme) plugin to be loaded as well. And [options](https://github.com/un-ts/prettier/tree/master/packages/sh#parser-options) supported by `prettier-plugin-sh` can therefore be used to further control the formatting behavior.

Note that `prettier-plugin-sh` supports different variants of shell syntaxes and they are specified by the [`variant` option](https://github.com/un-ts/prettier/tree/master/packages/sh#parser-options). If you want to specify different variants for different comments or tags, check [`embeddedOverrides`](#embeddedoverrides-1).

#### SQL

##### `embeddedSqlComments`

- **Type**: `string[]`
- **Default**: [`["sql"]`](./src/embedded/sql/options.ts)
- **Description**: Block comments that make their subsequent template literals be identified as embedded SQL language. This option requires the `prettier-plugin-sql` plugin or the `prettier-plugin-sql-cst` plugin.

##### `embeddedSqlTags`

- **Type**: `string[]`
- **Default**: [`["sql"]`](./src/embedded/sql/options.ts)
- **Description**: Tags that make their subsequent template literals be identified as embedded SQL language. This option requires the `prettier-plugin-sql` plugin or the `prettier-plugin-sql-cst` plugin.

##### `embeddedSqlPlugin`

- **Type**: [`"prettier-plugin-sql" | "prettier-plugin-sql-cst"`](./src/embedded/sql/options.ts)
- **Default**: [`"prettier-plugin-sql"`](./src/embedded/sql/options.ts)
- **Description**: The plugin used to format the embedded SQL language. This option requires the `prettier-plugin-sql` plugin or the `prettier-plugin-sql-cst` plugin.

##### `embeddedSqlParser`

- **Type**: [`"sqlite" | "bigquery" | "mysql" | "mariadb" | "postgresql"` ](./src/embedded/sql/options.ts)
- **Default**: [`"sqlite"`](./src/embedded/sql/options.ts)
- **Description**: Specify the embedded SQL language parser. This option is only needed with the `prettier-plugin-sql-cst` plugin.

Formatting embedded SQL language requires the [`prettier-plugin-sql`](https://github.com/un-ts/prettier/tree/master/packages/sql#readme) plugin or the [`prettier-plugin-sql-cst`](https://github.com/nene/prettier-plugin-sql-cst) plugin to be loaded as well. And [options](https://github.com/un-ts/prettier/tree/master/packages/sql#parser-options) supported by `prettier-plugin-sql`, or [options](https://github.com/nene/prettier-plugin-sql-cst?tab=readme-ov-file#configuration) supported by `prettier-plugin-sql-cst` can therefore be used to further control the formatting behavior.

Note that `prettier-plugin-sql` supports many different SQL dialects which are specified by the [`language`, `database` or `dialect` option](https://github.com/un-ts/prettier/tree/master/packages/sql#parser-options). And `prettier-plugin-sql-cst` also supports various parsers as shown above. If you want to specify different dialects or parsers for different comments or tags, check [`embeddedOverrides`](#embeddedoverrides-1).

#### TOML

##### `embeddedTomlComments`

- **Type**: `string[]`
- **Default**: [`["toml"]`](./src/embedded/toml/options.ts)
- **Description**: Block comments that make their subsequent template literals be identified as embedded TOML language. This option requires the `prettier-plugin-toml` plugin.

##### `embeddedTomlTags`

- **Type**: `string[]`
- **Default**: [`["toml"]`](./src/embedded/toml/options.ts)
- **Description**: Tags that make their subsequent template literals be identified as embedded TOML language. This option requires the `prettier-plugin-toml` plugin.

Formatting embedded TOML language requires the [`prettier-plugin-toml`](https://github.com/un-ts/prettier/tree/master/packages/toml#readme) plugin to be loaded as well. And [options](https://github.com/un-ts/prettier/blob/master/packages/toml/src/options.ts) supported by `prettier-plugin-toml` can therefore be used to further control the formatting behavior.

#### TS (TypeScript)

##### `embeddedTsComments`

- **Type**: `string[]`
- **Default**: [`["ts", "tsx", "cts", "mts", "typescript"]`](./src/embedded/ts/options.ts)
- **Description**: Block comments that make their subsequent template literals be identified as embedded TypeScript language.

##### `embeddedTsTags`

- **Type**: `string[]`
- **Default**: [`["ts", "tsx", "cts", "mts", "typescript"]`](./src/embedded/ts/options.ts)
- **Description**: Tags that make their subsequent template literals be identified as embedded TypeScript language.

##### `embeddedTsParser`

- **Type**: [`"typescript" | "babel-ts"`](./src/embedded/ts/options.ts)
- **Default**: [`"typescript"`](./src/embedded/ts/options.ts)
- **Description**: The parser used to parse the embedded TypeScript language.

Embedded TypeScript uses the parsers and printers included with Prettier.

If you want to specify different parsers for different comments or tags, check [`embeddedOverrides`](#embeddedoverrides-1).

#### XML

##### `embeddedXmlComments`

- **Type**: `string[]`
- **Default**: [`["xml", "opml", "rss", "svg"]`](./src/embedded/xml/options.ts)
- **Description**: Block comments that make their subsequent template literals be identified as embedded XML language. This option requires the `@prettier/plugin-xml` plugin.

##### `embeddedXmlTags`

- **Type**: `string[]`
- **Default**: [`["xml", "opml", "rss", "svg"]`](./src/embedded/xml/options.ts)
- **Description**: Tags that make their subsequent template literals be identified as embedded XML language. This option requires the `@prettier/plugin-xml` plugin.

Embedded XML uses the parser provided by [`@prettier/plugin-xml`](https://github.com/prettier/plugin-xml), which must be loaded when XML formatting is enabled. Its [options](https://github.com/prettier/plugin-xml#configuration) control the XML formatting behavior.

#### YAML

##### `embeddedYamlComments`

- **Type**: `string[]`
- **Default**: [`["yaml", "yml"]`](./src/embedded/yaml/options.ts)
- **Description**: Block comments that make their subsequent template literals be identified as embedded YAML language.

##### `embeddedYamlTags`

- **Type**: `string[]`
- **Default**: [`["yaml", "yml"]`](./src/embedded/yaml/options.ts)
- **Description**: Tags that make their subsequent template literals be identified as embedded YAML language.

Embedded YAML uses the parsers and printers included with Prettier.

</details>

### Language-Agnostic Options

#### Language-Agnostic

##### `preserveEmbeddedExteriorWhitespaces`

- **Type**: `string[]`
- **Default**: `[]`
- **Description**: Preserves leading and trailing whitespaces in the formatting results for the specified comments or tags.

##### `noEmbeddedMultiLineIndentation`

- **Type**: `string[]`
- **Default**: `[]`
- **Description**: Turns off auto indentation in the formatting results for the specified comments or tags when they are formatted to span multi lines.

##### `embeddedOverrides`

- **Type**: `string`
- **Default**: `undefined`
- **Description**: Option overrides for the specified comments or tags. It should either be a stringified JSON or an absolute filepath to the option overrides file. See [below](#embeddedoverrides-1) for a detailed explanation.

#### `embeddedOverrides`

This option is provided for users to override certain options based on comments or tags. Due to the lack of support for using objects in prettier plugin options (https://github.com/prettier/prettier/issues/14671), it accepts a **stringified** json string, or a file path with an extension of `.json`, `.jsonc`, `.js`, `.cjs`, `.mjs`, `.ts`, `.cts` or `.mts` as its value. If no extension is provided, it will be treated as a `.json`/`.jsonc` file. For relative paths, it will automatically figure out the prettier config location and use that as the base path.

> [!NOTE]
>
> TypeScript override files (`.ts`, `.mts` and `.cts`) use Bun's native loader or the consumer project's [`tsx`](https://github.com/privatenumber/tsx) installation on Node.js. Node.js with native type stripping enabled can also load erasable TypeScript directly when `tsx` is absent. Install `tsx` for Node.js 18.19+ without native type stripping, or for TypeScript features that require transformation. The Prettier VS Code extension uses its bundled Node.js runtime; JavaScript override files provide the simplest editor setup.

The resolved value should be an array of objects. Each object in the array must have 2 fields: `comments` and `options`, or `tags` and `options`. The `options` are considered overrides that will be applied to the global `options` of prettier for those `comments` and `tags` only. It's like the [`overrides`](https://prettier.io/docs/en/configuration.html#configuration-overrides) of `prettier`, but it is comment/tag-based instead of file-based.

In a json file, the root is the array of objects. In a JavaScript/TypeScript file, the array of objects should be a default export, or a named export with the name `embeddedOverrides`.

An example `.json`/`.jsonc` file is:

```json
[
  {
    "comments": ["sql"],
    "options": {
      "keywordCase": "lower"
    }
  },
  {
    "tags": ["mysql"],
    "options": {
      "keywordCase": "upper"
    }
  }
]
```

> [!CAUTION]
>
> `embeddedOverrides` supports options applied during parsing and document generation. Options applied during final document printing, such as `tabWidth`, are configured globally. The [`EmbeddedOverride` interface](https://github.com/Sec-ant/prettier-plugin-embed/blob/main/src/types.ts) lists the supported override options.

### Typed Options

There're several ways to use the typed options provided by this plugin. Taking the embedded SQL language as an example:

- **Augment the `Options` type from `Prettier` to use plugin-specific options**

  Register options from `prettier-plugin-embed` (this plugin):

  ```ts
  /// <reference types="prettier-plugin-embed/plugin-embed" />
  ```

  Register options from `prettier-plugin-sql`:

  ```ts
  /// <reference types="prettier-plugin-embed/embedded/sql/plugin-sql" />
  ```

  Other embedded languages share the same pattern:

  ```ts
  /// <reference types="prettier-plugin-embed/embedded/<language>/<(no prettier or scope) plugin name>" />
  ```

- **Import plugin-specific options**

  Import options from `prettier-plugin-embed` (this plugin):

  ```ts
  import type { PluginEmbedOptions } from "prettier-plugin-embed";
  ```

  Import options from `prettier-plugin-sql`:

  ```ts
  import type { PluginSqlOptions } from "prettier-plugin-embed/embedded/sql/plugin-sql-types";
  ```

  **NOTE:** You can also import the types from the `prettier-plugin-sql` plugin directly. However, not all of the plugins provide types, or provide them in a predictable way, so this plugin exports them in a more unified manner.

  Other embedded languages share the same pattern:

  ```ts
  import type { Plugin<Language>Options } from "prettier-plugin-embed/embedded/<language>/<(no prettier or scope) plugin name>-types";
  ```

- **Use `JSDoc` in JavaScript files**

  ```js
  /**
   * @type {import("prettier-plugin-embed").PluginEmbedOptions}
   */
  const pluginEmbedOptions = {
    embeddedSqlTags: ["sql"],
  };

  /**
   * @type {import("prettier-plugin-embed/embedded/sql/plugin-sql-types").PluginSqlOptions}
   */
  const pluginSqlOptions = {
    language: "postgresql",
    keywordCase: "upper",
  };
  ```

## Contributing

Bug fixes, new language support and tests are welcome. Please have a look at the project structure before getting started. Feel free to leave questions or suggestions.

## Contributors

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://upleveled.io"><img src="https://avatars.githubusercontent.com/u/1935696?v=4?s=100" width="100px;" alt="Karl Horky"/><br /><sub><b>Karl Horky</b></sub></a><br /><a href="#code-karlhorky" title="Code">💻</a> <a href="#doc-karlhorky" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://math-atlas.vercel.app"><img src="https://avatars.githubusercontent.com/u/64682375?v=4?s=100" width="100px;" alt="Kelvin Soh"/><br /><sub><b>Kelvin Soh</b></sub></a><br /><a href="#code-kelvinsjk" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.1stg.me"><img src="https://avatars.githubusercontent.com/u/8336744?v=4?s=100" width="100px;" alt="JounQin"/><br /><sub><b>JounQin</b></sub></a><br /><a href="#code-JounQin" title="Code">💻</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

## License

MIT
