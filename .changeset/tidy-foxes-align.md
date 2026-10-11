---
"prettier-plugin-embed": minor
---

Add regular expression matching for simple and member-expression language tags, use the matching configured tag for per-tag overrides, preserve source line breaks before SQL interpolations, retain XML CST data for compatibility with older XML plugins, and declare Prettier as a peer dependency. Load the XML parser from the consumer's installed XML plugin when XML formatting is used.

Load JavaScript and TypeScript overrides through the runtime's module loader, including native Node.js/Bun TypeScript support and consumer-enabled hooks. Use the consumer's optional tsx installation for unsupported TypeScript loading or transformation, and report configuration errors with their original diagnostics.

Reflect edits to override modules and their dependencies in subsequent formatting calls, and follow Prettier's refreshed configuration discovery when resolving relative override paths.
