# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users and purpose

Developers evaluating prettier-plugin-embed and preparing reproducible formatting issues.
The playground edits JS/TS source and real Prettier/plugin options, previews formatting,
and shares the complete example through a URL.

## Stack

Vite, TypeScript, CodeMirror 6, and Prettier standalone in a Web Worker. The
architecture follows the editor, worker, configuration, and sharing patterns of
the Prettier, TypeScript, Biome, and Oxc playgrounds.

## Constraints

Deploy static assets with GitHub Pages. Use the repository's plugin source and
installed dependency versions. Load browser-compatible language plugins on demand.
Keep Node configuration loading available to package consumers; browser overrides
are inline JSONC. Shared links must identify their state schema and tool versions.

## Brand commitments

Keep the interface simple: options beside editable input and read-only output.
Format and VS Code shortcuts refresh output without replacing the reproduction
input. Compare adds a native Prettier output view. Use keyboard-accessible controls
and light/dark themes. Functionality and clear error feedback lead the interface.
