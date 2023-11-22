<div align="center">

![prettier-plugin-embed-light](./asset/prettier-plugin-embed-wide-light.svg#gh-light-mode-only)
![prettier-plugin-embed-dark](./asset/prettier-plugin-embed-wide-dark.svg#gh-dark-mode-only)

# Prettier Plugin Embed

[![npm version](https://badgen.net/npm/v/prettier-plugin-embed?cache=300)](https://www.npmjs.com/package/prettier-plugin-embed/v/latest) [![npm downloads](https://badgen.net/npm/dm/prettier-plugin-embed?cache=300)](https://www.npmjs.com/package/prettier-plugin-embed/v/latest) [![npm license](https://badgen.net/npm/license/prettier-plugin-embed?cache=300)](https://www.npmjs.com/package/prettier-plugin-embed/v/latest)

[![github last commit](https://badgen.net/github/last-commit/Sec-ant/prettier-plugin-embed?cache=300)](https://github.com/Sec-ant/prettier-plugin-embed) [![bundlephobia minzipped](https://badgen.net/bundlephobia/minzip/prettier-plugin-embed?cache=300)](https://bundlephobia.com/package/prettier-plugin-embed@latest) [![](https://data.jsdelivr.com/v1/package/npm/prettier-plugin-embed/badge?style=rounded)](https://www.jsdelivr.com/package/npm/prettier-plugin-embed)

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

Peer dependecies are automatically installed by default if you're using npm v7 or higher versions. The peer dependencies of this plugin are mainly packages to support parsing and formatting for different languages. If you only plan to use this plugin for a very specific language and don't want to bloat your node modules folder, you can omit the peer dependencies by changing the installation command to either:

```bash
npm i -D --legacy-peer-deps prettier-plugin-embed
```

or:

```bash
npm i -D --omit=peer prettier-plugin-embed
```

For other package managers, refer to their documents on how to achieve the same result.

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

### An Overview of the Philosophy

To use this plugin, [`embedded-language-formatting`](https://prettier.io/docs/en/options.html#embedded-language-formatting) option must be set to `auto` (which is the default setting as of now), because this option serves as the main switch for activating embedded language formatting.

This plugin does not aim to implement parsers or printers to support every newly added embedded language. Instead, ideally, it makes use of existing [Prettier plugins](https://prettier.io/docs/en/plugins.html#official-plugins) for those languages and only adds formatting support when they are embedded in template literals.

Therefore, to enable formatting for a specific embedded language, the corresponding Prettier plugin for that language must also be loaded. For example, if you wish to format embedded XML code, you will need to load both this plugin and [`@prettier/plugin-xml`](https://github.com/prettier/plugin-xml). To find out which other plugins are required when using this plugin, please refer to the [Language-Specific Options](#language-specific-options) section below.

Embedded languages to be formatted are required to be enclosed in the template literals, and are identified by the preceding [tags](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates) `` identifier`...` `` or [block comments](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Lexical_grammar#block_comments) `` /* identifier */ `...` ``. This plugin comes pre-configured with a built-in set of identifiers for identifying various embedded languages. For instance, using identifiers like `xml` or `svg` will trigger automatic formatting for the embedded XML code. You can specify an alternative list of identifiers using the `embeddedXmlIdentifiers` option. The naming convention for these options follows the pattern of `embedded<Language>Identifiers` for other languages as well. Further details on these options and how to configure them are also available in the [Language-Specific Options](#language-specific-options) section.

To exclude certain identifiers from being identified, including the default ones supported by the [`embedded-language-formatting`](https://prettier.io/docs/en/options.html#embedded-language-formatting) option, add them to the list of the `embeddedNoopIdentifiers` option. Any matching identifiers listed in this option will take precedence over other `embedded<Language>Identifiers` options, effectively disabling their formatting.

### Language-Specific Options

<details>
<summary>
Click Here
</summary>

#### NOOP

|          Option           | Default | Description                                                                                                                                     |
| :-----------------------: | :-----: | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `embeddedNoopIdentifiers` |  `[]`   | Tag or comment identifiers that prevent their subsequent template literals from being identified as embedded languages and from being formatted |

This doesn't require other plugins and can override the native embedded language formatting. It serves as a way to turn off embedded language formatting for specific language identifiers.

#### CSS

|          Option          |                 Default                  | Description                                                                                       |
| :----------------------: | :--------------------------------------: | ------------------------------------------------------------------------------------------------- |
| `embeddedCssIdentifiers` | [`[...]`](./src/embedded/css/options.ts) | Tag or comment identifiers that make their subsequent template literals be identified as CSS code |

Formatting embedded CSS code doesn't require other plugins and uses the parsers and printers provided by Prettier natively. This can override the native embedded language formatting for CSS code.

#### ES

|         Option          |                  Default                  | Description                                                                                                           |
| :---------------------: | :---------------------------------------: | --------------------------------------------------------------------------------------------------------------------- |
| `embeddedEsIdentifiers` |  [`[...]`](./src/embedded/es/options.ts)  | Tag or comment identifiers that make their subsequent template literals be identified as ECMAScript (JavaScript) code |
|   `embeddedEsParser`    | [`"babel"`](./src/embedded/es/options.ts) | The parser used to parse the ECMASCript (JavaScript) code                                                             |

Formatting embedded ECMAScript code doesn't require other plugins and uses the parsers and printers provided by Prettier natively. This can override the native embedded language formatting for ECMAScript code.

#### HTML

|          Option           |                  Default                  | Description                                                                                        |
| :-----------------------: | :---------------------------------------: | -------------------------------------------------------------------------------------------------- |
| `embeddedHtmlIdentifiers` | [`[...]`](./src/embedded/html/options.ts) | Tag or comment identifiers that make their subsequent template literals be identified as HTML code |

Formatting embedded HTML code doesn't require other plugins and uses the parsers and printers provided by Prettier natively. This can override the native embedded language formatting for HTML code.

#### Markdown

|            Option             |                    Default                    | Description                                                                                            |
| :---------------------------: | :-------------------------------------------: | ------------------------------------------------------------------------------------------------------ |
| `embeddedMarkdownIdentifiers` | [`[...]`](./src/embedded/markdown/options.ts) | Tag or comment identifiers that make their subsequent template literals be identified as Markdown code |

Formatting embedded Markdown code doesn't require other plugins and uses the parsers and printers provided by Prettier natively. This can override the native embedded language formatting for Markdown code.

#### PHP

|          Option          |                 Default                  | Description                                                                                       |
| :----------------------: | :--------------------------------------: | ------------------------------------------------------------------------------------------------- |
| `embeddedPhpIdentifiers` | [`[...]`](./src/embedded/php/options.ts) | Tag or comment identifiers that make their subsequent template literals be identified as PHP code |

Formatting embedded PHP code requires [`@prettier/plugin-php`](https://github.com/prettier/plugin-php) to be loaded as well. And [options](https://github.com/prettier/plugin-php#configuration) supported by `@prettier/plugin-php` can therefore be used to further control the formatting behavior.

#### Ruby

|          Option           |                  Default                  | Description                                                                                        |
| :-----------------------: | :---------------------------------------: | -------------------------------------------------------------------------------------------------- |
| `embeddedRubyIdentifiers` | [`[...]`](./src/embedded/ruby/options.ts) | Tag or comment identifiers that make their subsequent template literals be identified as Ruby code |

Formatting embedded Ruby code requires [`@prettier/plugin-ruby`](https://github.com/prettier/plugin-ruby) to be loaded and [its dependencies to be installed](https://github.com/prettier/plugin-ruby#getting-started) as well. And [options](https://github.com/prettier/plugin-ruby#configuration) supported by `@prettier/plugin-php` can therefore be used to further control the formatting behavior.

#### SQL

|          Option          |                 Default                  | Description                                                                                       |
| :----------------------: | :--------------------------------------: | ------------------------------------------------------------------------------------------------- |
| `embeddedSqlIdentifiers` | [`[...]`](./src/embedded/sql/options.ts) | Tag or comment identifiers that make their subsequent template literals be identified as SQL code |

Formatting embedded SQL code requires [`prettier-plugin-sql`](https://github.com/un-ts/prettier/tree/master/packages/sql#readme) to be loaded as well. And [options](https://github.com/un-ts/prettier/tree/master/packages/sql#parser-options) supported by `prettier-plugin-sql` can therefore be used to further control the formatting behavior.

Note that `prettier-plugin-sql` supports many different SQL dialects, and there's a one-to-one correspondence between the dialects and the identifiers. To support custom identifiers for a specific dialect, put the identifiers after that specific dialect in the identifier list in option `embeddedSqlIdentifiers`, or use [`embeddedOverrides`](#embeddedoverrides).

#### TS

|         Option          |                    Default                     | Description                                                                                              |
| :---------------------: | :--------------------------------------------: | -------------------------------------------------------------------------------------------------------- |
| `embeddedTsIdentifiers` |    [`[...]`](./src/embedded/ts/options.ts)     | Tag or comment identifiers that make their subsequent template literals be identified as TypeScript code |
|   `embeddedTsParser`    | [`"typescript"`](./src/embedded/ts/options.ts) | The parser used to parse the TypeScript code                                                             |

Formatting embedded TypeScript code doesn't require other plugins and uses the parsers and printers provided by Prettier natively. This can override the native embedded language formatting for TypeScript code.

#### XML

|          Option          |                 Default                  | Description                                                                                       |
| :----------------------: | :--------------------------------------: | ------------------------------------------------------------------------------------------------- |
| `embeddedXmlIdentifiers` | [`[...]`](./src/embedded/xml/options.ts) | Tag or comment identifiers that make their subsequent template literals be identified as XML code |

Formatting embedded XML code requires [`@prettier/plugin-xml`](https://github.com/prettier/plugin-xml) to be loaded as well. And [options](https://github.com/prettier/plugin-xml#configuration) supported by `@prettier/plugin-xml` can therefore be used to further control the formatting behavior.

</details>

### Language-Agnostic Options

|                Option                 |   Default   | Description                                                                                                                                               |
| :-----------------------------------: | :---------: | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
|  `noEmbeddedIdentificationByComment`  |    `[]`     | Turns off `` /* identifier */ `...` `` comment-based language identification for the specified identifiers                                                |
|    `noEmbeddedIdentificationByTag`    |    `[]`     | Turns off `` identifier`...` `` tag-based language identification for the specified identifiers                                                           |
| `preserveEmbeddedExteriorWhitespaces` |    `[]`     | Preserves leading and trailing whitespaces in the formatting results for the specified identifiers                                                        |
|   `noEmbeddedMultiLineIndentation`    |    `[]`     | Turns off auto indentation in the formatting results when they are formatted to span multi lines for the specified identifiers                            |
|          `embeddedOverrides`          | `undefined` | Option overrides for the specified identifiers. This option accepts a string if not undefined. See [below](#embeddedoverrides) for a detailed explanation |

#### `embeddedOverrides`

This option is provided for users to override certain options based on identifiers. Due to the lack of support for using objects in prettier plugin options (https://github.com/prettier/prettier/issues/14671), it accepts a **stringified** json string, or a file path with an extension of `.json` or `.js` or `.cjs` or `.mjs` as its value. If no extension is provided, it will be treated as a `.json` file. For relative paths, it will automatically figure out the prettier config location and use that as the base path.

The resolved value should be an array of objects. Each object in the array must have 2 fields: `identifiers` and `options`. The `options` are considerred overrides that will be applied to the global `options` of prettier for those `idenfitiers` only. It's like the [`overrides`](https://prettier.io/docs/en/configuration.html#configuration-overrides) of `prettier`, but it is identifier-based instead of file-based.

In a json file, the root is the array of objects. In a javascript file, the array of objects should be a default export, or a named export with the name `embeddedOverrides`.

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

Please note that not every option is supported to override. That largely depends on at which phase those options will kick in and take effect. For example, you can't override `tabWidth` in `embeddedOverrides` because this option is used in the [`printDocToString`](https://github.com/prettier/prettier/blob/7aecca5d6473d73f562ca3af874831315f8f2581/src/document/printer.js#L302) phase, where `prettier-plugin-embed` cannot override this option for only a set of specified identifiers. To find the list of unsupported options, please check the interface definition of `EmbeddedOverride` in the [source code](https://github.com/Sec-ant/prettier-plugin-embed/blob/main/src/types.ts).

## Demos

TBD.

## Contributing

Bug fixes, new language support and tests are welcome. Please have a look at the project structure before getting started. Feel free to leave questions or suggestions.

## License

MIT
