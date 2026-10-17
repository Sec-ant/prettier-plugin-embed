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

## Playground development

Run `pnpm playground:dev` to work on the browser playground. Before submitting changes, run `pnpm playground:build` to check its types and production bundle. Use `pnpm playground:preview` to inspect the built page. See the [playground guide](./playground/README.md) for the GitHub Pages base path, browser limitations, and deployment workflow.

The playground formats with the repository's plugin source. Its examples come from the language fixtures, and it records the package and formatter versions used by the build. Include a shared playground link or use **Copy issue report** when reporting formatting problems.

Playground-only code, documentation, and deployment changes do not require a changeset or an npm version bump. Changes to the published plugin's behavior or runtime compatibility require a changeset and can be reviewed separately from the website.

## Adding a language

Each integration lives in `src/embedded/<language>/`. Its `index.ts` exports the language identifier, options, embedder, and an optional custom parser. The registry discovers these exports during the build. Language and option names must be unique; the contract suite checks this invariant.

Declare language options as static objects. Use `createEmbedder` for the shared template formatting pipeline, configuring the parser, placeholder syntax, newline handling, and exterior whitespace behavior for the language. Each embedder is created once during plugin initialization.

Adapters with specialized parsing or document layout use the same pipeline utilities. `prepareTemplate` combines template fragments, inserts language-compatible placeholders, and extracts exterior whitespace. `printTemplateExpressions` prints JavaScript expressions, and `simpleRehydrateDoc` restores them while checking that each expression survives formatting. `wrapEmbeddedDoc` applies shared indentation and exterior whitespace options.

The consumer installs and loads the language's Prettier plugin. Add that plugin as a development dependency here for integration tests. Confirm its parser name, Prettier peer range, and any runtime requirements before selecting supported versions.

## Tests for an integration

Put source fixtures in `tests/fixtures/<language>/` and shared options in that directory's `options.json`. A fixture can specify additional options with a `// @prettier {"option": "value"}` comment. Name issue regressions `issue-<number>.js` or `.ts`.

The fixture suite checks formatted output, idempotency, and preservation of template expressions and their order with the actual language plugin. TypeScript fixture inputs are checked as formatting examples; the project's TypeScript check covers source code and executable tests. Put focused language behavior tests in `tests/embedded/<language>.spec.ts`, and shared behavior tests next to the existing printer and utility suites.

Cover plain template content, multiple interpolations, nested JavaScript expressions, comments, escaping, and relevant whitespace settings. Verify that each interpolation appears once in the correct position. Language grammars may accept placeholders in some positions but reject them in others, so use realistic examples from the intended use case.

Use packed consumer profiles for package resolution, version boundaries, and runtime differences. Review snapshot changes as formatting behavior changes. Coverage helps locate untested paths; semantic assertions establish what each integration supports.

Document the default identifiers, required plugin, and any language-specific restrictions in the README language reference. Include a changeset for consumer-visible changes.

Describe the impact of changes on consumers. Keep release entries at one list level and place concise examples beneath the change they illustrate. Use active voice, present tense, and backticks for option and API names.
