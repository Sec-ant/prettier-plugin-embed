# prettier-plugin-embed

## 0.4.11

### Patch Changes

- 3639712: Set up changesets
- f4a41e7: Deprecate `identifier`-named options.

  - Change options `embedded<Language>Identifiers` to `embedded<Language>Comments` and `embedded<Language>Tags`.
  - Remove option ~~`noEmbeddedIdentificationByComment`~~ because it is not needed anymore.
  - Remove option ~~`noEmbeddedIdentificationByTag`~~ because it is not needded anymore.
  - `embeddedOverrides` now takes the form:
    ```json
    {"comments": [...], "options": {...}}
    ```
    or
    ```json
    {"tags": [...], "options": {...}}
    ```
    or
    ```json
    {"comments": [...], "tags": [...], "options": {...}}
    ```
    The property `identifiers` is kept for compatibility and will serve as fallbacks.
  - If `comment`- or `tag`-named options are not present, the plugin will fallback to use `identifier`-named options.
  - README updated to reflect the above changes.
  - **NO** breaking changes.
