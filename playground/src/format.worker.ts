/// <reference lib="webworker" />

import type { Options, Plugin } from "prettier";
import { version as prettierVersion } from "prettier/package.json";
import babel from "prettier/plugins/babel";
import estree from "prettier/plugins/estree";
import typescript from "prettier/plugins/typescript";
import * as prettier from "prettier/standalone";
import { version as embedVersion } from "../../package.json";
import * as embed from "../../src/index";
import { configuredPluginIds } from "./package-names";
import { pluginLoaders } from "./plugin-loaders";
import { languagePlugins, type PluginId } from "./plugins";
import { parseConfig } from "./state";
import type { FormatRequest, FormatResponse, OptionInfo } from "./types";

Object.assign(self, { prettier });
const versions = {
  embed: embedVersion,
  prettier: prettierVersion,
  plugins: PLAYGROUND_DEPENDENCIES,
};
const modules = new Map<PluginId, Promise<Plugin>>();
function loadPlugin(id: PluginId) {
  let pending = modules.get(id);
  if (!pending) {
    pending = pluginLoaders[id]()
      .then((module) => {
        const plugin = (
          "default" in module ? module.default : module
        ) as Plugin;
        if (!plugin.parsers)
          throw new Error(
            `${languagePlugins[id].label} did not export a Prettier plugin.`,
          );
        if (id === "php" && plugin.options?.phpVersion?.type === "choice") {
          return {
            ...plugin,
            options: {
              ...plugin.options,
              phpVersion: {
                ...plugin.options.phpVersion,
                default: "8.5",
                choices: plugin.options.phpVersion.choices.filter(
                  (choice) => choice.value !== "auto",
                ),
              },
            },
          };
        }
        return plugin;
      })
      .catch((error) => {
        modules.delete(id);
        throw new Error(
          `Could not load ${languagePlugins[id].label}. ${String(error)}`,
        );
      });
    modules.set(id, pending);
  }
  return pending;
}

let queue = Promise.resolve();
let latestId = 0;
self.addEventListener("message", (event: MessageEvent<FormatRequest>) => {
  latestId = event.data.id;
  queue = queue
    .then(async () => {
      if (event.data.id !== latestId) return;
      const response = await format(event.data);
      if (event.data.id === latestId) self.postMessage(response);
    })
    .catch((error) => {
      self.postMessage({
        id: event.data.id,
        error: String(error),
        warnings: [],
        versions,
      });
    });
});

async function format(request: FormatRequest): Promise<FormatResponse> {
  const response: FormatResponse = { id: request.id, warnings: [], versions };
  const originalWarn = console.warn;
  console.warn = (...args) =>
    response.warnings.push(args.map(String).join(" "));
  try {
    const config = parseConfig(request.config);
    const selected = configuredPluginIds(config.plugins, request.plugins);
    const { plugins: configuredPlugins, ...formatConfig } = config;
    const embedEnabled =
      !Array.isArray(configuredPlugins) ||
      configuredPlugins.includes("prettier-plugin-embed");
    if (config.embeddedOverrides !== undefined) {
      if (typeof config.embeddedOverrides !== "string")
        throw new Error(
          "embeddedOverrides must be a string containing a JSONC array.",
        );
      let overrides: unknown;
      try {
        overrides = (await import("tiny-jsonc")).default.parse(
          config.embeddedOverrides,
        );
      } catch {
        throw new Error(
          "Use an inline JSONC array for embeddedOverrides. Configuration files are only available in Node.js.",
        );
      }
      if (!Array.isArray(overrides))
        throw new Error(
          "Use an inline JSONC array for embeddedOverrides. Configuration files are only available in Node.js.",
        );
    }
    if (config.phpVersion === "auto")
      throw new Error(
        "Composer PHP version detection needs Node.js. Choose an explicit phpVersion in this playground.",
      );
    const loaded = await Promise.all(selected.map(loadPlugin));
    const hostParser =
      typeof config.parser === "string" ? config.parser : "typescript";
    const hostPlugins: Plugin[] = [];
    if (hostParser === "flow" || hostParser === "babel-flow")
      hostPlugins.push((await import("prettier/plugins/flow")).default);
    if (hostParser === "espree" || hostParser === "acorn")
      hostPlugins.push((await import("prettier/plugins/acorn")).default);
    if (hostParser === "meriyah")
      hostPlugins.push((await import("prettier/plugins/meriyah")).default);
    const basePlugins = [babel, typescript, estree, ...loaded, ...hostPlugins];
    const plugins = [...basePlugins, ...(embedEnabled ? [embed] : [])];
    const options = {
      filepath: "playground.ts",
      parser: "typescript",
      ...formatConfig,
      plugins,
    } as Options;
    const support = await (
      prettier.getSupportInfo as typeof import("prettier").getSupportInfo
    )({ plugins });
    response.options = JSON.parse(
      JSON.stringify(support.options),
    ) as OptionInfo[];
    // Like the official Prettier playground, surface embedded errors rather than
    // silently preserving unformatted content. This worker serializes requests.
    Object.assign(self, { PRETTIER_DEBUG: true });
    const start = performance.now();
    try {
      response.output = await prettier.format(request.code, options);
    } catch (error) {
      response.error =
        error instanceof Error ? (error.stack ?? error.message) : String(error);
    }
    response.duration = performance.now() - start;
    if (request.compare) {
      try {
        const baselineConfig = Object.fromEntries(
          Object.entries(formatConfig).filter(
            ([key]) => !(key in embed.options),
          ),
        );
        response.baseline = await prettier.format(request.code, {
          ...baselineConfig,
          parser: options.parser,
          plugins: basePlugins,
        });
      } catch (error) {
        response.baselineError =
          error instanceof Error ? error.message : String(error);
      }
    }
  } catch (error) {
    response.error =
      error instanceof Error ? (error.stack ?? error.message) : String(error);
  } finally {
    Object.assign(self, { PRETTIER_DEBUG: undefined });
    console.warn = originalWarn;
  }
  return response;
}
