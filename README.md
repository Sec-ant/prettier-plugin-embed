<div align="center">

![prettier-plugin-embed-light](./asset/prettier-plugin-embed-wide-light.svg#gh-light-mode-only)
![prettier-plugin-embed-dark](./asset/prettier-plugin-embed-wide-dark.svg#gh-dark-mode-only)

# Prettier Plugin Embed

[![npm version](https://img.shields.io/npm/v/prettier-plugin-embed?cacheSeconds=300)](https://www.npmjs.com/package/prettier-plugin-embed/v/latest) [![npm downloads](https://img.shields.io/npm/dm/prettier-plugin-embed?cacheSeconds=300)](https://www.npmjs.com/package/prettier-plugin-embed/v/latest) [![npm license](https://img.shields.io/npm/l/prettier-plugin-embed?cacheSeconds=300)](https://www.npmjs.com/package/prettier-plugin-embed/v/latest)

[![github last commit](https://img.shields.io/github/last-commit/Sec-ant/prettier-plugin-embed?cacheSeconds=300)](https://github.com/Sec-ant/prettier-plugin-embed) [![bundlephobia minzipped](https://img.shields.io/bundlephobia/minzip/prettier-plugin-embed?cacheSeconds=300)](https://bundlephobia.com/package/prettier-plugin-embed@latest) [![](https://img.shields.io/jsdelivr/npm/hm/prettier-plugin-embed?cacheSeconds=300&color=ff5627)](https://www.jsdelivr.com/package/npm/prettier-plugin-embed)

A Configurable [Prettier](https://prettier.io/) [Plugin](https://prettier.io/docs/en/plugins.html) to Format [Embedded Languages](https://prettier.io/docs/en/options.html#embedded-language-formatting) in `js`/`ts` Files.

```bash
npm i -D prettier-plugin-embed
```

</div>

## Introduction

### What?

This Prettier plugin (namely [`prettier-plugin-embed`](https://github.com/Sec-ant/prettier-plugin-embed)) provides a configurable solution for formatting embedded languages in the form of [template literals](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Template_literals) within JavaScript or TypeScript files.

### Why?

Although Prettier has introduced the [`embedded-language-formatting`](https://prettier.io/docs/en/options.html#embedded-language-formatting) option for formatting embedded languages, it only supports two modes: `auto` and `off`. Therefore it doesn't allow for individual formatting adjustments for specific languages, nor does it support customizing the languages that require formatting and identifiers for identification. These limitations restrict the usability of this feature. For more detailed discussions, refer to: https://github.com/prettier/prettier/issues/4424 and https://github.com/prettier/prettier/issues/5588.

### How?

By leveraging Prettier's plugin system, this plugin overrides the default [`embed`](https://prettier.io/docs/en/plugins#optional-embed) function of the `estree` printer, so varieties of new languages can be hooked in through this function. Check [this file](./src/printers.ts) to get an idea of how this is accomplished.

## Features

- **Support for Additional Languages:** Extend the embedded language formatting capability to include languages such as XML, SQL, PHP, and more.

- **Dual Identification Modes:** Identify embedded languages by tags `` identifier`...` `` or comments `` /* identifier */ `...` `` preceding the template literals.

- **Customizable Language Identifiers:** Customize the identifiers used for identifying the embedded languages.

- **Formatting Opt-out Mechanism:** Offer the capability to deactivate formatting for certain identifiers, including the default ones (`html`, `css`...) supported by the `embedded-language-formatting` option.

- **Configurable Formatting Style:** Provide additional options to tailor the formatting style for embedded languages.

- **Strongly Typed API:** Benefit from comprehensive type support for configuring this plugin's options when employing the [Prettier API](https://prettier.io/docs/en/api) in TypeScript.

- **Easy Integration:** Integrate with the existing Prettier setup seamlessly, requiring minimal configuration to get started.

## Installation

```bash
npm i -D prettier-plugin-embed
```

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

### Quick Start Config Examples

Here're some [quick start config examples](./ConfigExamples.md) to use this plugin for various embedded languages. Check beblow for a detailed explanation of all the available options.

### An Overview of the Philosophy

To use this plugin, [`embedded-language-formatting`](https://prettier.io/docs/en/options.html#embedded-language-formatting) option must be set to `auto` (which is the default setting as of now), because this option serves as the main switch for activating embedded language formatting.

This plugin does not aim to implement parsers or printers to support every newly added embedded language. Instead, ideally, it makes use of existing [Prettier plugins](https://prettier.io/docs/en/plugins.html#official-plugins) for those languages and only adds formatting support when they are embedded in template literals.

Therefore, to enable formatting for a specific embedded language, the corresponding Prettier plugin for that language must also be loaded. For example, if you wish to format embedded XML language, you will need to load both this plugin and [`@prettier/plugin-xml`](https://github.com/prettier/plugin-xml). To find out which other plugins are required when using this plugin, please refer to the [Language-Specific Options](#language-specific-options) section below.

Embedded languages to be formatted are required to be enclosed in the template literals, and are identified by the preceding [tags](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates) `` identifier`...` `` or [block comments](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Lexical_grammar#block_comments) `` /* identifier */ `...` ``. This plugin comes pre-configured with a built-in set of identifiers for identifying various embedded languages. For instance, using identifiers like `xml` or `svg` will trigger automatic formatting for the embedded XML language. You can specify an alternative list of identifiers using the `embeddedXmlIdentifiers` option. The naming convention for these options follows the pattern of `embedded<Language>Identifiers` for other languages as well. Further details on these options and how to configure them are also available in the [Language-Specific Options](#language-specific-options) section.

To exclude certain identifiers from being identified, including the default ones supported by the [`embedded-language-formatting`](https://prettier.io/docs/en/options.html#embedded-language-formatting) option, add them to the list of the `embeddedNoopIdentifiers` option. Any matching identifiers listed in this option will take precedence over other `embedded<Language>Identifiers` options, effectively disabling their formatting.

> [!IMPORTANT]
>
> Until this notice is removed, always specify identifiers explicitly and do not rely on the built-in defaults, as they may be subject to change.

### Language-Specific Options

Supported embedded languages are:

- [CSS](#css)
- [ES (ECMAScript/JavaScript)](#es-ecmascriptjavascript)
- [GLSL](#glsl)
- [GraphQL](#graphql)
- [HTML](#html)
- [INI](#ini)
- [JSON](#json)
- [JSONata](#jsonata)
- [LaTeX](#latex)
- [Markdown](#markdown)
- [NGINX](#nginx)
- [Pegjs](#pegjs)
- [PHP](#php)
- [Prisma](#prisma)
- [Properties](#properties)
- [Ruby](#ruby)
- [Sh (Shell)](#sh-shell)
- [SQL](#sql)
- [TOML](#TOML)
- [TS (TypeScript)](#ts-typescript)
- [XML](#xml)
- [YAML](#yaml)

<details open>
<summary>
Click Here to Toggle
</summary>

#### NOOP

|          Option           |    Type    |                Default                 | Description                                                                                                                                           |
| :-----------------------: | :--------: | :------------------------------------: | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `embeddedNoopIdentifiers` | `string[]` | [`[]`](./src/embedded/noop/options.ts) | Tag or comment identifiers that prevent their subsequent template literals from being identified as embedded languages and thus from being formatted. |

This option doesn't require other plugins and can override the native embedded language formatting. It serves as a way to turn off embedded language formatting for the specified language identifiers.

#### CSS

|          Option          |                             Type                             |                  Default                   | Description                                                                                                     |
| :----------------------: | :----------------------------------------------------------: | :----------------------------------------: | --------------------------------------------------------------------------------------------------------------- |
| `embeddedCssIdentifiers` |                          `string[]`                          | [`["css"]`](./src/embedded/css/options.ts) | Tag or comment identifiers that make their subsequent template literals be identified as embedded CSS language. |
|   `embeddedCssParser`    | [`"css"  \| "less"\| "scss"`](./src/embedded/css/options.ts) | [`"scss"`](./src/embedded/css/options.ts)  | The parser used to parse the embedded CSS language.                                                             |

Formatting embedded CSS language doesn't require other plugins and uses the parsers and printers provided by Prettier natively.

This can override the native formatting bahavior for embedded CSS language. If you want to keep the native behavior, set `embeddedCssIdentifiers` to `[]` or other identifiers.

If you want to specify different parsers for different identifiers, check [`embeddedOverrides`](#embeddedoverrides).

#### ES (ECMAScript/JavaScript)

|         Option          |                                                  Type                                                   |                                             Default                                             | Description                                                                                                                       |
| :---------------------: | :-----------------------------------------------------------------------------------------------------: | :---------------------------------------------------------------------------------------------: | --------------------------------------------------------------------------------------------------------------------------------- |
| `embeddedEsIdentifiers` |                                               `string[]`                                                | [`["js", "jsx", "es", "es6", "mjs", "cjs", "pac", "javascript"]`](./src/embedded/es/options.ts) | Tag or comment identifiers that make their subsequent template literals be identified as embedded ECMAScript/JavaScript language. |
|   `embeddedEsParser`    | [`"babel" \| "babel-flow" \| "acorn" \| "espree" \| "flow" \| "meriyah"`](./src/embedded/es/options.ts) |                            [`"babel"`](./src/embedded/es/options.ts)                            | The parser used to parse the embedded ECMASCript/JavaScript language.                                                             |

Formatting embedded ECMAScript language doesn't require other plugins and uses the parsers and printers provided by Prettier natively.

If you want to specify different parsers for different identifiers, check [`embeddedOverrides`](#embeddedoverrides).

#### GLSL

|          Option           |    Type    |                        Default                         | Description                                                                                                                                                              |
| :-----------------------: | :--------: | :----------------------------------------------------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `embeddedGlslIdentifiers` | `string[]` | [`["glsl", "shader"]`](./src/embedded/glsl/options.ts) | Tag or comment identifiers that make their subsequent template literals be identified as embedded GLSL language. This option requires the `prettier-plugin-glsl` plugin. |

Formatting embedded GLSL language requires the [`prettier-plugin-glsl`](https://github.com/NaridaL/glsl-language-toolkit/tree/main/packages/prettier-plugin-glsl) plugin to be loaded as well.

#### GraphQL

|            Option            |    Type    |                          Default                          | Description                                                                                                         |
| :--------------------------: | :--------: | :-------------------------------------------------------: | ------------------------------------------------------------------------------------------------------------------- |
| `embeddedGraphqlIdentifiers` | `string[]` | [`["graphql", "gql"]`](./src/embedded/graphql/options.ts) | Tag or comment identifiers that make their subsequent template literals be identified as embedded GraphQL language. |

Formatting embedded GraphQL language doesn't require other plugins and uses the parsers and printers provided by Prettier natively.

This can override the native formatting behavior for embedded GraphQL language. If you want to keep the native behavior, set `embeddedGraphqlIdentifiers` to `[]` or other identifiers.

#### HTML

|          Option           |                                   Type                                    |                        Default                        | Description                                                                                                      |
| :-----------------------: | :-----------------------------------------------------------------------: | :---------------------------------------------------: | ---------------------------------------------------------------------------------------------------------------- |
| `embeddedHtmlIdentifiers` |                                `string[]`                                 | [`["html", "xhtml"]`](./src/embedded/html/options.ts) | Tag or comment identifiers that make their subsequent template literals be identified as embedded HTML language. |
|   `embeddedHtmlParser`    | [`"html" \| "vue" \| "angular" \| "lwc"`](./src/embedded/html/options.ts) |      [`"html"`](./src/embedded/html/options.ts)       | The parser used to parse the embedded HTML language.                                                             |

Formatting embedded HTML language doesn't require other plugins and uses the parsers and printers provided by Prettier natively.

This can override the native formatting behavior for embedded HTML language. If you want to keep the native behavior, set `embeddedHtmlIdentifiers` to `[]` or other identifiers.

If you want to specify different parsers for different identifiers, check [`embeddedOverrides`](#embeddedoverrides).

#### INI

|          Option          |    Type    |                         Default                          | Description                                                                                                                                                            |
| :----------------------: | :--------: | :------------------------------------------------------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `embeddedIniIdentifiers` | `string[]` | [`["ini", "cfg", "pro"]`](./src/embedded/ini/options.ts) | Tag or comment identifiers that make their subsequent template literals be identified as embedded INI language. This option requires the `prettier-plugin-ini` plugin. |

Formatting embedded INI language requires the [`prettier-plugin-ini`](https://github.com/kddnewton/prettier-plugin-ini) plugin to be loaded as well. And [options](https://github.com/kddnewton/prettier-plugin-ini#configuration) supported by `prettier-plugin-ini` can therefore be used to further control the formatting behavior.

#### JSON

|          Option           |                                         Type                                         |                        Default                        | Description                                                                                                      |
| :-----------------------: | :----------------------------------------------------------------------------------: | :---------------------------------------------------: | ---------------------------------------------------------------------------------------------------------------- |
| `embeddedJsonIdentifiers` |                                      `string[]`                                      | [`["json", "jsonl"]`](./src/embedded/json/options.ts) | Tag or comment identifiers that make their subsequent template literals be identified as embedded JSON language. |
|   `embeddedJsonParser`    | [`"json" \| "json5" \| "jsonc" \| "json-stringify"`](./src/embedded/json/options.ts) |      [`"json"`](./src/embedded/json/options.ts)       | The parser used to parse the embedded JSON language.                                                             |

Formatting embedded JSON language doesn't require other plugins and uses the parsers and printers provided by Prettier natively.

If you want to specify different parsers for different identifiers, check [`embeddedOverrides`](#embeddedoverrides).

#### JSONata

|            Option            |    Type    |                      Default                       | Description                                                                                                                                                                           |
| :--------------------------: | :--------: | :------------------------------------------------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `embeddedJsonataIdentifiers` | `string[]` | [`["jsonata"]`](./src/embedded/jsonata/options.ts) | Tag or comment identifiers that make their subsequent template literals be identified as embedded JSONata language. This option requires the `@stedi/prettier-plugin-jsonata` plugin. |

Formatting embedded JSONata language requires the [`@stedi/prettier-plugin-jsonata`](https://github.com/Stedi/prettier-plugin-jsonata) plugin to be loaded as well.

#### LaTeX

|           Option           |    Type    |                                             Default                                             | Description                                                                                                                                                                |
| :------------------------: | :--------: | :---------------------------------------------------------------------------------------------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `embeddedLatexIdentifiers` | `string[]` | [`["latex", "tex", "aux", "cls", "bbl", "bib", "toc", "sty"]`](./src/embedded/latex/options.ts) | Tag or comment identifiers that make their subsequent template literals be identified as embedded LaTeX language. This option requires the `prettier-plugin-latex` plugin. |

Formatting embedded LaTeX language requires the [`prettier-plugin-latex`](https://github.com/siefkenj/prettier-plugin-latex) plugin to be loaded as well.

#### Markdown

|            Option             |                                  Type                                   |                          Default                           | Description                                                                                                          |
| :---------------------------: | :---------------------------------------------------------------------: | :--------------------------------------------------------: | -------------------------------------------------------------------------------------------------------------------- |
| `embeddedMarkdownIdentifiers` |                               `string[]`                                | [`["md", "markdown"]`](./src/embedded/markdown/options.ts) | Tag or comment identifiers that make their subsequent template literals be identified as embedded Markdown language. |
|   `embeddedMarkdownParser`    | [`"markdown"  \| "mdx"\| "remark"`](./src/embedded/markdown/options.ts) |     [`"markdown"`](./src/embedded/markdown/options.ts)     | The parser used to parse the embedded Markdown language.                                                             |

Formatting embedded Markdown language doesn't require other plugins and uses the parsers and printers provided by Prettier natively.

This can override the native formatting for embedded Markdown language. If you want to keep the native behavior, set `embeddedMarkdownIdentifiers` to `[]` or other identifiers.

If you want to specify different parsers for different identifiers, check [`embeddedOverrides`](#embeddedoverrides).

The `remark` parser is [an alias of the `markdown` parser](https://github.com/prettier/prettier/blob/ed23dacc9e655c3876971b30859497b17ff2cf9f/src/language-markdown/parser-markdown.js#L57).

#### NGINX

|           Option           |    Type    |                    Default                     | Description                                                                                                                                                                |
| :------------------------: | :--------: | :--------------------------------------------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `embeddedNginxIdentifiers` | `string[]` | [`["nginx"]`](./src/embedded/nginx/options.ts) | Tag or comment identifiers that make their subsequent template literals be identified as embedded NGINX language. This option requires the `prettier-plugin-nginx` plugin. |

Formatting embedded Pegjs language requires the [`prettier-plugin-nginx`](https://github.com/jxddk/prettier-plugin-nginx) plugin to be loaded as well. And [options](https://github.com/jxddk/prettier-plugin-nginx?tab=readme-ov-file#configuration) supported by `prettier-plugin-nginx` can therefore be used to further control the formatting behavior.

#### Pegjs

|           Option           |    Type    |                            Default                             | Description                                                                                                                                                                |
| :------------------------: | :--------: | :------------------------------------------------------------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `embeddedPegjsIdentifiers` | `string[]` | [`["pegjs", "peggy", "peg"]`](./src/embedded/pegjs/options.ts) | Tag or comment identifiers that make their subsequent template literals be identified as embedded Pegjs language. This option requires the `prettier-plugin-pegjs` plugin. |

Formatting embedded Pegjs language requires the [`prettier-plugin-pegjs`](https://github.com/siefkenj/prettier-plugin-pegjs) plugin to be loaded as well. And [options](https://github.com/siefkenj/prettier-plugin-pegjs?tab=readme-ov-file#options) supported by `prettier-plugin-pegjs` can therefore be used to further control the formatting behavior.

Note that `prettier-plugin-pegjs` supports different parsers for the action blocks and they are specified by the [`actionParser` option](https://github.com/siefkenj/prettier-plugin-pegjs?tab=readme-ov-file#options). If you want to specify different action parsers for different identifiers, check [`embeddedOverrides`](#embeddedoverrides).

#### PHP

|          Option          |    Type    |                      Default                       | Description                                                                                                                                                             |
| :----------------------: | :--------: | :------------------------------------------------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `embeddedPhpIdentifiers` | `string[]` | [`["php", "php5"]`](./src/embedded/php/options.ts) | Tag or comment identifiers that make their subsequent template literals be identified as embedded PHP language. This option requires the `@prettier/plugin-php` plugin. |

Formatting embedded PHP language requires the [`@prettier/plugin-php`](https://github.com/prettier/plugin-php) plugin to be loaded as well. And [options](https://github.com/prettier/plugin-php#configuration) supported by `@prettier/plugin-php` can therefore be used to further control the formatting behavior.

#### Prisma

|           Option            |    Type    |                     Default                      | Description                                                                                                                                                                  |
| :-------------------------: | :--------: | :----------------------------------------------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `embeddedPrismaIdentifiers` | `string[]` | [`["prisma"]`](./src/embedded/prisma/options.ts) | Tag or comment identifiers that make their subsequent template literals be identified as embedded Prisma language. This option requires the `prettier-plugin-prisma` plugin. |

Formatting embedded Prisma language requires the [`prettier-plugin-prisma`](https://github.com/avocadowastaken/prettier-plugin-prisma) plugin to be loaded as well.

#### Properties

|             Option              |    Type    |                         Default                          | Description                                                                                                                                                                          |
| :-----------------------------: | :--------: | :------------------------------------------------------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `embeddedPropertiesIdentifiers` | `string[]` | [`["properties"]`](./src/embedded/properties/options.ts) | Tag or comment identifiers that make their subsequent template literals be identified as embedded Properties language. This option requires the `prettier-plugin-properties` plugin. |

Formatting embedded Properties language requires the [`prettier-plugin-properties`](https://github.com/eemeli/prettier-plugin-properties) plugin to be loaded as well. And [options](https://github.com/eemeli/prettier-plugin-properties#configuration) supported by `prettier-plugin-properties` can therefore be used to further control the formatting behavior.

#### Ruby

|          Option           |                             Type                              |                   Default                    | Description                                                                                                                                                               |
| :-----------------------: | :-----------------------------------------------------------: | :------------------------------------------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `embeddedRubyIdentifiers` |                          `string[]`                           | [`["ruby"]`](./src/embedded/ruby/options.ts) | Tag or comment identifiers that make their subsequent template literals be identified as embedded Ruby language. This option requires the `@prettier/plugin-ruby` plugin. |
|   `embeddedRubyParser`    | [`"ruby" \| "rbs" \| "haml"`](./src/embedded/ruby/options.ts) |  [`"ruby"`](./src/embedded/ruby/options.ts)  | The parser used to parse the embedded Ruby language. This option requires the `@prettier/plugin-ruby` plugin.                                                             |

Formatting embedded Ruby language requires the [`@prettier/plugin-ruby`](https://github.com/prettier/plugin-ruby) to be loaded and [its dependencies to be installed](https://github.com/prettier/plugin-ruby#getting-started) as well. And [options](https://github.com/prettier/plugin-ruby#configuration) supported by `@prettier/plugin-ruby` can therefore be used to further control the formatting behavior.

If you want to specify different parsers for different identifiers, check [`embeddedOverrides`](#embeddedoverrides).

#### Sh (Shell)

|         Option          |    Type    |                 Default                  | Description                                                                                                                                                             |
| :---------------------: | :--------: | :--------------------------------------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `embeddedShIdentifiers` | `string[]` | [`["sh"]`](./src/embedded/sh/options.ts) | Tag or comment identifiers that make their subsequent template literals be identified as embedded Shell language. This option requires the `prettier-plugin-sh` plugin. |

Formatting embedded Shell language requires the [`prettier-plugin-sh`](https://github.com/un-ts/prettier/tree/master/packages/sh#readme) plugin to be loaded as well. And [options](https://github.com/un-ts/prettier/tree/master/packages/sh#parser-options) supported by `prettier-plugin-sh` can therefore be used to further control the formatting behavior.

Note that `prettier-plugin-sh` supports different variants of shell syntaxes and they are specified by the [`variant` option](https://github.com/un-ts/prettier/tree/master/packages/sh#parser-options). If you want to specify different variants for different identifiers, check [`embeddedOverrides`](#embeddedoverrides).

#### SQL

|          Option          |                                                Type                                                |                         Default                          | Description                                                                                                                                                                                                    |
| :----------------------: | :------------------------------------------------------------------------------------------------: | :------------------------------------------------------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `embeddedSqlIdentifiers` |                                             `string[]`                                             |        [`["sql"]`](./src/embedded/sql/options.ts)        | Tag or comment identifiers that make their subsequent template literals be identified as embedded SQL language. This option requires the `prettier-plugin-sql` plugin or the `prettier-plugin-sql-cst` plugin. |
|   `embeddedSqlPlugin`    |       [`"prettier-plugin-sql" \| "prettier-plugin-sql-cst"`](./src/embedded/sql/options.ts)        | [`"prettier-plugin-sql"`](./src/embedded/sql/options.ts) | The plugin used to format the embedded SQL language. This option requires the `prettier-plugin-sql` plugin or the `prettier-plugin-sql-cst` plugin.                                                            |
|   `embeddedSqlParser`    | [`"sqlite" \| "bigquery" \| "mysql" \| "mariadb" \| "postgresql"` ](./src/embedded/sql/options.ts) |       [`"sqlite"`](./src/embedded/sql/options.ts)        | Specify the embedded SQL language parser. This option is only needed with the `prettier-plugin-sql-cst` plugin.                                                                                                |

Formatting embedded SQL language requires the [`prettier-plugin-sql`](https://github.com/un-ts/prettier/tree/master/packages/sql#readme) plugin or the [`prettier-plugin-sql-cst`](https://github.com/nene/prettier-plugin-sql-cst) plugin to be loaded as well. And [options](https://github.com/un-ts/prettier/tree/master/packages/sql#parser-options) supported by `prettier-plugin-sql`, or [options](https://github.com/nene/prettier-plugin-sql-cst?tab=readme-ov-file#configuration) supported by `prettier-plugin-sql-cst` can therefore be used to further control the formatting behavior.

Note that `prettier-plugin-sql` supports many different SQL dialects which are specified by the [`language`, `database` or `dialect` option](https://github.com/un-ts/prettier/tree/master/packages/sql#parser-options). And `prettier-plugin-sql-cst` also supports various parsers as shown above. If you want to specify different dialects or parsers for different identifiers, check [`embeddedOverrides`](#embeddedoverrides).

#### TOML

|          Option           |    Type    |                   Default                    | Description                                                                                                                                                              |
| :-----------------------: | :--------: | :------------------------------------------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `embeddedTomlIdentifiers` | `string[]` | [`["toml"]`](./src/embedded/toml/options.ts) | Tag or comment identifiers that make their subsequent template literals be identified as embedded TOML language. This option requires the `prettier-plugin-toml` plugin. |

Formatting embedded TOML language requires the [`prettier-plugin-toml`](https://github.com/un-ts/prettier/tree/master/packages/toml#readme) plugin to be loaded as well. And options supported by `prettier-plugin-toml` can therefore be used to further control the formatting behavior.

#### TS (TypeScript)

|         Option          |                             Type                             |                                   Default                                   | Description                                                                                                            |
| :---------------------: | :----------------------------------------------------------: | :-------------------------------------------------------------------------: | ---------------------------------------------------------------------------------------------------------------------- |
| `embeddedTsIdentifiers` |                          `string[]`                          | [`["ts", "tsx", "cts", "mts", "typescript"]`](./src/embedded/ts/options.ts) | Tag or comment identifiers that make their subsequent template literals be identified as embedded TypeScript language. |
|   `embeddedTsParser`    | [`"typescript" \| "babel-ts"`](./src/embedded/ts/options.ts) |               [`"typescript"`](./src/embedded/ts/options.ts)                | The parser used to parse the embedded TypeScript language.                                                             |

Formatting embedded TypeScript language doesn't require other plugins and uses the parsers and printers provided by Prettier natively.

If you want to specify different parsers for different identifiers, check [`embeddedOverrides`](#embeddedoverrides).

#### XML

|          Option          |    Type    |                             Default                              | Description                                                                                                                                                             |
| :----------------------: | :--------: | :--------------------------------------------------------------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `embeddedXmlIdentifiers` | `string[]` | [`["xml", "opml", "rss", "svg"]`](./src/embedded/xml/options.ts) | Tag or comment identifiers that make their subsequent template literals be identified as embedded XML language. This option requires the `@prettier/plugin-xml` plugin. |

Formatting embedded XML language requires the [`@prettier/plugin-xml`](https://github.com/prettier/plugin-xml) plugin to be loaded as well. And [options](https://github.com/prettier/plugin-xml#configuration) supported by `@prettier/plugin-xml` can therefore be used to further control the formatting behavior.

#### YAML

|          Option           |    Type    |                       Default                       | Description                                                                                                      |
| :-----------------------: | :--------: | :-------------------------------------------------: | ---------------------------------------------------------------------------------------------------------------- |
| `embeddedYamlIdentifiers` | `string[]` | [`["yaml", "yml"]`](./src/embedded/yaml/options.ts) | Tag or comment identifiers that make their subsequent template literals be identified as embedded YAML language. |

Formatting embedded YAML language doesn't require other plugins and uses the parsers and printers provided by Prettier natively.

</details>

### Language-Agnostic Options

|                Option                 |    Type    |   Default   | Description                                                                                                                                                                                              |
| :-----------------------------------: | :--------: | :---------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|  `noEmbeddedIdentificationByComment`  | `string[]` |    `[]`     | Turns off `` /* identifier */ `...` `` comment-based embedded language identification for the specified identifiers.                                                                                     |
|    `noEmbeddedIdentificationByTag`    | `string[]` |    `[]`     | Turns off `` identifier`...` `` tag-based embedded language identification for the specified identifiers.                                                                                                |
| `preserveEmbeddedExteriorWhitespaces` | `string[]` |    `[]`     | Preserves leading and trailing whitespaces in the formatting results for the specified identifiers.                                                                                                      |
|   `noEmbeddedMultiLineIndentation`    | `string[]` |    `[]`     | Turns off auto indentation in the formatting results when they are formatted to span multi lines for the specified identifiers.                                                                          |
|          `embeddedOverrides`          |  `string`  | `undefined` | Option overrides for the specified identifiers. It should either be a stringified JSON or an absolute filepath to the option overrides file. See [below](#embeddedoverrides) for a detailed explanation. |

#### `embeddedOverrides`

This option is provided for users to override certain options based on identifiers. Due to the lack of support for using objects in prettier plugin options (https://github.com/prettier/prettier/issues/14671), it accepts a **stringified** json string, or a file path with an extension of `.json` or `.js` or `.cjs` or `.mjs` as its value. If no extension is provided, it will be treated as a `.json` file. For relative paths, it will automatically figure out the prettier config location and use that as the base path.

The resolved value should be an array of objects. Each object in the array must have 2 fields: `identifiers` and `options`. The `options` are considerred overrides that will be applied to the global `options` of prettier for those `idenfitiers` only. It's like the [`overrides`](https://prettier.io/docs/en/configuration.html#configuration-overrides) of `prettier`, but it is identifier-based instead of file-based.

In a json file, the root is the array of objects. In a JavaScript file, the array of objects should be a default export, or a named export with the name `embeddedOverrides`.

An example `.json` file is:

```json
[
  {
    "identifiers": ["sql"],
    "options": {
      "keywordCase": "lower"
    }
  },
  {
    "identifiers": ["mysql"],
    "options": {
      "keywordCase": "upper"
    }
  }
]
```

> [!CAUTION]
>
> Please note that not every option is supported to override. That largely depends on at which phase those options will kick in and take effect. For example, you can't override `tabWidth` in `embeddedOverrides` because this option is used in the [`printDocToString`](https://github.com/prettier/prettier/blob/7aecca5d6473d73f562ca3af874831315f8f2581/src/document/printer.js#L302) phase, where `prettier-plugin-embed` cannot override this option for only a set of specified identifiers. To find the list of unsupported options, please check the interface definition of `EmbeddedOverride` in the [source code](https://github.com/Sec-ant/prettier-plugin-embed/blob/main/src/types.ts).

## Contributing

Bug fixes, new language support and tests are welcome. Please have a look at the project structure before getting started. Feel free to leave questions or suggestions.

## License

MIT
