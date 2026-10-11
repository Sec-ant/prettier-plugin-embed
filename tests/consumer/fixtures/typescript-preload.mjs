import { readFileSync } from "node:fs";
import { registerHooks, stripTypeScriptTypes } from "node:module";
registerHooks({
  load(url, context, nextLoad) {
    if (url.endsWith("/embedded-overrides.ts")) {
      return {
        format: "module",
        source: stripTypeScriptTypes(readFileSync(new URL(url), "utf8"), {
          mode: "strip",
        }),
        shortCircuit: true,
      };
    }
    return nextLoad(url, context);
  },
});
