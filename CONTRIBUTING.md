# Contributing

Install the package manager version declared in `package.json`, then run `pnpm install`. The Ruby fixtures require Ruby and the `syntax_tree` gem, as configured in the test workflow.

## Development checks

- `pnpm format` applies source formatting, import organization, and documentation formatting.
- `pnpm check` checks formatting and lint rules.
- `pnpm type-check` checks TypeScript.
- `pnpm test:ci` runs unit tests and language fixtures with coverage.
- `pnpm test:consumer` builds and packs the plugin, then installs it in temporary consumer projects. It requires npm, Corepack, and Bun, and accesses package registries.

After building, run `node scripts/test-consumer.mjs --package-manager=pnpm@12` to focus on one package manager's profiles. The consumer suite copies executable fixtures from `tests/consumer/fixtures/` into installed consumer projects. It checks override edits within one process, consumer-preloaded hooks, and TypeScript loading with older and current tsx versions. Its pnpm 12 profile uses the package manager's runtime provisioning to check Node.js 18.19.

Biome owns JavaScript, TypeScript, and JSON formatting. Prettier handles documentation and other configuration formats. Fixture input files preserve the source text needed by their tests.

## Adding a language

Each integration lives in `src/embedded/<language>/`. Its `index.ts` exports the language identifier, options, embedder, and an optional custom parser. The registry discovers these exports during the build. Language and option names must be unique; the contract suite checks this invariant.

Use `prepareTemplate` to combine template fragments, insert language-compatible placeholders, and extract exterior whitespace. Use `printTemplateExpressions` to print JavaScript expressions and `simpleRehydrateDoc` to restore them in the formatted language document. `wrapEmbeddedDoc` applies shared indentation and exterior whitespace options. Keep language-specific parsing, whitespace, and interpolation handling in the language adapter.

The consumer installs and loads the language's Prettier plugin. Add that plugin as a development dependency here for integration tests. Confirm its parser name, Prettier peer range, and any runtime requirements before selecting supported versions.

## Tests for an integration

Put source fixtures in `tests/fixtures/<language>/` and shared options in that directory's `options.json`. A fixture can specify additional options with a `// @prettier {"option": "value"}` comment. Name issue regressions `issue-<number>.js` or `.ts`.

The fixture suite checks formatted output and idempotency with the actual language plugin. Put focused language behavior tests in `tests/embedded/<language>.spec.ts`, and shared behavior tests next to the existing printer and utility suites.

Cover plain template content, multiple interpolations, nested JavaScript expressions, comments, escaping, and relevant whitespace settings. Verify that each interpolation appears once in the correct position. Language grammars may accept placeholders in some positions but reject them in others, so use realistic examples from the intended use case.

Use packed consumer profiles for package resolution, version boundaries, and runtime differences. Review snapshot changes as formatting behavior changes. Coverage helps locate untested paths; semantic assertions establish what each integration supports.

Document the default identifiers, required plugin, and any language-specific restrictions in the README language reference. Include a changeset for consumer-visible changes.

Describe the impact of changes on consumers. Keep release entries at one list level and place concise examples beneath the change they illustrate. Use active voice, present tense, and backticks for option and API names.
