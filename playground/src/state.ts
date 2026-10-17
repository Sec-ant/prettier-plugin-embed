import LZString from "lz-string";
import JSONC from "tiny-jsonc";
import { pluginIds } from "./plugins";
import type { PlaygroundState } from "./types";

export function parseConfig(text: string): Record<string, unknown> {
  const result: unknown = JSONC.parse(text);
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    throw new Error("Configuration must be a JSON object.");
  }
  return result as Record<string, unknown>;
}
export function encodeState(state: PlaygroundState): string {
  const text = JSON.stringify(state);
  if (text.length > 1_000_000)
    throw new Error(
      "This example is too large to share. Copy an issue report or reduce the input.",
    );
  const hash = `#v1=${LZString.compressToEncodedURIComponent(text)}`;
  if (hash.length > 100_000)
    throw new Error(
      "This example is too large to share. Copy an issue report or reduce the input.",
    );
  return hash;
}
export function decodeState(hash: string): PlaygroundState {
  if (!hash.startsWith("#v1=") || hash.length > 100_000) {
    throw new Error(
      "This playground link has an unsupported format or is too large.",
    );
  }
  const text = LZString.decompressFromEncodedURIComponent(hash.slice(4));
  if (!text || text.length > 1_000_000)
    throw new Error("This playground link could not be decoded.");
  const value = JSON.parse(text) as Partial<PlaygroundState>;
  if (
    value.v !== 1 ||
    typeof value.code !== "string" ||
    typeof value.config !== "string" ||
    typeof value.compare !== "boolean" ||
    !Array.isArray(value.plugins) ||
    !value.plugins.every((id) => pluginIds.includes(id))
  ) {
    throw new Error(
      "This playground link contains an unsupported configuration.",
    );
  }
  if (
    value.versions &&
    (typeof value.versions.embed !== "string" ||
      typeof value.versions.prettier !== "string")
  ) {
    throw new Error(
      "This playground link contains invalid version information.",
    );
  }
  if (
    value.versions?.plugins &&
    (typeof value.versions.plugins !== "object" ||
      Array.isArray(value.versions.plugins) ||
      !Object.values(value.versions.plugins).every(
        (version) => typeof version === "string",
      ))
  ) {
    throw new Error("This playground link contains invalid plugin versions.");
  }
  return value as PlaygroundState;
}
export function savedState(): PlaygroundState | undefined {
  let text: string | null;
  try {
    text = localStorage.getItem("embed-playground");
  } catch {
    return undefined;
  }
  return text ? decodeState(text) : undefined;
}
