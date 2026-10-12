---
"prettier-plugin-embed": patch
---

Preserve template content silently when an embedded formatter cannot parse it, including SQL query fragments. Use Prettier's `PRETTIER_DEBUG` behavior to expose the original formatting error.
