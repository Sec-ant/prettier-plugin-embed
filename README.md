<div align="center">

![prettier-plugin-embed-light](./public/prettier-plugin-embed-wide-light.svg#gh-light-mode-only)
![prettier-plugin-embed-dark](./public/prettier-plugin-embed-wide-dark.svg#gh-dark-mode-only)

# Prettier Plugin Embed

A Configurable [Prettier](https://prettier.io/) [Plugin](https://prettier.io/docs/en/plugins.html) to Format [Embedded Languages](https://prettier.io/docs/en/options.html#embedded-language-formatting) in `js`/`ts` Files.

</div>

## Introduction

This Prettier plugin (namely `prettier-plugin-embed`) provides a configurable solution for formatting embedded languages in the form of [template literals](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Template_literals) within JavaScript (`js`) and TypeScript (`ts`) files.

Although Prettier has introduced the [`embedded-language-formatting`](https://prettier.io/docs/en/options.html#embedded-language-formatting) option for formatting embedded languages, this option only supports two modes: `auto` and `off`. It doesn't allow for individual formatting adjustments for specific languages, nor does it support customizing the languages and tag names that require formatting. These limitations restrict the usability of this feature. For more detailed discussions, refer to: https://github.com/prettier/prettier/issues/4424 and https://github.com/prettier/prettier/issues/5588

By leveraging Prettier's plugin system, this plugin extends the formatting capabilities to handle template literals containing code from various languages (e.g., XML, SQL) and makes its behavior configurable.

## Features

- **Support for Additional Languages:**

  Extend the embedded language formatting capability to include languages such as XML, SQL, PHP, and more.

- **Dual Detection Modes:**

  Identify embedded languages by tags `` lang`...` `` or comments `` /* lang */ `...` `` preceding the template literals.

- **Customizable Language Tags/Comments:**

  Customize the language tags or comments used for identifying the embedded languages.

- **Formatting Opt-out Mechanism:**

  Offer the capability to deactivate formatting for certain embedded languages, including the default languages supported by the `embedded-language-formatting` option.

- **Configurable Formatting Style:**

  Provide additional options to tailor the formatting style for embedded languages.

- **Strongly Typed API:**

  Benefit from comprehensive type support for configuring this plugin's options when employing the [Prettier API](https://prettier.io/docs/en/api) in TypeScript.

- **Easy Integration:**

  Integrate with the existing Prettier setup seamlessly, requiring minimal configuration to get started.

## Installation

```bash
npm i -D prettier-plugin-embed
```

## Usage

This is a Prettier plugin, which follows the [standard usage pattern](https://prettier.io/docs/en/plugins.html#using-plugins) of many other Prettier plugins:

### CLI

Via `--plugin`:

```bash
prettier --write main.ts --plugin=prettier-plugin-embed
```

### API

Via the `plugins` options:

```ts
await prettier.format(code, {
  filepath: "main.ts",
  plugins: ["prettier-plugin-embed"],
});
```

### Configuration File

```json
{
  "plugins": ["prettier-plugin-embed"]
}
```
