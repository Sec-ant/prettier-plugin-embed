import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: { "package-manager": { type: "string" } },
});

const root = fileURLToPath(new URL("../", import.meta.url));
const temporaryDirectory = mkdtempSync(
  path.join(tmpdir(), "prettier-plugin-embed-consumer-"),
);

function run(command, args, cwd, env = {}) {
  execFileSync(command, args, {
    cwd,
    stdio: "inherit",
    env: { ...process.env, ...env },
  });
}

function runPackageManager(packageManager, args, cwd, env = {}) {
  if (packageManager.startsWith("pnpm@")) {
    run("corepack", [packageManager, ...args], cwd, env);
  } else if (packageManager.startsWith("yarn@")) {
    run("corepack", [packageManager, ...args], cwd, env);
  } else if (packageManager === "yarn") {
    run("corepack", ["yarn@1.22.22", ...args], cwd, {
      COREPACK_ENABLE_PROJECT_SPEC: "0",
      ...env,
    });
  } else if (packageManager === "bun") {
    run("bun", args, cwd, env);
  } else {
    run(packageManager, args, cwd, env);
  }
}

let activePackageManager = "npm";

function runPrettier(consumerDirectory, ...args) {
  const result = activePackageManager.startsWith("yarn@")
    ? spawnSync("corepack", [activePackageManager, "prettier", ...args], {
        cwd: consumerDirectory,
        encoding: "utf8",
      })
    : spawnSync(
        activePackageManager === "bun" ? "bun" : process.execPath,
        [
          path.join(
            consumerDirectory,
            "node_modules/prettier/bin/prettier.cjs",
          ),
          ...args,
        ],
        { cwd: consumerDirectory, encoding: "utf8" },
      );
  assert.equal(result.status, 0, result.stderr);
  const output = `${result.stdout}\n${result.stderr}`;
  assert.doesNotMatch(
    output,
    /TypeError: Cannot destructure property 'Name' of 'node\.children'/,
    "XML plugin embed errors must not be swallowed by Prettier",
  );
  return output;
}

function verifyConfig(consumerDirectory, configName, configContent) {
  for (const currentConfig of [
    ".prettierrc.json",
    ".prettierrc.yaml",
    ".prettierrc.cjs",
    "prettier.config.mjs",
  ]) {
    rmSync(path.join(consumerDirectory, currentConfig), { force: true });
  }
  writeFileSync(path.join(consumerDirectory, configName), configContent);
  runPrettier(consumerDirectory, "sample.js", "--write");
  runPrettier(consumerDirectory, "sample.js", "--check");
  runPrettier(consumerDirectory, "sample.ts", "--write");
  runPrettier(consumerDirectory, "sample.ts", "--check");
}

