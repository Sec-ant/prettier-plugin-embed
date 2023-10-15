<div align="center">

![prettier-plugin-embed-light](./public/prettier-plugin-embed-wide-light.svg#gh-light-mode-only)
![prettier-plugin-embed-dark](./public/prettier-plugin-embed-wide-dark.svg#gh-dark-mode-only)

# Prettier Plugin Embed

A Configurable [Prettier](https://prettier.io/) [Plugin](https://prettier.io/docs/en/plugins.html) to Format [Embedded Languages](https://prettier.io/docs/en/options.html#embedded-language-formatting) in `js`/`ts` Files.

```bash
npm i -D prettier-plugin-embed
```

</div>

## Introduction

### What?

This Prettier plugin (namely `prettier-plugin-embed`) provides a configurable solution for formatting embedded languages in the form of [template literals](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Template_literals) within JavaScript (`js`) or TypeScript (`ts`) files.

### Why?

Although Prettier has introduced the [`embedded-language-formatting`](https://prettier.io/docs/en/options.html#embedded-language-formatting) option for formatting embedded languages, it only supports two modes: `auto` and `off`. Therefore it doesn't allow for individual formatting adjustments for specific languages, nor does it support customizing the languages and tag names that require formatting. These limitations restrict the usability of this feature. For more detailed discussions, refer to: https://github.com/prettier/prettier/issues/4424 and https://github.com/prettier/prettier/issues/5588.

### How?

By leveraging Prettier's plugin system, this plugin overrides the default [`embed`](https://prettier.io/docs/en/plugins#optional-embed) function of the `estree` printer, so varieties of new languages can be hooked in through this function. Check [this file](./src/printers.ts) to get an idea of how this is accomplished.

## Features

- **Support for Additional Languages:** Extend the embedded language formatting capability to include languages such as XML, SQL, PHP, and more.

- **Dual Detection Modes:** Identify embedded languages by tags `` lang`...` `` or comments `` /* lang */ `...` `` preceding the template literals.

- **Customizable Language Tags/Comments:** Customize the language tags or comments used for identifying the embedded languages.

- **Formatting Opt-out Mechanism:** Offer the capability to deactivate formatting for certain embedded languages, including the default languages supported by the `embedded-language-formatting` option.

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

### An Overlook of the Philosophy

This plugin does not aim to implement parsers or printers to support every newly added embedded languages. Instead, ideally, it makes use of the existing [Prettier plugins](https://prettier.io/docs/en/plugins.html#official-plugins) for these languages and only adds formatting support when they are embedded.

Therefore, to support embedded language formatting for a specific language, the corresponding Prettier plugin to format that language will also have to be loaded at the same time. For example, when you want to format embedded XML code, apart from loading this plugin, you'll also need to load [`@prettier/plugin-xml`](https://github.com/prettier/plugin-xml). To find out which other plugin is needed when using this plugin, please refer to [Language-Specific Configuration](#language-specific-configuration) below.

TODO: Introduce template literals, tag function and comment.

This plugin comes preconfigured with a built-in set of tag and comment names for identifying various embedded languages. For example, using tags or comments like `xml` or `svg` will trigger automatic formatting of the embedded XML code, and you can specify an alternate list of identifiers in the `embeddedXML` option to alter this behavior. The naming convention for these options follows the pattern of `embedded{Language}` for other languages as well. Comprehensive details about these options and how to configure them can also be found in [Language-Specific Configuration](#language-specific-configuration).

To exclude certain languages from formatting, including the default ones supported by the `embedded-language-formatting` option, list them in the `embeddedNoop` option. Any matching language names in this option will take precedence over other `embedded{Language}` options, effectively disabling their formatting.

### Language-Specific Configuration

#### XML

|    Option     |                Default                 | Description                                                                                       |
| :-----------: | :------------------------------------: | ------------------------------------------------------------------------------------------------- |
| `embeddedXml` | [[...]](./src/embedded/xml/options.ts) | tag or comment identifiers that make their subsequent template literals be identified as XML code |

Formatting embedded XML code requires [`@prettier/plugin-xml`](https://github.com/prettier/plugin-xml) to be loaded as well. And [options](https://github.com/prettier/plugin-xml#configuration) supported by `@prettier/plugin-xml` can therefore be used to further control the formatting behavior.

#### SQL

|    Option     |                Default                 | Description                                                                                       |
| :-----------: | :------------------------------------: | ------------------------------------------------------------------------------------------------- |
| `embeddedSql` | [[...]](./src/embedded/sql/options.ts) | tag or comment identifiers that make their subsequent template literals be identified as SQL code |

TODO: Explain differernt flavors.

Formatting embedded SQL code requires [`prettier-plugin-sql`](https://github.com/un-ts/prettier/tree/master/packages/sql#readme) to be loaded as well. And [options](https://github.com/un-ts/prettier/tree/master/packages/sql#parser-options) supported by `prettier-plugin-sql` can therefore be used to further control the formatting behavior.

TODO: add other languages

### Language-Agnostic Configuration

TODO

## Contributing

TODO

## License

MIT
