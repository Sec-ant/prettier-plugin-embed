---
"prettier-plugin-embed": minor
---

- Support regular expression strings in `embedded<Language>Tags` for simple and member-expression tags. Apply per-tag `embeddedOverrides` to the configured pattern that matches.
- Fix line breaks and indentation around SQL interpolations, including nested templates and JavaScript comments. Preserve source line breaks before interpolations with `prettier-plugin-sql` and follow the formatted layout with `prettier-plugin-sql-cst`.
- Keep embedded XML documents and fragments compatible with the consumer's `@prettier/plugin-xml`, including plugin objects exported by shared configuration packages.
- Load JavaScript and TypeScript `embeddedOverrides` with the active Node.js or Bun runtime and consumer-enabled module hooks. Use a consumer-installed `tsx` when additional TypeScript loading or transformation support is needed.
- Reuse loaded `embeddedOverrides` within each formatting context and match each template's tag or comment independently. Reflect edits to override modules and their imported dependencies in subsequent calls, and report invalid modules with their original diagnostics.
- Resolve relative `embeddedOverrides` paths from the current Prettier configuration after `prettier.clearConfigCache()`.
- Reduce installed dependencies and keep the dependency tree compatible with Node.js 18.
- List supported languages with their default identifiers, and document tag patterns and JavaScript and TypeScript override configuration.
