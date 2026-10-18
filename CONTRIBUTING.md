# Contributing

Use the Node.js version in `.node-version` for repository development and CI; the current language plugins require Node.js 26. Install the package manager version declared in `package.json`, then run `pnpm install`. The Ruby fixtures require Ruby and the `syntax_tree` gem, as configured in the test workflow.

## Development checks

- `pnpm format` applies source formatting, import organization, and documentation formatting.
- `pnpm check` checks formatting and lint rules.
- `pnpm type-check` checks TypeScript.
- `pnpm test:ci` runs unit tests and language fixtures with coverage.
- `pnpm test:consumer` builds and packs the plugin, then installs it in temporary consumer projects. It requires npm, Corepack, and Bun, and accesses package registries.

After building, run `node scripts/test-consumer.mjs --package-manager=pnpm@12` to focus on one package manager's profiles. The consumer suite copies executable fixtures from `tests/consumer/fixtures/` into installed consumer projects. It checks override edits within one process, consumer-preloaded hooks, and TypeScript loading with older and current tsx versions. Its pnpm 12 profile uses the package manager's runtime provisioning to check Node.js 18.19.

Biome owns JavaScript, TypeScript, and JSON formatting. Prettier handles documentation and other configuration formats. Fixture input files preserve the source text needed by their tests.

## Checking the latest language plugins

Run `pnpm update:plugins` to update Prettier, all installed language plugins (including scoped packages), and the browser formatting runtime to their latest stable releases, including new major versions. This explicitly opts into newly published releases for this invocation by setting pnpm's `minimumReleaseAge` to zero. It updates `package.json` and `pnpm-lock.yaml`; unrelated development tools and production dependencies keep their existing ranges.

The command then runs `pnpm test:plugins`: unit tests and language fixtures with coverage, the build and packed consumer suite, and the playground type check, production build, and worker smoke test. The Ruby, Corepack, npm, and Bun prerequisites above apply. Tests stop the command on the first failure and leave the dependency changes available for investigation. Snapshots are never updated automatically; review any output changes before accepting them.

Run `pnpm test:plugins` to repeat those checks without updating dependencies. Review `git diff -- package.json pnpm-lock.yaml` after an update. After building, `pnpm test:playground` exercises TOML formatting, options, idempotency, and errors in the emitted browser worker using Node's Web APIs. It does not cover browser UI behavior.

## Playground development

Run `pnpm playground:dev` to work on the browser playground. Before submitting changes, run `pnpm playground:build` to check its types and production bundle. Use `pnpm playground:preview` to inspect the built page. See the [playground guide](./playground/README.md) for the GitHub Pages base path, browser limitations, and deployment workflow.

The playground formats with the repository's plugin source. Its examples come from the language fixtures, and it records the package and formatter versions used by the build. Include a shared playground link or use **Copy issue report** when reporting formatting problems.

Playground-only code, documentation, and deployment changes do not require a changeset or an npm version bump. Changes to the published plugin's behavior or runtime compatibility require a changeset and can be reviewed separately from the website.

## Adding a language

Each integration lives in `src/embedded/<language>/`. Its `index.ts` exports the language identifier, options, embedder, and an optional custom parser. The registry discovers these exports during the build. Language and option names must be unique; the contract suite checks this invariant.

Declare language options as static objects. Use `createEmbedder` for the shared template formatting pipeline, configuring the parser, placeholder syntax, and whitespace behavior for the language. Each embedder is created once during plugin initialization.

Adapters with specialized parsing or document layout use the same pipeline utilities. `prepareTemplate` combines template fragments, inserts language-compatible placeholders, and extracts exterior whitespace. `printTemplateExpressions` prints JavaScript expressions, and `simpleRehydrateDoc` restores them while checking that each expression survives formatting. `wrapEmbeddedDoc` applies shared indentation and exterior whitespace options.

The consumer installs and loads the language's Prettier plugin. Add that plugin as a development dependency here for integration tests. Confirm its parser name, Prettier peer range, and any runtime requirements before selecting supported versions.

## Indentation contract

Normalize the exact space/tab prefix shared by all nonempty content lines before trimming template boundaries. A column-zero line makes that margin empty; preserve all remaining content indentation. Input normalization is independent of output options.

Use the shared pipeline to distinguish language layout from literal whitespace and to keep JavaScript interpolations in their host scope. `noEmbeddedMultiLineIndentation` aligns content to the current document root. `preserveEmbeddedExteriorWhitespaces` takes precedence and uses the original boundary margin. Keep grammar-specific whitespace rules in the relevant adapter.

Every formatter adapter needs a basic fixture so it participates in the shared configuration matrix. Cover tags, comments, tabs, both indentation options, and repeated formatting. Verify meaningful content or parsed values as well as idempotency; stable output alone does not establish correctness. Keep upstream reproductions and language-specific regressions in tests.

## Tests for an integration

Put source fixtures in `tests/fixtures/<language>/` and shared options in that directory's `options.json`. A fixture can specify additional options with a `// @prettier {"option": "value"}` comment. Name issue regressions `issue-<number>.js` or `.ts`.

The fixture suite checks formatted output, idempotency, and preservation of template expressions and their order with the actual language plugin. TypeScript fixture inputs are checked as formatting examples; the project's TypeScript check covers source code and executable tests. Put focused language behavior tests in `tests/embedded/<language>.spec.ts`, and shared behavior tests next to the existing printer and utility suites.

Cover plain template content, multiple interpolations, nested JavaScript expressions, comments, escaping, and relevant whitespace settings. Verify that each interpolation appears once in the correct position. Language grammars may accept placeholders in some positions but reject them in others, so use realistic examples from the intended use case.

Use packed consumer profiles for package resolution, version boundaries, and runtime differences. Review snapshot changes as formatting behavior changes. Coverage helps locate untested paths; semantic assertions establish what each integration supports.

`tests/plugin-compatibility.spec.ts` keeps a small selection of historical plugin versions at breaking-change boundaries or with substantial usage. Each case records its selection reason. Their `compat-*` development dependency aliases are pinned and excluded from `pnpm update:plugins`, so updating the latest versions preserves this coverage.

These cases reuse basic and interpolation fixtures to check formatting, idempotency, and expression preservation with the current Prettier. Known incompatible versions have explicit rejection assertions. They run within `pnpm test:ci`, reuse installed dependencies, and avoid repeating the package-manager matrix. Run `pnpm test:compat` for a focused check. The consumer suite separately covers selected older Prettier, XML, and SQL combinations. This is representative coverage of the tested combinations, not a guarantee for every historical version.

Document the default identifiers, required plugin, and any language-specific restrictions in the README language reference. Include a changeset for consumer-visible changes.

## Changeset style

Follow [xyflow's changeset style guide](https://github.com/xyflow/xyflow/blob/main/CONTRIBUTING.md#changeset-style-guide):

- Describe the effect on package users, starting with a concrete action in the present tense, such as `Fix`, `Preserve`, or `Support`.
- Keep sentences concise. Omit personal pronouns, redundant verbs, and commit-message prefixes such as `fix(scope):`.
- Use one changeset per independently meaningful user-facing change. Keep related details together; split unrelated changes or different release types.
- Start with a plain summary sentence: Changesets adds the outer changelog bullet and indents the remaining lines. Use paragraphs for details and at most one nested list when needed, with examples only when they clarify usage or migration.
- Format option and API names with backticks.
- Explain behavior changes and required migration steps. Keep implementation details, test reports, and development history out of release notes.