try {
  const packageDirectory = path.join(temporaryDirectory, "packed");
  mkdirSync(packageDirectory);
  run("pnpm", ["pack", "--pack-destination", packageDirectory], root);
  const tarballName = readdirSync(packageDirectory).find((file) =>
    file.endsWith(".tgz"),
  );
  assert.ok(tarballName, "pnpm pack did not produce a package tarball");
  const packageTarball = path.join(packageDirectory, tarballName);

  const compatibilityProfiles = [
    { prettier: "3.9.10", packageManager: "pnpm@10", xml: false },
    { prettier: "3.0.0", xml: "3.0.0" },
    { prettier: "3.0.0", xml: "3.0.0", packageManager: "yarn" },
    { prettier: "3.0.3", sql: "0.18.1" },
    {
      prettier: "3.6.0",
      extraPlugins: ["prettier-plugin-nginx", "prettier-plugin-sh"],
    },
    {
      prettier: "3.9.10",
      xml: "latest",
      packageManager: "pnpm@10",
      pnpmConfig: "node-linker=hoisted\n",
    },
    {
      prettier: "3.3.0",
      sql: "0.19.2",
      packageManager: "pnpm@11",
      pnpmConfig: "node-linker=isolated\n",
    },
    {
      prettier: "latest",
      xml: "latest",
      sql: "latest",
      packageManager: "pnpm@12",
      pnpmConfig: "node-linker=isolated\n",
    },
    {
      prettier: "latest",
      xml: "latest",
      sql: "latest",
      packageManager: "yarn@4",
      yarnConfig: "nodeLinker: node-modules\n",
    },
    {
      prettier: "latest",
      xml: false,
      packageManager: "yarn@4",
      yarnConfig: "nodeLinker: pnp\n",
      pnp: true,
    },
    {
      prettier: "latest",
      xml: "latest",
      packageManager: "yarn@4",
      yarnConfig: "nodeLinker: pnp\n",
      pnp: true,
    },
    {
      prettier: "latest",
      xml: "latest",
      sql: "latest",
      packageManager: "bun",
    },
    { prettier: "latest", sql: "latest" },
  ];

  const selectedProfiles = compatibilityProfiles.filter(
    ({ packageManager = "npm" }) =>
      !values["package-manager"] ||
      packageManager === values["package-manager"],
  );
  assert.ok(selectedProfiles.length, "No matching package manager profile");

  for (const [
    profileIndex,
    {
      prettier: prettierVersion,
      xml: xmlPluginVersion = "latest",
      sql: sqlPluginVersion,
      packageManager = "npm",
      pnpmConfig,
      yarnConfig,
      pnp,
      extraPlugins = [],
    },
  ] of selectedProfiles.entries()) {
    activePackageManager = packageManager;
    const consumerDirectory = path.join(
      temporaryDirectory,
      `consumer-${profileIndex}-${prettierVersion.replaceAll(/[^a-zA-Z0-9-]/g, "-")}-${packageManager}`,
    );
    const packageJson = {
      name: "prettier-plugin-embed-consumer-smoke-test",
      private: true,
      type: "module",
    };
    mkdirSync(consumerDirectory, { recursive: true });
    writeFileSync(
      path.join(consumerDirectory, "package.json"),
      JSON.stringify(packageJson, null, 2),
    );
    if (pnpmConfig) {
      writeFileSync(path.join(consumerDirectory, ".npmrc"), pnpmConfig);
    }
    if (yarnConfig) {
      writeFileSync(path.join(consumerDirectory, ".yarnrc.yml"), yarnConfig);
    }
    const consumerDependencies = [`prettier@${prettierVersion}`];
    if (xmlPluginVersion) {
      consumerDependencies.push(`@prettier/plugin-xml@${xmlPluginVersion}`);
    }
    if (sqlPluginVersion) {
      consumerDependencies.push(`prettier-plugin-sql@${sqlPluginVersion}`);
    }
    consumerDependencies.push(
      ...extraPlugins.map((plugin) => `${plugin}@latest`),
    );
    if (packageManager.startsWith("pnpm@")) {
      runPackageManager(
        packageManager,
        ["add", ...consumerDependencies, packageTarball],
        consumerDirectory,
      );
    } else if (packageManager.startsWith("yarn")) {
      runPackageManager(
        packageManager,
        ["add", ...consumerDependencies, packageTarball],
        consumerDirectory,
      );
    } else if (packageManager === "bun") {
      runPackageManager(
        packageManager,
        ["add", ...consumerDependencies, packageTarball],
        consumerDirectory,
      );
    } else {
      run(
        "npm",
        [
          "install",
          "--no-audit",
          "--no-fund",
          ...consumerDependencies,
          packageTarball,
        ],
        consumerDirectory,
      );
    }

    writeFileSync(
      path.join(consumerDirectory, "sample.js"),
      "const view = html`<div><p>Hello</p><span>World</span></div>`;\n",
    );
    writeFileSync(
      path.join(consumerDirectory, "sample.ts"),
      "const view: string = html`<div><p>Hello</p><span>World</span></div>`;\n",
    );
    writeFileSync(
      path.join(consumerDirectory, "sample.xml.js"),
      "const document = xml`<root><item>Text</item></root>`;\n",
    );
    writeFileSync(
      path.join(consumerDirectory, "sample.sql.js"),
      `function queryFor(myId, otherClause) {
  return ctx.prisma.$queryRaw\`
    SELECT *
    FROM users
    WHERE
      id = \${myId}
      \${otherClause}
  \`;
}
`,
    );
    if (extraPlugins.includes("prettier-plugin-nginx")) {
      writeFileSync(
        path.join(consumerDirectory, "sample.nginx.js"),
        "const config = nginx`server{listen 80;}`;\n",
      );
    }
    if (extraPlugins.includes("prettier-plugin-sh")) {
      writeFileSync(
        path.join(consumerDirectory, "sample.sh.js"),
        'const script = sh`for i in 1 2 3;do echo "$i";done`;\n',
      );
    }
    writeFileSync(
      path.join(consumerDirectory, "api-smoke.mjs"),
      `import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import prettier from "prettier";
${packageManager === "bun" ? "assert.ok(process.versions.bun, 'Bun profile uses the Bun runtime');" : ""}
${pnp ? `import * as prettierPluginEmbed from "prettier-plugin-embed";` : ""}
${pnp && xmlPluginVersion ? `import * as prettierPluginXml from "@prettier/plugin-xml";` : ""}

for (const [file, parser] of [["sample.js", "babel"], ["sample.ts", "typescript"]]) {
  const source = await readFile(file, "utf8");
  const formatted = await prettier.format(source, {
    parser,
    plugins: [${pnp ? "prettierPluginEmbed" : '"prettier-plugin-embed"'}],
  });
  assert.match(formatted, /<p>Hello<\\/p>/);
  assert.match(formatted, /<span>World<\\/span>/);
}
    ${
      xmlPluginVersion
        ? `const xmlSource = await readFile("sample.xml.js", "utf8");
const xmlFormatted = await prettier.format(xmlSource, {
  parser: "babel",
  plugins: [${pnp ? "prettierPluginEmbed, prettierPluginXml" : '"prettier-plugin-embed", "@prettier/plugin-xml"'}],
  embeddedXmlTags: ["xml"],
});
assert.match(xmlFormatted, /<item>Text<\\/item>/);
`
        : `import { createRequire } from "node:module";
assert.throws(() => createRequire(process.cwd() + "/package.json").resolve("@xml-tools/parser"));`
    }
console.log("API JS/TS smoke passed with Prettier " + prettier.version);
`,
    );

    const apiSmokeResult = packageManager.startsWith("yarn@")
      ? spawnSync("corepack", [packageManager, "node", "api-smoke.mjs"], {
          cwd: consumerDirectory,
          encoding: "utf8",
        })
      : spawnSync(
          packageManager === "bun" ? "bun" : process.execPath,
          ["api-smoke.mjs"],
          {
            cwd: consumerDirectory,
            encoding: "utf8",
          },
        );
    assert.equal(apiSmokeResult.status, 0, apiSmokeResult.stderr);
    const apiSmokeOutput = `${apiSmokeResult.stdout}\n${apiSmokeResult.stderr}`;
    assert.doesNotMatch(
      apiSmokeOutput,
      /TypeError: Cannot destructure property 'Name' of 'node\.children'/,
      "XML plugin embed errors must not be swallowed by Prettier",
    );
    process.stdout.write(apiSmokeResult.stdout);
    if (!pnp) {
      runPrettier(
        consumerDirectory,
        "sample.js",
        "--plugin=prettier-plugin-embed",
        "--write",
      );
      runPrettier(
        consumerDirectory,
        "sample.js",
        "--plugin=prettier-plugin-embed",
        "--check",
      );
    }
    if (xmlPluginVersion) {
      const xmlConfig = pnp
        ? `import * as prettierPluginEmbed from "prettier-plugin-embed";\nimport * as prettierPluginXml from "@prettier/plugin-xml";\nexport default { plugins: [prettierPluginEmbed, prettierPluginXml], embeddedXmlTags: ["xml"] };\n`
        : JSON.stringify({
            plugins: ["prettier-plugin-embed", "@prettier/plugin-xml"],
            embeddedXmlTags: ["xml"],
          });
      const xmlConfigFile = pnp ? "prettier.config.mjs" : ".prettierrc.json";
      writeFileSync(path.join(consumerDirectory, xmlConfigFile), xmlConfig);
      runPrettier(consumerDirectory, "sample.xml.js", "--write");
      runPrettier(consumerDirectory, "sample.xml.js", "--check");
      rmSync(path.join(consumerDirectory, xmlConfigFile), { force: true });
    }
    if (sqlPluginVersion) {
      const sqlConfig = pnp
        ? `import * as prettierPluginEmbed from "prettier-plugin-embed";\nimport * as prettierPluginSql from "prettier-plugin-sql";\nexport default { plugins: [prettierPluginEmbed, prettierPluginSql], embeddedSqlTags: ["/\\\\.\\\\$queryRaw$/"] };\n`
        : JSON.stringify({
            plugins: ["prettier-plugin-embed", "prettier-plugin-sql"],
            embeddedSqlTags: ["/\\.\\$queryRaw$/"],
          });
      const sqlConfigFile = pnp ? "prettier.config.mjs" : ".prettierrc.json";
      writeFileSync(path.join(consumerDirectory, sqlConfigFile), sqlConfig);
      runPrettier(consumerDirectory, "sample.sql.js", "--write");
      assert.match(
        readFileSync(path.join(consumerDirectory, "sample.sql.js"), "utf8"),
        /id = \$\{myId\}\s*\n\s+\$\{otherClause\}/,
        "SQL interpolation line breaks should follow the source template",
      );
      runPrettier(consumerDirectory, "sample.sql.js", "--check");
      rmSync(path.join(consumerDirectory, sqlConfigFile), { force: true });
    }
    if (extraPlugins.length > 0) {
      for (const plugin of extraPlugins) {
        const language = plugin === "prettier-plugin-nginx" ? "nginx" : "sh";
        const sampleFile = `sample.${language}.js`;
        const original = readFileSync(
          path.join(consumerDirectory, sampleFile),
          "utf8",
        );
        runPrettier(
          consumerDirectory,
          sampleFile,
          "--plugin=prettier-plugin-embed",
          `--plugin=${plugin}`,
          "--write",
        );
        const formatted = readFileSync(
          path.join(consumerDirectory, sampleFile),
          "utf8",
        );
        assert.notEqual(
          formatted,
          original,
          `${language} content was formatted`,
        );
        runPrettier(
          consumerDirectory,
          sampleFile,
          "--plugin=prettier-plugin-embed",
          `--plugin=${plugin}`,
          "--check",
        );
      }
    }

    if (pnp) {
      verifyConfig(
        consumerDirectory,
        "prettier.config.mjs",
        `import * as prettierPluginEmbed from "prettier-plugin-embed";\n${xmlPluginVersion ? 'import * as prettierPluginXml from "@prettier/plugin-xml";\n' : ""}export default { plugins: [prettierPluginEmbed${xmlPluginVersion ? ", prettierPluginXml" : ""}] };\n`,
      );
    } else {
      verifyConfig(
        consumerDirectory,
        ".prettierrc.json",
        '{"plugins":["prettier-plugin-embed"]}\n',
      );
      verifyConfig(
        consumerDirectory,
        ".prettierrc.yaml",
        "plugins:\n  - prettier-plugin-embed\n",
      );
      verifyConfig(
        consumerDirectory,
        ".prettierrc.cjs",
        'module.exports = { plugins: ["prettier-plugin-embed"] };\n',
      );
      verifyConfig(
        consumerDirectory,
        "prettier.config.mjs",
        'export default { plugins: ["prettier-plugin-embed"] };\n',
      );
    }

    if (prettierVersion === "latest" && !pnp) {
      writeFileSync(
        path.join(consumerDirectory, "types.ts"),
        `import type { PluginEmbedOptions } from "prettier-plugin-embed";
const options: PluginEmbedOptions = { embeddedHtmlTags: ["html"] };
void options;
`,
      );
      if (packageManager.startsWith("pnpm@")) {
        runPackageManager(
          packageManager,
          ["add", "typescript@latest"],
          consumerDirectory,
        );
      } else if (packageManager.startsWith("yarn")) {
        runPackageManager(
          packageManager,
          ["add", "typescript@latest"],
          consumerDirectory,
        );
      } else if (packageManager === "bun") {
        runPackageManager(
          packageManager,
          ["add", "typescript@latest"],
          consumerDirectory,
        );
      } else {
        run(
          "npm",
          ["install", "--no-audit", "--no-fund", "typescript@latest"],
          consumerDirectory,
        );
      }
      writeFileSync(
        path.join(consumerDirectory, "embedded-overrides.ts"),
        `const keywordCase: "upper" = "upper";\nexport default [{ tags: ["sql"], options: { keywordCase } }];\n`,
      );
      const overrideConfig = {
        plugins: ["prettier-plugin-embed", "prettier-plugin-sql"],
        embeddedSqlTags: ["sql"],
        embeddedOverrides: "./embedded-overrides.ts",
        keywordCase: "lower",
      };
      writeFileSync(
        path.join(consumerDirectory, ".prettierrc.json"),
        JSON.stringify(overrideConfig),
      );
      writeFileSync(
        path.join(consumerDirectory, "sample.sql.js"),
        "const query = sql`select * from users where id = 1`;\n",
      );
      const overrideOutput = runPrettier(
        consumerDirectory,
        "sample.sql.js",
        "--write",
      );
      assert.match(
        readFileSync(path.join(consumerDirectory, "sample.sql.js"), "utf8"),
        /\bSELECT\b/,
        `TypeScript embeddedOverrides should apply the SQL keyword case\n${overrideOutput}`,
      );
      copyFileSync(
        path.join(root, "tests/consumer/fixtures/override-reload.mjs"),
        path.join(consumerDirectory, "api-overrides.mjs"),
      );
      run(
        packageManager === "bun" ? "bun" : process.execPath,
        ["api-overrides.mjs"],
        consumerDirectory,
      );
      if (packageManager === "pnpm@12") {
        copyFileSync(
          path.join(root, "tests/consumer/fixtures/typescript-preload.mjs"),
          path.join(consumerDirectory, "override-loader.mjs"),
        );
        writeFileSync(
          path.join(consumerDirectory, "sample.sql.js"),
          "const query = sql`select * from users where id = 1`;\n",
        );
        run(
          process.execPath,
          [
            "--no-experimental-strip-types",
            "--import",
            "./override-loader.mjs",
            "node_modules/prettier/bin/prettier.cjs",
            "sample.sql.js",
            "--write",
          ],
          consumerDirectory,
        );
        assert.match(
          readFileSync(path.join(consumerDirectory, "sample.sql.js"), "utf8"),
          /\bSELECT\b/,
          "Consumer-preloaded hooks load TypeScript overrides in workers",
        );
        writeFileSync(
          path.join(consumerDirectory, "pnpm-workspace.yaml"),
          "allowBuilds:\n  esbuild: true\n",
        );
        copyFileSync(
          path.join(root, "tests/consumer/fixtures/typescript-overrides.mjs"),
          path.join(consumerDirectory, "api-typescript.mjs"),
        );
        for (const tsxVersion of ["4.19.0", "latest"]) {
          runPackageManager(
            packageManager,
            ["add", `tsx@${tsxVersion}`],
            consumerDirectory,
          );
          for (const fixture of ["api-typescript.mjs", "api-overrides.mjs"]) {
            for (const runtimeArgs of [[], ["--no-experimental-strip-types"]]) {
              run(
                process.execPath,
                [...runtimeArgs, fixture, "--transform"],
                consumerDirectory,
              );
            }
            runPackageManager(
              packageManager,
              ["dlx", "node@18.19.0", fixture, "--transform"],
              consumerDirectory,
              {
                PNPM_CONFIG_TOOLS: JSON.stringify({
                  node: { mirror: "https://nodejs.org/download/" },
                }),
              },
            );
          }
        }
      }
      const typecheckArgs = [
        "--noEmit",
        "--skipLibCheck",
        "--module",
        "nodenext",
        "--moduleResolution",
        "nodenext",
        "--target",
        "es2022",
        "types.ts",
        "embedded-overrides.ts",
      ];
      if (packageManager.startsWith("pnpm@")) {
        runPackageManager(
          packageManager,
          ["exec", "tsc", ...typecheckArgs],
          consumerDirectory,
        );
      } else if (packageManager.startsWith("yarn")) {
        runPackageManager(
          packageManager,
          ["tsc", ...typecheckArgs],
          consumerDirectory,
        );
      } else {
        run(
          process.execPath,
          ["node_modules/typescript/bin/tsc", ...typecheckArgs],
          consumerDirectory,
        );
      }
    }
    console.log(
      `Packed consumer smoke passed with Prettier ${prettierVersion}` +
        (sqlPluginVersion
          ? ` and prettier-plugin-sql ${sqlPluginVersion}`
          : "") +
        (extraPlugins.length > 0 ? ` and ${extraPlugins.join(" and ")}` : "") +
        ` using ${packageManager}`,
    );
  }
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
