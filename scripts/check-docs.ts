#!/usr/bin/env node
// Every component folder must be listed in the root README and in docs/ROADMAP.md,
// and must have its own README and site registry entry.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const read = (...parts: string[]): string => readFileSync(join(root, ...parts), "utf8");
const readme = read("README.md");
const roadmap = read("docs", "ROADMAP.md").toLowerCase();
const errors: string[] = [];

const names = readdirSync(join(root, "components")).filter((n) =>
  statSync(join(root, "components", n)).isDirectory(),
);

for (const name of names) {
  const title = name.replaceAll("-", " ");
  if (!existsSync(join(root, "components", name, "README.md")))
    errors.push(`components/${name}/README.md is missing`);
  if (!readme.includes(`(components/${name}/README.md)`))
    errors.push(`README.md: no link to components/${name}/README.md (component list)`);
  if (!roadmap.includes(title)) errors.push(`docs/ROADMAP.md: no entry for "${title}"`);
  if (!existsSync(join(root, "src", "registry", `${name}.meta.ts`)))
    errors.push(`src/registry/${name}.meta.ts is missing`);
}

if (errors.length) {
  console.error("✖ Docs check failed:\n" + errors.map((e) => "  - " + e).join("\n"));
  process.exit(1);
}
console.log(
  `✔ ${names.length} components are documented (README list, ROADMAP, own README, registry).`,
);
