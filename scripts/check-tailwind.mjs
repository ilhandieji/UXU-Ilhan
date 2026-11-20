#!/usr/bin/env node
// Component file rules:
//  1) Tailwind-only: no CSS files (unless the first line is `/* tailwind-exception: reason */`) and no <style> tags.
//  2) No subfolders: each version (react/ and vanilla/) holds only files, no src/ or other folders.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const EXCEPTION = /^\s*\/\*\s*tailwind-exception:\s*\S+/;
const IMPLS = ["react", "vanilla"];
const errors = [];

const dirsIn = (dir) =>
  existsSync(dir)
    ? readdirSync(dir)
        .map((n) => join(dir, n))
        .filter((p) => statSync(p).isDirectory())
    : [];

const implDirs = [...dirsIn(join(root, "components")), join(root, "templates", "component")]
  .flatMap((component) => IMPLS.map((impl) => join(component, impl)))
  .filter(existsSync);

for (const dir of implDirs) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const rel = relative(root, path);
    if (statSync(path).isDirectory()) {
      errors.push(`${rel}/: subfolders are not allowed (component files only)`);
      continue;
    }
    const text = readFileSync(path, "utf8");
    if (entry.endsWith(".css") && !EXCEPTION.test(text.split("\n")[0])) {
      errors.push(`${rel}: CSS files are not allowed (or start the file with /* tailwind-exception: reason */)`);
    }
    if (/\.(ts|tsx|js|jsx)$/.test(entry) && /<style[\s>]/.test(text)) {
      errors.push(`${rel}: <style> tags are not allowed`);
    }
  }
}

if (errors.length) {
  console.error("✖ Component rule violations:\n" + errors.map((e) => "  - " + e).join("\n"));
  process.exit(1);
}
console.log(`✔ ${implDirs.length} component folders checked (Tailwind-only, no subfolders).`);
