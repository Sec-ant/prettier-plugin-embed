---
"prettier-plugin-embed": minor
---

Format embedded Astro, Dockerfile, Gherkin, Go Template, Handlebars, Hugo, Jinja, JTE, Liquid, Marko, Motoko, Mustache, Nunjucks, PowerShell, Solidity, Svelte, and XQuery in JavaScript and TypeScript template literals.

Install and load the formatter plugin for each language used. For example, Liquid uses `@shopify/prettier-plugin-liquid`, and Dockerfile shares `prettier-plugin-sh` with Shell:

```js
export default {
  plugins: [
    "prettier-plugin-embed",
    "@shopify/prettier-plugin-liquid",
    "prettier-plugin-sh",
  ],
};
```

Identify templates with a tag or a preceding block comment, and customize identifiers through `embedded<Language>Tags` and `embedded<Language>Comments`:

```js
const greeting = liquid`<p>{{ user.name | escape }}</p>`;
const image = /* dockerfile */ `FROM node:24-alpine`;
```

Choose Solidity parsers with `embeddedSolidityParser` and XQuery parsers with `embeddedXQueryParser` to match the installed formatter version.
