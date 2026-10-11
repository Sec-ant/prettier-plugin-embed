---
"prettier-plugin-embed": minor
---

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
