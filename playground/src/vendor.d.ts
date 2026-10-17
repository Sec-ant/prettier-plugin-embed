declare const PLAYGROUND_DEPENDENCIES: Record<string, string>;

declare module "prettier-plugin-svelte/browser" {
  import type { Plugin } from "prettier";

  const plugin: Plugin;
  export default plugin;
}
declare module "prettier-plugin-ini" {
  import type { Plugin } from "prettier";

  const plugin: Plugin;
  export default plugin;
}
declare module "prettier-plugin-latex" {
  import type { Plugin } from "prettier";

  const plugin: Plugin;
  export default plugin;
}
declare module "prettier-plugin-properties" {
  import type { Plugin } from "prettier";

  const plugin: Plugin;
  export default plugin;
}
declare module "prettier-plugin-solidity/standalone" {
  import type { Plugin } from "prettier";

  const plugin: Plugin;
  export default plugin;
}
