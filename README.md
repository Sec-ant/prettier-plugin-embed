<div align="center">

![prettier-plugin-embed-light](./public/prettier-plugin-embed-wide-light.svg#gh-light-mode-only)
![prettier-plugin-embed-dark](./public/prettier-plugin-embed-wide-dark.svg#gh-dark-mode-only)

# Prettier Plugin Embed

A Configurable [Prettier](https://prettier.io/) [Plugin](https://prettier.io/docs/en/plugins.html) to Format [Embedded Languages](https://prettier.io/docs/en/options.html#embedded-language-formatting) in `js`/`ts` Files.

</div>

## Introduction

This Prettier plugin provides a configurable solution for formatting embedded code in the form of [template literals](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Template_literals) within JavaScript (`js`) and TypeScript (`ts`) files.

Although Prettier has introduced the [`embedded-language-formatting`](https://prettier.io/docs/en/options.html#embedded-language-formatting) option for formatting embedded languages, this option only supports two modes: `auto` and `off`. It doesn't allow for individual formatting adjustments for specific languages, nor does it support customizing the languages and tag names that require formatting. These limitations restrict the usability of this feature. For more detailed discussions, refer to: https://github.com/prettier/prettier/issues/4424 and https://github.com/prettier/prettier/issues/5588

By leveraging Prettier's plugin system, this plugin extends the formatting capabilities to handle template literals containing code from various languages (e.g., XML, SQL) and makes its behavior configurable.

## Features

- **Customizable Embedded Language Detection:** Detect embedded languages based on customizable tags or comments preceding the template literals.
- **Extended Formatting:** Utilizes Prettier's formatting capabilities alongside additional hooks to process embedded languages, ensuring a consistent and readable code style across different languages within the same file.
- **Easy Integration:** Seamlessly integrates with your existing Prettier setup, requiring minimal configuration to get started.

## Installation

Install the plugin via `npm`:

```bash
npm install --save-dev prettier-plugin-embed
```
