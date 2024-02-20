# prettier-plugin-embed

## 0.4.14

### Patch Changes

- 442be39: Fix language plugin check false positives.

  `throwIfPluginIsNotFound` is discarded. Detailed explanation can be found at https://github.com/Sec-ant/prettier-plugin-embed/issues/84#issuecomment-1953844934.

## 0.4.13

### Patch Changes

- b14447a: Fix a regression introduced in v0.4.11 caused by a wrong import specifier.

## 0.4.12

### Patch Changes

- 67d0726: Fix a regression of formatting template literals with only whitespaces:

  - Template literals with only whitespaces should be formatted to ` `` `.

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
