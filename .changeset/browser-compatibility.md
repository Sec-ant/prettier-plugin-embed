---
"prettier-plugin-embed": patch
---

Allow the plugin to load with Prettier standalone in browsers by deferring Node-only configuration discovery and XML module resolution until needed. Keep filesystem-based overrides and XML resolution fallbacks available in Node.js.
