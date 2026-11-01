---
"prettier-plugin-embed": patch
---

Add `embeddedSqlFormatFragments` to opt into formatting SQL fragments with `prettier-plugin-sql-cst`. The option defaults to `false`, preserving existing formatting behavior and avoiding fragment recovery attempts unless enabled.

Support conditions, column lists, SELECT modifiers, clauses, and joins. Preserve explicit trailing semicolons without adding new ones.
