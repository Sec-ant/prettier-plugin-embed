import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const { devDependencies } = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);
const packages = Object.keys(devDependencies).filter(
  (name) =>
    name === "prettier" ||
    /^(?:@[^/]+\/)?prettier-plugin-/.test(name) ||
    name.startsWith("@prettier/plugin-") ||
    name === "@tombi-toml/wasm-lib",
);

for (const args of [
  ["update", "--latest", "--dev", ...packages],
  ["run", "test:plugins"],
]) {
  const result = spawnSync("pnpm", args, {
    cwd: root,
    stdio: "inherit",
    // Opt into fresh releases for the update and all nested checks.
    env: { ...process.env, PNPM_CONFIG_MINIMUM_RELEASE_AGE: "0" },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
