---
"prettier-plugin-embed": patch
---

Improve embedded formatting performance by caching complex tag candidate ASTs within each formatting context, scanning interpolation indentation in a single pass, and parsing inline overrides before attempting file resolution.
