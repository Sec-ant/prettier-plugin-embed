<div align="center">

![prettier-plugin-embed-wide-logo](./asset/prettier-plugin-embed-wide-light.svg#gh-light-mode-only)
![prettier-plugin-embed-wide-logo](./asset/prettier-plugin-embed-wide-dark.svg#gh-dark-mode-only)

# Prettier Plugin Embed

[Online playground](https://sec-ant.github.io/prettier-plugin-embed/) · [Run the playground locally](./playground/README.md)

[![npm version](https://img.shields.io/npm/v/prettier-plugin-embed?cacheSeconds=300)](https://www.npmjs.com/package/prettier-plugin-embed/v/latest) [![npm downloads](https://img.shields.io/npm/dm/prettier-plugin-embed?cacheSeconds=300)](https://www.npmjs.com/package/prettier-plugin-embed/v/latest) [![npm license](https://img.shields.io/npm/l/prettier-plugin-embed?cacheSeconds=300)](https://www.npmjs.com/package/prettier-plugin-embed/v/latest) [![All Contributors](https://img.shields.io/github/all-contributors/Sec-ant/prettier-plugin-embed?color=56b3b4)](#contributors)

[![github last commit](https://img.shields.io/github/last-commit/Sec-ant/prettier-plugin-embed?cacheSeconds=300)](https://github.com/Sec-ant/prettier-plugin-embed) [![bundlephobia minzipped](https://img.shields.io/bundlephobia/minzip/prettier-plugin-embed?cacheSeconds=300)](https://bundlephobia.com/package/prettier-plugin-embed@latest) [![](https://img.shields.io/jsdelivr/npm/hm/prettier-plugin-embed?cacheSeconds=300&color=ff5627)](https://www.jsdelivr.com/package/npm/prettier-plugin-embed)

A configurable [Prettier](https://prettier.io/) [plugin](https://prettier.io/docs/en/plugins.html) to format [embedded languages](https://prettier.io/docs/en/options.html#embedded-language-formatting) in JS/TS Files.

```bash
npm i -D prettier prettier-plugin-embed
```

</div>

## Introduction

### What?

This Prettier plugin formats [embedded languages](https://prettier.io/docs/options#embedded-language-formatting) in [template literals](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Template_literals) within JavaScript and TypeScript files.

### Why?

It adds per-language formatting controls, configurable block comments and tags, and per-identifier overrides to Prettier's embedded formatting. See [prettier/prettier#4424](https://github.com/prettier/prettier/issues/4424) and [prettier/prettier#5588](https://github.com/prettier/prettier/issues/5588) for related use cases.

### How?

The plugin extends the [`embed`](https://prettier.io/docs/plugins#embed) method of Prettier's `estree` printer. Each integration delegates formatting to Prettier or a loaded language plugin. See [the printer implementation](./src/printers.ts) for the integration point.

## Features

- **Support for Additional Languages:** Extend embedded formatting to languages such as XML, SQL, PHP, and more. See [Language-Specific Options](#language-specific-options) for the supported languages and their default identifiers.

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

Install Prettier 3 in the project that runs formatting. The consumer supplies the formatter and its language plugins.

Install the formatter plugin for each embedded language you use as a separate project dependency; the [Language-Specific Options](#language-specific-options) section shows which integrations require one.

Choose Prettier and runtime versions supported by every loaded language plugin. Parser availability and syntax support follow the installed formatter version.

<details>
<summary>Dependency resolution in strict installations</summary>

The plugin loads Prettier through static imports, which resolve from the plugin's installation location. Standard project installs and Yarn's default Plug'n'Play dependency fallback allow these imports to access the project's installed Prettier.

Yarn projects using `pnpFallbackMode: none`, and pnpm projects using `enableGlobalVirtualStore: true` with hoisting disabled, need an explicit dependency relationship for this resolution. For these configurations, add the following to `.yarnrc.yml` (Yarn) or `pnpm-workspace.yaml` (pnpm) to connect the plugin to the project's installed Prettier:

```yaml
packageExtensions:
  "prettier-plugin-embed@*":
    peerDependencies:
      prettier: ">=3.0.0 <4"
```

Projects can also use Yarn's default `pnpFallbackMode: dependencies-only` or pnpm's project-local virtual store (`enableGlobalVirtualStore: false`).

</details>

## Usage

### Playground

Try the plugin in the [online playground](https://sec-ant.github.io/prettier-plugin-embed/). Edit JavaScript or TypeScript alongside your `.prettierrc` configuration, including the `plugins` array and embedded-language options. Formatting runs locally in your browser.

To report a formatting issue, keep the original code in Input, enable Compare to inspect the native Prettier output, then use **Copy issue report**. The report includes the input, configuration, output or error, formatter versions, and a shareable playground link. **Share** copies a link containing the current example and configuration.

See the [playground guide](./playground/README.md) for local development, keyboard shortcuts, browser limitations, and GitHub Pages deployment.

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

### An Overview of the Philosophy

Set [`embeddedLanguageFormatting`](https://prettier.io/docs/options#embedded-language-formatting) to `"auto"` (Prettier's default) to enable embedded formatting.

This plugin uses Prettier's built-in parsers and existing [language plugins](https://prettier.io/docs/plugins#official-plugins), adding the integration needed to format their languages inside template literals.

Install and load the formatter plugin for each additional language you use. For example, embedded XML requires both this plugin and [`@prettier/plugin-xml`](https://github.com/prettier/plugin-xml#readme). The [Language-Specific Options](#language-specific-options) section lists the required plugins.

A preceding [block comment](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Lexical_grammar#block_comments) such as `` /* xml */ `...` `` or a [tag](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates) such as `` xml`...` `` identifies the embedded language. Configure each language with `embedded<Language>Comments` and `embedded<Language>Tags`. A leading block comment is checked first; templates without one are matched by their tag.

Tags support exact identifiers, member expressions, and regular expression strings in `/pattern/flags` form. Simple identifiers support patterns too: `"/^query$/"` matches the tag `query`. Member and call expressions use a normalized form for pattern matching; for example, `factory(argument).query` becomes `factory().query`.

For example, this JSON configuration matches `prisma.$queryRaw`, `client.$queryRaw`, and `ctx.prisma.$queryRaw`. JSON and JavaScript strings escape each backslash as `\\`:

```json
{
  "plugins": ["prettier-plugin-embed", "prettier-plugin-sql"],
  "embeddedSqlTags": ["/\\.\\$queryRaw$/"]
}
```

Add comments or tags to `embeddedNoopComments` or `embeddedNoopTags` to preserve their template content as written. These options take priority among matching languages. Other overlapping matches use the first matching language in the internal registry; assign distinct identifiers or non-overlapping patterns to select a language explicitly.

> [!IMPORTANT]
>
> Specify comments or tags explicitly to keep language identification stable across plugin versions.

### Language-Specific Options

Supported embedded languages and their default comment/tag identifiers are:

- [Astro](#astro): `astro`
- [CSS](#css): `css`
- [Dockerfile](#dockerfile): `dockerfile`, `containerfile`
- [ES (ECMAScript/JavaScript)](#es-ecmascriptjavascript): `js`, `jsx`, `es`, `es6`, `mjs`, `cjs`, `pac`, `javascript`
- [Gherkin](#gherkin): `gherkin`, `feature`
- [GLSL](#glsl): `glsl`, `shader`
- [Go Template](#go-template): `goTemplate`, `gotmpl`
- [GraphQL](#graphql): `graphql`, `gql`
- [Handlebars](#handlebars): `handlebars`, `hbs`
- [HTML](#html): `html`, `xhtml`
- [Hugo](#hugo): `hugo`, `hugoPost`
- [INI](#ini): `ini`, `cfg`, `pro`
- [Java](#java): `java`
- [Jinja](#jinja): `jinja`, `jinja2`, `j2`
- [JSON](#json): `json`, `jsonl`
- [JSONata](#jsonata): `jsonata`
- [JTE](#jte): `jte`
- [LaTeX](#latex): `latex`, `tex`, `aux`, `cls`, `bbl`, `bib`, `toc`, `sty`
- [Liquid](#liquid): `liquid`
- [Markdown](#markdown): `md`, `markdown`
- [Marko](#marko): `marko`
- [Motoko](#motoko): `motoko`, `mo`
- [Mustache](#mustache): `mustache`
- [NGINX](#nginx): `nginx`
- [Nunjucks](#nunjucks): `nunjucks`, `njk`
- [Pegjs](#pegjs): `pegjs`, `peggy`, `peg`
- [PHP](#php): `php`, `php5`
- [PowerShell](#powershell): `powershell`, `ps1`
- [Prisma](#prisma): `prisma`
- [Properties](#properties): `properties`
- [Pug](#pug): `pug`, `jade`
- [Ruby](#ruby): `ruby`
- [Sh (Shell)](#sh-shell): `sh`
- [Solidity](#solidity): `solidity`, `sol`
- [SQL](#sql): `sql`
- [Svelte](#svelte): `svelte`
- [TOML](#toml): `toml`
- [TS (TypeScript)](#ts-typescript): `ts`, `tsx`, `cts`, `mts`, `typescript`
- [XML](#xml): `xml`, `opml`, `rss`, `svg`
- [XQuery](#xquery): `xquery`, `xq`
- [YAML](#yaml): `yaml`, `yml`

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

#### Astro

##### `embeddedAstroComments`

- **Type**: `string[]`
- **Default**: [`["astro"]`](./src/embedded/astro/options.ts)
- **Description**: Block comments that identify embedded Astro in template literals. Requires the [`prettier-plugin-astro`](https://github.com/withastro/prettier-plugin-astro#readme) plugin.

##### `embeddedAstroTags`

- **Type**: `string[]`
- **Default**: [`["astro"]`](./src/embedded/astro/options.ts)
- **Description**: Tags that identify embedded Astro in template literals. Requires the [`prettier-plugin-astro`](https://github.com/withastro/prettier-plugin-astro#readme) plugin.

Formatting embedded Astro requires the [`prettier-plugin-astro`](https://github.com/withastro/prettier-plugin-astro#readme) plugin to be installed and loaded. Its options control the embedded formatting behavior.

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

#### Dockerfile

##### `embeddedDockerfileComments`

- **Type**: `string[]`
- **Default**: [`["dockerfile", "containerfile"]`](./src/embedded/dockerfile/options.ts)
- **Description**: Block comments that identify embedded Dockerfile in template literals. Requires the [`prettier-plugin-sh`](https://github.com/un-ts/prettier/tree/master/packages/sh#readme) plugin.

##### `embeddedDockerfileTags`

- **Type**: `string[]`
- **Default**: [`["dockerfile", "containerfile"]`](./src/embedded/dockerfile/options.ts)
- **Description**: Tags that identify embedded Dockerfile in template literals. Requires the [`prettier-plugin-sh`](https://github.com/un-ts/prettier/tree/master/packages/sh#readme) plugin.

Formatting embedded Dockerfile requires the [`prettier-plugin-sh`](https://github.com/un-ts/prettier/tree/master/packages/sh#readme) plugin to be installed and loaded. Its options control the embedded formatting behavior.

Dockerfile and Shell share `prettier-plugin-sh`; the Dockerfile integration selects its `dockerfile` parser.

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

#### Gherkin

##### `embeddedGherkinComments`

- **Type**: `string[]`
- **Default**: [`["gherkin", "feature"]`](./src/embedded/gherkin/options.ts)
- **Description**: Block comments that identify embedded Gherkin in template literals. Requires the [`prettier-plugin-gherkin`](https://github.com/mapado/prettier-plugin-gherkin#readme) plugin.

##### `embeddedGherkinTags`

- **Type**: `string[]`
- **Default**: [`["gherkin", "feature"]`](./src/embedded/gherkin/options.ts)
- **Description**: Tags that identify embedded Gherkin in template literals. Requires the [`prettier-plugin-gherkin`](https://github.com/mapado/prettier-plugin-gherkin#readme) plugin.

Formatting embedded Gherkin requires the [`prettier-plugin-gherkin`](https://github.com/mapado/prettier-plugin-gherkin#readme) plugin to be installed and loaded. Its options control the embedded formatting behavior.

#### GLSL

##### `embeddedGlslComments`

- **Type**: `string[]`
- **Default**: [`["glsl", "shader"]`](./src/embedded/glsl/options.ts)
- **Description**: Block comments that make their subsequent template literals be identified as embedded GLSL language. This option requires the [`prettier-plugin-glsl`](https://github.com/NaridaL/glsl-language-toolkit/tree/main/packages/prettier-plugin-glsl#readme) plugin.

##### `embeddedGlslTags`

- **Type**: `string[]`
- **Default**: [`["glsl", "shader"]`](./src/embedded/glsl/options.ts)
- **Description**: Tags that make their subsequent template literals be identified as embedded GLSL language. This option requires the [`prettier-plugin-glsl`](https://github.com/NaridaL/glsl-language-toolkit/tree/main/packages/prettier-plugin-glsl#readme) plugin.

Formatting embedded GLSL language requires the [`prettier-plugin-glsl`](https://github.com/NaridaL/glsl-language-toolkit/tree/main/packages/prettier-plugin-glsl#readme) plugin to be loaded as well.

#### Go Template

##### `embeddedGoTemplateComments`

- **Type**: `string[]`
- **Default**: [`["goTemplate", "gotmpl"]`](./src/embedded/go-template/options.ts)
- **Description**: Block comments that identify embedded Go Template in template literals. Requires the [`@htnabe/prettier-plugin-go-template`](https://github.com/htnabe/prettier-plugin-go-template#readme) plugin.

##### `embeddedGoTemplateTags`

- **Type**: `string[]`
- **Default**: [`["goTemplate", "gotmpl"]`](./src/embedded/go-template/options.ts)
- **Description**: Tags that identify embedded Go Template in template literals. Requires the [`@htnabe/prettier-plugin-go-template`](https://github.com/htnabe/prettier-plugin-go-template#readme) plugin.

Formatting embedded Go Template requires the [`@htnabe/prettier-plugin-go-template`](https://github.com/htnabe/prettier-plugin-go-template#readme) plugin to be installed and loaded. Its options control the embedded formatting behavior.

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

#### Handlebars

##### `embeddedHandlebarsComments`

- **Type**: `string[]`
- **Default**: [`["handlebars", "hbs"]`](./src/embedded/handlebars/options.ts)
- **Description**: Block comments that identify embedded Handlebars in template literals. Requires the [`@poliklot/prettier-plugin-handlebars`](https://github.com/Poliklot/prettier-plugin-handlebars#readme) plugin.

##### `embeddedHandlebarsTags`

- **Type**: `string[]`
- **Default**: [`["handlebars", "hbs"]`](./src/embedded/handlebars/options.ts)
- **Description**: Tags that identify embedded Handlebars in template literals. Requires the [`@poliklot/prettier-plugin-handlebars`](https://github.com/Poliklot/prettier-plugin-handlebars#readme) plugin.

Formatting embedded Handlebars requires the [`@poliklot/prettier-plugin-handlebars`](https://github.com/Poliklot/prettier-plugin-handlebars#readme) plugin to be installed and loaded. Its options control the embedded formatting behavior.

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

#### Hugo

##### `embeddedHugoComments`

- **Type**: `string[]`
- **Default**: [`["hugo", "hugoPost"]`](./src/embedded/hugo/options.ts)
- **Description**: Block comments that identify embedded Hugo in template literals. Requires the [`@htnabe/prettier-plugin-hugo-post`](https://github.com/htnabe/prettier-plugin-hugo-post#readme) plugin.

##### `embeddedHugoTags`

- **Type**: `string[]`
- **Default**: [`["hugo", "hugoPost"]`](./src/embedded/hugo/options.ts)
- **Description**: Tags that identify embedded Hugo in template literals. Requires the [`@htnabe/prettier-plugin-hugo-post`](https://github.com/htnabe/prettier-plugin-hugo-post#readme) plugin.

Formatting embedded Hugo requires the [`@htnabe/prettier-plugin-hugo-post`](https://github.com/htnabe/prettier-plugin-hugo-post#readme) plugin to be installed and loaded. Its options control the embedded formatting behavior.

#### INI

##### `embeddedIniComments`

- **Type**: `string[]`
- **Default**: [`["ini", "cfg", "pro"]`](./src/embedded/ini/options.ts)
- **Description**: Block comments that make their subsequent template literals be identified as embedded INI language. This option requires the [`prettier-plugin-ini`](https://github.com/kddnewton/prettier-plugin-ini#readme) plugin.

##### `embeddedIniTags`

- **Type**: `string[]`
- **Default**: [`["ini", "cfg", "pro"]`](./src/embedded/ini/options.ts)
- **Description**: Tags that make their subsequent template literals be identified as embedded INI language. This option requires the [`prettier-plugin-ini`](https://github.com/kddnewton/prettier-plugin-ini#readme) plugin.

Formatting embedded INI language requires the [`prettier-plugin-ini`](https://github.com/kddnewton/prettier-plugin-ini#readme) plugin to be loaded as well. And [options](https://github.com/kddnewton/prettier-plugin-ini#configuration) supported by `prettier-plugin-ini` can therefore be used to further control the formatting behavior.

#### Java

##### `embeddedJavaComments`

- **Type**: `string[]`
- **Default**: [`["java"]`](./src/embedded/java/options.ts)
- **Description**: Block comments that make their subsequent template literals be identified as embedded Java language. This option requires the [`prettier-plugin-java`](https://github.com/jhipster/prettier-java#readme) plugin.

##### `embeddedJavaTags`

- **Type**: `string[]`
- **Default**: [`["java"]`](./src/embedded/java/options.ts)
- **Description**: Tags that make their subsequent template literals be identified as embedded Java language. This option requires the [`prettier-plugin-java`](https://github.com/jhipster/prettier-java#readme) plugin.

Formatting embedded Java language requires the [`prettier-plugin-java`](https://github.com/jhipster/prettier-java#readme) plugin to be loaded as well. And [options](https://github.com/jhipster/prettier-java/blob/main/docs/advanced_usage.md#configuration) supported by `prettier-plugin-java` can therefore be used to further control the formatting behavior.

#### Jinja

##### `embeddedJinjaComments`

- **Type**: `string[]`
- **Default**: [`["jinja", "jinja2", "j2"]`](./src/embedded/jinja/options.ts)
- **Description**: Block comments that identify embedded Jinja in template literals. Requires the [`prettier-plugin-jinja-template`](https://github.com/davidodenwald/prettier-plugin-jinja-template#readme) plugin.

##### `embeddedJinjaTags`

- **Type**: `string[]`
- **Default**: [`["jinja", "jinja2", "j2"]`](./src/embedded/jinja/options.ts)
- **Description**: Tags that identify embedded Jinja in template literals. Requires the [`prettier-plugin-jinja-template`](https://github.com/davidodenwald/prettier-plugin-jinja-template#readme) plugin.

Formatting embedded Jinja requires the [`prettier-plugin-jinja-template`](https://github.com/davidodenwald/prettier-plugin-jinja-template#readme) plugin to be installed and loaded. Its options control the embedded formatting behavior.

The formatter uses the source block's line breaks to choose its layout. Write block bodies across lines for consistent formatting when their content wraps.

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
- **Description**: Block comments that make their subsequent template literals be identified as embedded JSONata language. This option requires the [`@stedi/prettier-plugin-jsonata`](https://www.npmjs.com/package/@stedi/prettier-plugin-jsonata) plugin.

##### `embeddedJsonataTags`

- **Type**: `string[]`
- **Default**: [`["jsonata"]`](./src/embedded/jsonata/options.ts)
- **Description**: Tags that make their subsequent template literals be identified as embedded JSONata language. This option requires the [`@stedi/prettier-plugin-jsonata`](https://www.npmjs.com/package/@stedi/prettier-plugin-jsonata) plugin.

Formatting embedded JSONata language requires the [`@stedi/prettier-plugin-jsonata`](https://www.npmjs.com/package/@stedi/prettier-plugin-jsonata) plugin to be loaded as well.

#### JTE

##### `embeddedJteComments`

- **Type**: `string[]`
- **Default**: [`["jte"]`](./src/embedded/jte/options.ts)
- **Description**: Block comments that identify embedded JTE in template literals. Requires the [`prettier-plugin-jte`](https://github.com/sgruendel/prettier-plugin-jte#readme) plugin.

##### `embeddedJteTags`

- **Type**: `string[]`
- **Default**: [`["jte"]`](./src/embedded/jte/options.ts)
- **Description**: Tags that identify embedded JTE in template literals. Requires the [`prettier-plugin-jte`](https://github.com/sgruendel/prettier-plugin-jte#readme) plugin.

Formatting embedded JTE requires the [`prettier-plugin-jte`](https://github.com/sgruendel/prettier-plugin-jte#readme) plugin to be installed and loaded. Its options control the embedded formatting behavior.

#### LaTeX

##### `embeddedLatexComments`

- **Type**: `string[]`
- **Default**: [`["latex", "tex", "aux", "cls", "bbl", "bib", "toc", "sty"]`](./src/embedded/latex/options.ts)
- **Description**: Block comments that make their subsequent template literals be identified as embedded LaTeX language. This option requires the [`prettier-plugin-latex`](https://github.com/siefkenj/prettier-plugin-latex#readme) plugin.

##### `embeddedLatexTags`

- **Type**: `string[]`
- **Default**: [`["latex", "tex", "aux", "cls", "bbl", "bib", "toc", "sty"]`](./src/embedded/latex/options.ts)
- **Description**: Tags that make their subsequent template literals be identified as embedded LaTeX language. This option requires the [`prettier-plugin-latex`](https://github.com/siefkenj/prettier-plugin-latex#readme) plugin.

Formatting embedded LaTeX language requires the [`prettier-plugin-latex`](https://github.com/siefkenj/prettier-plugin-latex#readme) plugin to be loaded as well.

#### Liquid

##### `embeddedLiquidComments`

- **Type**: `string[]`
- **Default**: [`["liquid"]`](./src/embedded/liquid/options.ts)
- **Description**: Block comments that identify embedded Liquid in template literals. Requires the [`@shopify/prettier-plugin-liquid`](https://github.com/Shopify/theme-tools/tree/main/packages/prettier-plugin-liquid#readme) plugin.

##### `embeddedLiquidTags`

- **Type**: `string[]`
- **Default**: [`["liquid"]`](./src/embedded/liquid/options.ts)
- **Description**: Tags that identify embedded Liquid in template literals. Requires the [`@shopify/prettier-plugin-liquid`](https://github.com/Shopify/theme-tools/tree/main/packages/prettier-plugin-liquid#readme) plugin.

Formatting embedded Liquid requires the [`@shopify/prettier-plugin-liquid`](https://github.com/Shopify/theme-tools/tree/main/packages/prettier-plugin-liquid#readme) plugin to be installed and loaded. Its options control the embedded formatting behavior.

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

#### Marko

##### `embeddedMarkoComments`

- **Type**: `string[]`
- **Default**: [`["marko"]`](./src/embedded/marko/options.ts)
- **Description**: Block comments that identify embedded Marko in template literals. Requires the [`prettier-plugin-marko`](https://github.com/marko-js/prettier#readme) plugin.

##### `embeddedMarkoTags`

- **Type**: `string[]`
- **Default**: [`["marko"]`](./src/embedded/marko/options.ts)
- **Description**: Tags that identify embedded Marko in template literals. Requires the [`prettier-plugin-marko`](https://github.com/marko-js/prettier#readme) plugin.

Formatting embedded Marko requires the [`prettier-plugin-marko`](https://github.com/marko-js/prettier#readme) plugin to be installed and loaded. Its options control the embedded formatting behavior.

#### Motoko

##### `embeddedMotokoComments`

- **Type**: `string[]`
- **Default**: [`["motoko", "mo"]`](./src/embedded/motoko/options.ts)
- **Description**: Block comments that identify embedded Motoko in template literals. Requires the [`prettier-plugin-motoko`](https://github.com/caffeinelabs/prettier-plugin-motoko#readme) plugin.

##### `embeddedMotokoTags`

- **Type**: `string[]`
- **Default**: [`["motoko", "mo"]`](./src/embedded/motoko/options.ts)
- **Description**: Tags that identify embedded Motoko in template literals. Requires the [`prettier-plugin-motoko`](https://github.com/caffeinelabs/prettier-plugin-motoko#readme) plugin.

Formatting embedded Motoko requires the [`prettier-plugin-motoko`](https://github.com/caffeinelabs/prettier-plugin-motoko#readme) plugin to be installed and loaded. Its options control the embedded formatting behavior.

#### Mustache

##### `embeddedMustacheComments`

- **Type**: `string[]`
- **Default**: [`["mustache"]`](./src/embedded/mustache/options.ts)
- **Description**: Block comments that identify embedded Mustache in template literals. Requires the [`prettier-plugin-mustache`](https://github.com/Poliklot/prettier-plugin-mustache#readme) plugin.

##### `embeddedMustacheTags`

- **Type**: `string[]`
- **Default**: [`["mustache"]`](./src/embedded/mustache/options.ts)
- **Description**: Tags that identify embedded Mustache in template literals. Requires the [`prettier-plugin-mustache`](https://github.com/Poliklot/prettier-plugin-mustache#readme) plugin.

Formatting embedded Mustache requires the [`prettier-plugin-mustache`](https://github.com/Poliklot/prettier-plugin-mustache#readme) plugin to be installed and loaded. Its options control the embedded formatting behavior.

#### NGINX

##### `embeddedNginxComments`

- **Type**: `string[]`
- **Default**: [`["nginx"]`](./src/embedded/nginx/options.ts)
- **Description**: Block comments that make their subsequent template literals be identified as embedded NGINX language. This option requires the [`prettier-plugin-nginx`](https://github.com/jxddk/prettier-plugin-nginx#readme) plugin.

##### `embeddedNginxTags`

- **Type**: `string[]`
- **Default**: [`["nginx"]`](./src/embedded/nginx/options.ts)
- **Description**: Tags that make their subsequent template literals be identified as embedded NGINX language. This option requires the [`prettier-plugin-nginx`](https://github.com/jxddk/prettier-plugin-nginx#readme) plugin.

Formatting embedded NGINX language requires the [`prettier-plugin-nginx`](https://github.com/jxddk/prettier-plugin-nginx#readme) plugin to be loaded as well. And [options](https://github.com/jxddk/prettier-plugin-nginx?tab=readme-ov-file#configuration) supported by `prettier-plugin-nginx` can therefore be used to further control the formatting behavior.

#### Nunjucks

##### `embeddedNunjucksComments`

- **Type**: `string[]`
- **Default**: [`["nunjucks", "njk"]`](./src/embedded/nunjucks/options.ts)
- **Description**: Block comments that identify embedded Nunjucks in template literals. Requires the [`prettier-plugin-nunjucks`](https://github.com/Poliklot/prettier-plugin-nunjucks#readme) plugin.

##### `embeddedNunjucksTags`

- **Type**: `string[]`
- **Default**: [`["nunjucks", "njk"]`](./src/embedded/nunjucks/options.ts)
- **Description**: Tags that identify embedded Nunjucks in template literals. Requires the [`prettier-plugin-nunjucks`](https://github.com/Poliklot/prettier-plugin-nunjucks#readme) plugin.

Formatting embedded Nunjucks requires the [`prettier-plugin-nunjucks`](https://github.com/Poliklot/prettier-plugin-nunjucks#readme) plugin to be installed and loaded. Its options control the embedded formatting behavior.

#### Pegjs

##### `embeddedPegjsComments`

- **Type**: `string[]`
- **Default**: [`["pegjs", "peggy", "peg"]`](./src/embedded/pegjs/options.ts)
- **Description**: Block comments that make their subsequent template literals be identified as embedded Pegjs language. This option requires the [`prettier-plugin-pegjs`](https://github.com/siefkenj/prettier-plugin-pegjs#readme) plugin.

##### `embeddedPegjsTags`

- **Type**: `string[]`
- **Default**: [`["pegjs", "peggy", "peg"]`](./src/embedded/pegjs/options.ts)
- **Description**: Tags that make their subsequent template literals be identified as embedded Pegjs language. This option requires the [`prettier-plugin-pegjs`](https://github.com/siefkenj/prettier-plugin-pegjs#readme) plugin.

Formatting embedded Pegjs language requires the [`prettier-plugin-pegjs`](https://github.com/siefkenj/prettier-plugin-pegjs#readme) plugin to be loaded as well. And [options](https://github.com/siefkenj/prettier-plugin-pegjs?tab=readme-ov-file#options) supported by `prettier-plugin-pegjs` can therefore be used to further control the formatting behavior.

Note that `prettier-plugin-pegjs` supports different parsers for the action blocks and they are specified by the [`actionParser` option](https://github.com/siefkenj/prettier-plugin-pegjs?tab=readme-ov-file#options). If you want to specify different action parsers for different comments or tags, check [`embeddedOverrides`](#embeddedoverrides-1).

#### PHP

##### `embeddedPhpComments`

- **Type**: `string[]`
- **Default**: [`["php", "php5"]`](./src/embedded/php/options.ts)
- **Description**: Block comments that make their subsequent template literals be identified as embedded PHP language. This option requires the [`@prettier/plugin-php`](https://github.com/prettier/plugin-php#readme) plugin.

##### `embeddedPhpTags`

- **Type**: `string[]`
- **Default**: [`["php", "php5"]`](./src/embedded/php/options.ts)
- **Description**: Tags that make their subsequent template literals be identified as embedded PHP language. This option requires the [`@prettier/plugin-php`](https://github.com/prettier/plugin-php#readme) plugin.

Formatting embedded PHP language requires the [`@prettier/plugin-php`](https://github.com/prettier/plugin-php#readme) plugin to be loaded as well. And [options](https://github.com/prettier/plugin-php#configuration) supported by `@prettier/plugin-php` can therefore be used to further control the formatting behavior.

#### PowerShell

##### `embeddedPowerShellComments`

- **Type**: `string[]`
- **Default**: [`["powershell", "ps1"]`](./src/embedded/powershell/options.ts)
- **Description**: Block comments that identify embedded PowerShell in template literals. Requires the [`prettier-plugin-powershell`](https://github.com/Nick2bad4u/Prettier-Plugin-Powershell#readme) plugin.

##### `embeddedPowerShellTags`

- **Type**: `string[]`
- **Default**: [`["powershell", "ps1"]`](./src/embedded/powershell/options.ts)
- **Description**: Tags that identify embedded PowerShell in template literals. Requires the [`prettier-plugin-powershell`](https://github.com/Nick2bad4u/Prettier-Plugin-Powershell#readme) plugin.

Formatting embedded PowerShell requires the [`prettier-plugin-powershell`](https://github.com/Nick2bad4u/Prettier-Plugin-Powershell#readme) plugin to be installed and loaded. Its options control the embedded formatting behavior.

#### Prisma

##### `embeddedPrismaComments`

- **Type**: `string[]`
- **Default**: [`["prisma"]`](./src/embedded/prisma/options.ts)
- **Description**: Block comments that make their subsequent template literals be identified as embedded Prisma language. This option requires the [`prettier-plugin-prisma`](https://github.com/avocadowastaken/prettier-plugin-prisma#readme) plugin.

##### `embeddedPrismaTags`

- **Type**: `string[]`
- **Default**: [`["prisma"]`](./src/embedded/prisma/options.ts)
- **Description**: Tags that make their subsequent template literals be identified as embedded Prisma language. This option requires the [`prettier-plugin-prisma`](https://github.com/avocadowastaken/prettier-plugin-prisma#readme) plugin.

Formatting embedded Prisma language requires the [`prettier-plugin-prisma`](https://github.com/avocadowastaken/prettier-plugin-prisma#readme) plugin to be loaded as well.

#### Properties

##### `embeddedPropertiesComments`

- **Type**: `string[]`
- **Default**: [`["properties"]`](./src/embedded/properties/options.ts)
- **Description**: Block comments that make their subsequent template literals be identified as embedded Properties language. This option requires the [`prettier-plugin-properties`](https://github.com/eemeli/prettier-plugin-properties#readme) plugin.

##### `embeddedPropertiesTags`

- **Type**: `string[]`
- **Default**: [`["properties"]`](./src/embedded/properties/options.ts)
- **Description**: Tags that make their subsequent template literals be identified as embedded Properties language. This option requires the [`prettier-plugin-properties`](https://github.com/eemeli/prettier-plugin-properties#readme) plugin.

Formatting embedded Properties language requires the [`prettier-plugin-properties`](https://github.com/eemeli/prettier-plugin-properties#readme) plugin to be loaded as well. And [options](https://github.com/eemeli/prettier-plugin-properties#configuration) supported by `prettier-plugin-properties` can therefore be used to further control the formatting behavior.

#### Pug

##### `embeddedPugComments`

- **Type**: `string[]`
- **Default**: [`["pug", "jade"]`](./src/embedded/pug/options.ts)
- **Description**: Block comments that make their subsequent template literals be identified as embedded Pug language. This option requires the [`@prettier/plugin-pug`](https://github.com/prettier/plugin-pug#readme) plugin.

##### `embeddedPugTags`

- **Type**: `string[]`
- **Default**: [`["pug", "jade"]`](./src/embedded/pug/options.ts)
- **Description**: Tags that make their subsequent template literals be identified as embedded Pug language. This option requires the [`@prettier/plugin-pug`](https://github.com/prettier/plugin-pug#readme) plugin.

Formatting embedded Pug language requires the [`@prettier/plugin-pug`](https://github.com/prettier/plugin-pug#readme) plugin to be loaded as well. And [options](https://github.com/prettier/plugin-pug?tab=readme-ov-file#configuration) supported by `@prettier/plugin-pug` can therefore be used to further control the formatting behavior.

#### Ruby

##### `embeddedRubyComments`

- **Type**: `string[]`
- **Default**: [`["ruby"]`](./src/embedded/ruby/options.ts)
- **Description**: Block comments that make their subsequent template literals be identified as embedded Ruby language. This option requires the [`@prettier/plugin-ruby`](https://github.com/prettier/plugin-ruby#readme) plugin.

##### `embeddedRubyTags`

- **Type**: `string[]`
- **Default**: [`["ruby"]`](./src/embedded/ruby/options.ts)
- **Description**: Tags that make their subsequent template literals be identified as embedded Ruby language. This option requires the [`@prettier/plugin-ruby`](https://github.com/prettier/plugin-ruby#readme) plugin.

##### `embeddedRubyParser`

- **Type**: [`"ruby" | "rbs" | "haml"`](./src/embedded/ruby/options.ts)
- **Default**: [`"ruby"`](./src/embedded/ruby/options.ts)
- **Description**: The parser used to parse the embedded Ruby language. This option requires the [`@prettier/plugin-ruby`](https://github.com/prettier/plugin-ruby#readme) plugin.

Formatting embedded Ruby language requires the [`@prettier/plugin-ruby`](https://github.com/prettier/plugin-ruby#readme) to be loaded and [its dependencies to be installed](https://github.com/prettier/plugin-ruby#getting-started) as well. And [options](https://github.com/prettier/plugin-ruby#configuration) supported by `@prettier/plugin-ruby` can therefore be used to further control the formatting behavior.

If you want to specify different parsers for different comments or tags, check [`embeddedOverrides`](#embeddedoverrides-1).

#### Sh (Shell)

##### `embeddedShComments`

- **Type**: `string[]`
- **Default**: [`["sh"]`](./src/embedded/sh/options.ts)
- **Description**: Block comments that make their subsequent template literals be identified as embedded Shell language. This option requires the [`prettier-plugin-sh`](https://github.com/un-ts/prettier/tree/master/packages/sh#readme) plugin.

##### `embeddedShTags`

- **Type**: `string[]`
- **Default**: [`["sh"]`](./src/embedded/sh/options.ts)
- **Description**: Tags that make their subsequent template literals be identified as embedded Shell language. This option requires the [`prettier-plugin-sh`](https://github.com/un-ts/prettier/tree/master/packages/sh#readme) plugin.

Formatting embedded Shell language requires the [`prettier-plugin-sh`](https://github.com/un-ts/prettier/tree/master/packages/sh#readme) plugin to be loaded as well. And [options](https://github.com/un-ts/prettier/tree/master/packages/sh#parser-options) supported by `prettier-plugin-sh` can therefore be used to further control the formatting behavior.

Note that `prettier-plugin-sh` supports different variants of shell syntaxes and they are specified by the [`variant` option](https://github.com/un-ts/prettier/tree/master/packages/sh#parser-options). If you want to specify different variants for different comments or tags, check [`embeddedOverrides`](#embeddedoverrides-1).

#### Solidity

##### `embeddedSolidityComments`

- **Type**: `string[]`
- **Default**: [`["solidity", "sol"]`](./src/embedded/solidity/options.ts)
- **Description**: Block comments that identify embedded Solidity in template literals. Requires the [`prettier-plugin-solidity`](https://github.com/prettier-solidity/prettier-plugin-solidity#readme) plugin.

##### `embeddedSolidityTags`

- **Type**: `string[]`
- **Default**: [`["solidity", "sol"]`](./src/embedded/solidity/options.ts)
- **Description**: Tags that identify embedded Solidity in template literals. Requires the [`prettier-plugin-solidity`](https://github.com/prettier-solidity/prettier-plugin-solidity#readme) plugin.

##### `embeddedSolidityParser`

- **Type**: [`"slang" | "antlr" | "solidity-parse"`](./src/embedded/solidity/options.ts)
- **Default**: [`"slang"`](./src/embedded/solidity/options.ts)
- **Description**: The parser used to format embedded Solidity.

Formatting embedded Solidity requires the [`prettier-plugin-solidity`](https://github.com/prettier-solidity/prettier-plugin-solidity#readme) plugin to be installed and loaded. Its options control the embedded formatting behavior.

Choose `"slang"` or `"antlr"` with current formatter versions. Formatter versions exposing `"solidity-parse"` use `embeddedSolidityParser: "solidity-parse"`.

#### SQL

##### `embeddedSqlComments`

- **Type**: `string[]`
- **Default**: [`["sql"]`](./src/embedded/sql/options.ts)
- **Description**: Block comments that make their subsequent template literals be identified as embedded SQL language. This option requires the [`prettier-plugin-sql`](https://github.com/un-ts/prettier/tree/master/packages/sql#readme) plugin or the [`prettier-plugin-sql-cst`](https://github.com/nene/prettier-plugin-sql-cst#readme) plugin.

##### `embeddedSqlTags`

- **Type**: `string[]`
- **Default**: [`["sql"]`](./src/embedded/sql/options.ts)
- **Description**: Tags that make their subsequent template literals be identified as embedded SQL language. This option requires the [`prettier-plugin-sql`](https://github.com/un-ts/prettier/tree/master/packages/sql#readme) plugin or the [`prettier-plugin-sql-cst`](https://github.com/nene/prettier-plugin-sql-cst#readme) plugin.

##### `embeddedSqlPlugin`

- **Type**: [`"prettier-plugin-sql" | "prettier-plugin-sql-cst"`](./src/embedded/sql/options.ts)
- **Default**: [`"prettier-plugin-sql"`](./src/embedded/sql/options.ts)
- **Description**: The plugin used to format the embedded SQL language. This option requires the [`prettier-plugin-sql`](https://github.com/un-ts/prettier/tree/master/packages/sql#readme) plugin or the [`prettier-plugin-sql-cst`](https://github.com/nene/prettier-plugin-sql-cst#readme) plugin.

##### `embeddedSqlParser`

- **Type**: [`"sqlite" | "bigquery" | "mysql" | "mariadb" | "postgresql"` ](./src/embedded/sql/options.ts)
- **Default**: [`"sqlite"`](./src/embedded/sql/options.ts)
- **Description**: Specify the embedded SQL language parser. This option is only needed with the `prettier-plugin-sql-cst` plugin.

Formatting embedded SQL language requires the [`prettier-plugin-sql`](https://github.com/un-ts/prettier/tree/master/packages/sql#readme) plugin or the [`prettier-plugin-sql-cst`](https://github.com/nene/prettier-plugin-sql-cst#readme) plugin to be loaded as well. And [options](https://github.com/un-ts/prettier/tree/master/packages/sql#parser-options) supported by `prettier-plugin-sql`, or [options](https://github.com/nene/prettier-plugin-sql-cst?tab=readme-ov-file#configuration) supported by `prettier-plugin-sql-cst` can therefore be used to further control the formatting behavior.

Note that `prettier-plugin-sql` supports many different SQL dialects which are specified by the [`language`, `database` or `dialect` option](https://github.com/un-ts/prettier/tree/master/packages/sql#parser-options). And `prettier-plugin-sql-cst` also supports various parsers as shown above. If you want to specify different dialects or parsers for different comments or tags, check [`embeddedOverrides`](#embeddedoverrides-1).

#### Svelte

##### `embeddedSvelteComments`

- **Type**: `string[]`
- **Default**: [`["svelte"]`](./src/embedded/svelte/options.ts)
- **Description**: Block comments that identify embedded Svelte in template literals. Requires the [`prettier-plugin-svelte`](https://github.com/sveltejs/prettier-plugin-svelte#readme) plugin.

##### `embeddedSvelteTags`

- **Type**: `string[]`
- **Default**: [`["svelte"]`](./src/embedded/svelte/options.ts)
- **Description**: Tags that identify embedded Svelte in template literals. Requires the [`prettier-plugin-svelte`](https://github.com/sveltejs/prettier-plugin-svelte#readme) plugin.

Formatting embedded Svelte requires the [`prettier-plugin-svelte`](https://github.com/sveltejs/prettier-plugin-svelte#readme) plugin to be installed and loaded. Its options control the embedded formatting behavior.

Supply the `svelte` compiler alongside the formatter plugin, using versions compatible with the project's Svelte version.

#### TOML

##### `embeddedTomlComments`

- **Type**: `string[]`
- **Default**: [`["toml"]`](./src/embedded/toml/options.ts)
- **Description**: Block comments that make their subsequent template literals be identified as embedded TOML language. This option requires the [`prettier-plugin-toml`](https://github.com/un-ts/prettier/tree/master/packages/toml#readme) plugin.

##### `embeddedTomlTags`

- **Type**: `string[]`
- **Default**: [`["toml"]`](./src/embedded/toml/options.ts)
- **Description**: Tags that make their subsequent template literals be identified as embedded TOML language. This option requires the [`prettier-plugin-toml`](https://github.com/un-ts/prettier/tree/master/packages/toml#readme) plugin.

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
- **Description**: Block comments that make their subsequent template literals be identified as embedded XML language. This option requires the [`@prettier/plugin-xml`](https://github.com/prettier/plugin-xml#readme) plugin.

##### `embeddedXmlTags`

- **Type**: `string[]`
- **Default**: [`["xml", "opml", "rss", "svg"]`](./src/embedded/xml/options.ts)
- **Description**: Tags that make their subsequent template literals be identified as embedded XML language. This option requires the [`@prettier/plugin-xml`](https://github.com/prettier/plugin-xml#readme) plugin.

Embedded XML uses the parser provided by [`@prettier/plugin-xml`](https://github.com/prettier/plugin-xml#readme), which must be loaded when XML formatting is enabled. Its [options](https://github.com/prettier/plugin-xml#configuration) control the XML formatting behavior.

#### XQuery

##### `embeddedXQueryComments`

- **Type**: `string[]`
- **Default**: [`["xquery", "xq"]`](./src/embedded/xquery/options.ts)
- **Description**: Block comments that identify embedded XQuery in template literals. Requires the [`prettier-plugin-xquery`](https://github.com/DrRataplan/prettier-plugin-xquery#readme) plugin.

##### `embeddedXQueryTags`

- **Type**: `string[]`
- **Default**: [`["xquery", "xq"]`](./src/embedded/xquery/options.ts)
- **Description**: Tags that identify embedded XQuery in template literals. Requires the [`prettier-plugin-xquery`](https://github.com/DrRataplan/prettier-plugin-xquery#readme) plugin.

##### `embeddedXQueryParser`

- **Type**: [`"xquery" | "xquery4"`](./src/embedded/xquery/options.ts)
- **Default**: [`"xquery"`](./src/embedded/xquery/options.ts)
- **Description**: The parser used to format embedded XQuery.

Formatting embedded XQuery requires the [`prettier-plugin-xquery`](https://github.com/DrRataplan/prettier-plugin-xquery#readme) plugin to be installed and loaded. Its options control the embedded formatting behavior.

The default `"xquery"` parser formats XQuery 3.1. Select `"xquery4"` for the XQuery 4 syntax supported by the installed formatter version.

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

This preserves the original exterior whitespace characters, including their indentation. Without this option, whitespace-sensitive markup such as HTML and Jinja preserves whether boundary whitespace exists and allows its indentation to be formatted.

##### `noEmbeddedMultiLineIndentation`

- **Type**: `string[]`
- **Default**: `[]`
- **Description**: Turns off auto indentation in the formatting results for the specified comments or tags when they are formatted to span multi lines.

This removes the extra indentation level added around the embedded content. Indentation within the embedded language is still formatted. For example, `"noEmbeddedMultiLineIndentation": ["html", "jinja"]` disables that extra level for both tags and comments. It can be combined with `preserveEmbeddedExteriorWhitespaces`.

##### `embeddedOverrides`

- **Type**: `string`
- **Default**: `undefined`
- **Description**: Option overrides for the specified comments or tags. It should either be a stringified JSON or an absolute filepath to the option overrides file. See [below](#embeddedoverrides-1) for a detailed explanation.

#### `embeddedOverrides`

This option is provided for users to override certain options based on comments or tags. Due to the lack of support for using objects in prettier plugin options (https://github.com/prettier/prettier/issues/14671), it accepts a **stringified** json string, or a file path with an extension of `.json`, `.jsonc`, `.js`, `.cjs`, `.mjs`, `.ts`, `.cts` or `.mts` as its value. If no extension is provided, it will be treated as a `.json`/`.jsonc` file. For relative paths, it will automatically figure out the prettier config location and use that as the base path.

TypeScript override files (`.ts`, `.mts` and `.cts`) are loaded with the active runtime's `import()`. Node.js with [native type stripping](https://nodejs.org/api/typescript.html) enabled can load erasable TypeScript, and Bun provides native TypeScript loading. The runtime determines module semantics: `.mts` uses ES modules, `.cts` uses CommonJS, and `.ts` follows the package's module type.

Consumers can enable a compatible loader through Node.js startup options, such as `node --import tsx node_modules/prettier/bin/prettier.cjs . --write`. Override files are evaluated in workers, which inherit the runtime's startup preloads. Enable synchronous module hooks through a `--import` or `--require` preload so they are available in those workers. When the runtime reports unsupported module loading or TypeScript transformation, the plugin can use the consumer project's optional [`tsx`](https://github.com/privatenumber/tsx#readme) 4.19+ installation as a fallback. This fallback uses Node.js's [`module.register()`](https://nodejs.org/api/module.html#moduleregisterspecifier-parenturl-options) API, introduced in Node.js 18.19 and 20.6. Configuration errors include their original diagnostics.

The Prettier VS Code extension uses its bundled Node.js runtime; JavaScript override files provide the simplest editor setup.

Each override module load uses a fresh worker and module cache, so edits to the override file and its imported modules are reflected in subsequent formatting calls. Workers are released after the configuration has been read. Relative paths follow Prettier's configuration discovery and its [`clearConfigCache()`](https://prettier.io/docs/api#prettierclearconfigcache) API.

The resolved value should be an array of objects. Each object in the array must have 2 fields: `comments` and `options`, or `tags` and `options`. The `options` are considered overrides that will be applied to the global `options` of prettier for those `comments` and `tags` only. It's like the [`overrides`](https://prettier.io/docs/en/configuration.html#configuration-overrides) of `prettier`, but it is comment/tag-based instead of file-based.

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
