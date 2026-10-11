# prettier-plugin-embed

## 0.7.0

### Minor Changes

- 744c744: Format embedded Astro, Dockerfile, Gherkin, Go Template, Handlebars, Hugo, Jinja, JTE, Liquid, Marko, Motoko, Mustache, Nunjucks, PowerShell, Solidity, Svelte, and XQuery in JavaScript and TypeScript template literals.

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

## 0.6.0

### Minor Changes

- Support regular expression strings in `embedded<Language>Tags` for simple and member-expression tags. Apply per-tag `embeddedOverrides` to the configured pattern that matches.

  Match `query` and `db.query` with one pattern and apply `singleQuote` to their embedded JavaScript:

  ```js
  // prettier.config.mjs
  export default {
    plugins: ["prettier-plugin-embed"],
    embeddedEsTags: ["/query$/i"],
    embeddedOverrides: JSON.stringify([
      { tags: ["/query$/i"], options: { singleQuote: true } },
    ]),
  };
  ```

  Output comparison (`-`: `0.5.1`; `+`: this release):

  ```diff
  -const first = query`const message="hello"`;
  -const second = db.query`const message="hello"`;
  +const first = query`const message = 'hello';`;
  +const second = db.query`const message = 'hello';`;
  ```

- Fix line breaks and indentation around SQL interpolations, including nested templates and JavaScript comments. Preserve source line breaks before interpolations with `prettier-plugin-sql` and follow the formatted layout with `prettier-plugin-sql-cst`.

  With `prettier-plugin-sql`, preserve the input line break before `${condition}`:

  ```js
  const query = sql`
    SELECT * FROM users WHERE
      id = ${id}
      ${condition}
  `;
  ```

  Output comparison (`-`: `0.5.1`; `+`: this release):

  ```diff
   const query = sql`
     SELECT
       *
     FROM
       users
     WHERE
  -    id = ${id} ${condition}
  +    id = ${id}
  +    ${condition}
   `;
  ```

- Keep embedded XML documents and fragments compatible with the consumer's `@prettier/plugin-xml`, including plugin objects exported by shared configuration packages.
- Load JavaScript and TypeScript `embeddedOverrides` with the active Node.js or Bun runtime and consumer-enabled module hooks. Use a consumer-installed `tsx` when additional TypeScript loading or transformation support is needed.
- Reuse loaded `embeddedOverrides` within each formatting context and match each template's tag or comment independently. Reflect edits to override modules and their imported dependencies in subsequent calls, and report invalid modules with their original diagnostics.
- Resolve relative `embeddedOverrides` paths from the current Prettier configuration after `prettier.clearConfigCache()`.
- Reduce installed dependencies and keep the dependency tree compatible with Node.js 18.
- List supported languages with their default identifiers, and document tag patterns and JavaScript and TypeScript override configuration.

## 0.5.1

### Patch Changes

- 0c1b3c4: Fix indentation issues in sql, css and markdown embedded languages.
- 0c1b3c4: Fix embedded xml and prisma formatting behavior.

## 0.5.0

### Minor Changes

- 15dd288: feat: support shorthand for CallExpression as tag

## 0.4.15

### Patch Changes

- fbb5cae: Fix wrong options fallback behaviors:
  - Empty list of tags and comments shouldn't fallback to identifiers in options.

- 5cadbfa: Fix unstable embedded markdown indentation when using the `useTabs` option: https://github.com/Sec-ant/prettier-plugin-embed/pull/91#issuecomment-1963760555.
- d132038: Make embedded `css` formatting more align with the built-in behavior.

## 0.4.14

### Patch Changes

- 442be39: Fix language plugin check false positives.

  `throwIfPluginIsNotFound` is discarded. Detailed explanation can be found at https://github.com/Sec-ant/prettier-plugin-embed/issues/84#issuecomment-1953844934.

## 0.4.13

### Patch Changes

- b14447a: Fix a regression introduced in v0.4.11 caused by a wrong import specifier.

## 0.4.12

### Patch Changes

- 67d0726: Fix a regression of formatting template literals with only whitespaces:
  - Template literals with only whitespaces should be formatted to ` `` `.

## 0.4.11

### Patch Changes

- 3639712: Set up changesets
- f4a41e7: Deprecate `identifier`-named options.
  - Change options `embedded<Language>Identifiers` to `embedded<Language>Comments` and `embedded<Language>Tags`.
  - Remove option ~~`noEmbeddedIdentificationByComment`~~ because it is not needed anymore.
  - Remove option ~~`noEmbeddedIdentificationByTag`~~ because it is not needded anymore.
  - `embeddedOverrides` now takes the form:
    ```json
    {"comments": [...], "options": {...}}
    ```
    or
    ```json
    {"tags": [...], "options": {...}}
    ```
    or
    ```json
    {"comments": [...], "tags": [...], "options": {...}}
    ```
    The property `identifiers` is kept for compatibility and will serve as fallbacks.
  - If `comment`- or `tag`-named options are not present, the plugin will fallback to use `identifier`-named options.
  - README updated to reflect the above changes.
  - **NO** breaking changes.
