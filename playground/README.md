# prettier-plugin-embed playground

[Open the playground](https://sec-ant.github.io/prettier-plugin-embed/).

A static playground built from the plugin source in this repository. It uses
CodeMirror 6 and Prettier standalone, with formatting in a module Web Worker.
Language plugins and their WASM assets are bundled locally and loaded on demand.
There is no formatting service or runtime npm CDN.

## Development

From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm playground:dev
```

To check types, build and preview the production assets:

```sh
pnpm playground:build
pnpm playground:preview
```

The output is `playground/dist`. For a project subdirectory, set the Vite base:

```sh
PLAYGROUND_BASE=/prettier-plugin-embed/ pnpm playground:build
```

## Using the playground

- Edit JS/TS on the left; the output preview updates after a short debounce.
  Format and the VS Code document-format shortcut refresh the output immediately,
  preserving the original input: Shift + Option + F on macOS, Shift + Alt + F on
  Windows, Ctrl + Shift + I on Linux. If the browser reserves a shortcut, use Format.
  Syntax coloring supports common tagged template languages.
- The .prettierrc JSONC editor uses real Prettier configuration, including the
  `plugins` array and `embedded*` options. Options controls edit the same configuration.
  Empty option fields use the formatter's defaults. Array options use JSON, for
  example `["sql", "db.query"]`. Press Enter or leave the field to apply an array.
  Leaving it blank restores the default; `[]` sets an empty list.
- Add language plugin package names to `plugins`, or select them in Options.
  Prettier's built-in parsers are always present.
  SQL offers both `prettier-plugin-sql` and `prettier-plugin-sql-cst`; configure
  `embeddedSqlPlugin` to choose the engine and `embeddedSqlParser` for a CST dialect.
- Compare adds a native Prettier view to the output pane. Copy output, a runnable
  Prettier configuration, or an issue report from the respective controls.
- Share stores source, JSONC, enabled plugins and comparison settings in a compressed
  URL fragment. Shared links take precedence over the local draft. Tool versions are
  recorded; a different build displays a version mismatch notice. Old formatter
  binaries are not fetched, so links do not promise identical results across releases.
- The browser accepts inline JSONC `embeddedOverrides` strings. Filesystem paths,
  JavaScript configuration modules and Composer PHP-version discovery require Node.
  The browser PHP formatter uses explicit version 8.5 by default.

## Reporting an issue

1. Paste the original JavaScript or TypeScript into Input and set the configuration
   needed to reproduce the problem, including the language plugin package names.
2. Enable Compare to check the native Prettier result alongside With embed.
3. Use **Copy issue report** to copy the input, configuration, output or error,
   formatter versions, and a link to the reproduction. Paste it into a GitHub issue.
   Use **Share** when only the reproduction link is needed.

Formatting preserves Input so the report can reproduce the problem. Shared links
open the recorded source and configuration without relying on the recipient's
saved draft. Examples that exceed the link-size limit can still be copied in an
issue report.

All source and configuration remain in the browser. Sharing copies them into the
link; anyone with that link can read the example. Browser storage can be disabled
without preventing formatting or link sharing.

## Versions and releases

Each build uses the plugin source from the checked-out repository revision. The
footer and issue reports read the embed version from the root `package.json`;
Prettier and language-plugin versions come from the dependencies installed for
that build. The deployed source can include changes made after the recorded
package release, so check the reproduction against the npm version when reporting
a package regression.

Playground-only changes do not require a changeset or an npm version bump. Their
deployment is handled by the Playground workflow. Changes to the published
plugin's behavior or runtime compatibility need their own changeset; the browser
compatibility and markup-indentation fixes were released in `0.7.3`.

## Browser compatibility

The registry is in `src/plugins.ts`; module imports are in `src/plugin-loaders.ts`.
Most of the repository's language integrations run in standalone, including Java,
Motoko, PHP, Shell, TOML, both SQL formatters and XML fragments. Browser-specific
build adapters in `browser-compat.ts` supply WASM URLs, isolate Go runtime shims,
replace configuration-file discovery, and adapt a lexer assertion. They retain the
installed language formatter implementations.

Language plugins that use native Node.js bindings need a compatible browser
formatting runtime. `pnpm update:plugins` updates the plugins and this runtime.

The installed Astro formatter uses a native compiler or a threaded WASI runtime
requiring cross-origin isolation. Ruby starts a host Ruby process. The installed
Prisma package reads its WASM using Node filesystem APIs. These integrations are
listed as unavailable on this static deployment.

Third-party parser/printer errors are surfaced instead of silently preserving the
input. In particular, the installed Go-template formatter currently throws for
its block example in Node as well as standalone; the playground exposes that
upstream error so it can be reproduced and reported.

## Deployment

`.github/workflows/playground.yml` builds pull requests and deploys `main` and
same-repository PR previews to GitHub Pages. PR previews live at
`pr-preview/pr-<number>/`, update on new commits, and are removed when the PR
closes. The deployment link appears in the PR's environment checks. Fork PRs
build and test the playground without publishing a preview.

The repository's Pages publishing source must be **GitHub Actions**. In the
`github-pages` environment's deployment branch rules, allow `refs/pull/*/merge`
and every supported PR target branch, including `main`. Merged PR cleanup runs
from the target branch rather than the PR merge ref, so that branch must also be
allowed to prevent stale previews. Merging to `main` or running the workflow on
`main` publishes the site. Forks use their own repository name for the base path.

The generated `playground-pages` branch stores the current production site and
active previews in one snapshot, without retaining build history. Deployment jobs
run serially and upload the complete snapshot so updating one preview preserves
production and other previews. Builds have read-only repository access; publishing
runs separately with artifact-read, contents-write and Pages deployment permissions.
Run the workflow on `main` once to initialize a new deployment. An existing Pages
artifact can also initialize the snapshot automatically.

The page is served directly from the repository's Pages URL. State is stored in
the URL fragment, so shared examples do not need additional routes or server
fallbacks. Changes to the plugin source, fixture examples, package versions, or
playground files rebuild the deployment on `main`. A package release therefore
refreshes the version information displayed by the playground.

## Architecture references

- [Prettier](https://github.com/prettier/prettier/tree/main/website/playground):
  standalone formatting in a Worker, option metadata, compressed URL state.
- [TypeScript](https://github.com/microsoft/TypeScript-Website/tree/v2/packages/sandbox):
  serializable configuration and shareable reproductions.
- [Biome](https://github.com/biomejs/website/tree/main/src/playground):
  editor/worker separation, formatter comparison and mixed-language highlighting.
- [Oxc](https://github.com/oxc-project/playground): configuration editing and explicit
  browser runtime setup. This playground does not require threaded WASM or COOP/COEP.
