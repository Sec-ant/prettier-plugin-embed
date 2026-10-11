---
"prettier-plugin-embed": minor
---

Add regular expression matching for simple and member-expression language tags, use the matching configured tag for per-tag overrides, and preserve source line breaks before SQL interpolations. Use the installed XML formatter's parser and native AST for documents and fragments, including shared configuration packages that export plugin objects. Consumers supply Prettier and language plugins explicitly.

Load JavaScript and TypeScript overrides through the runtime's module loader, including native Node.js/Bun TypeScript support and consumer-enabled hooks. Use the consumer's optional tsx installation for unsupported TypeScript loading or transformation, and report configuration errors with their original diagnostics.

Reflect edits to override modules and their dependencies in subsequent formatting calls, and follow Prettier's refreshed configuration discovery when resolving relative override paths.

Share loaded override data across templates using the same formatting options, with comment and tag matching applied to each template.

Align JavaScript interpolations with the formatted SQL indentation, including nested templates with comments. Use the SQL-CST formatter's document layout for interpolation line breaks.

Express option utility types with TypeScript's mapped and conditional types, keeping the consumer dependency tree compatible with Node.js 18 installations.
