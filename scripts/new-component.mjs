#!/usr/bin/env node
// استفاده: pnpm new <kebab-case-name>
// کپی templates/component به components/<name>، ساخت ورودی registry سایت (src/registry) و ثبت آن.
import {
  cpSync,
  existsSync,
  readdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const name = process.argv[2];

if (!name || !/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(name)) {
  console.error("نام نامعتبر. از kebab-case استفاده کن، مثل: pnpm new image-card");
  process.exit(1);
}

const target = join(root, "components", name);
if (existsSync(target)) {
  console.error(`components/${name} از قبل وجود دارد.`);
  process.exit(1);
}

const pascal = name
  .split("-")
  .map((p) => p[0].toUpperCase() + p.slice(1))
  .join("");
const camelName = pascal[0].toLowerCase() + pascal.slice(1);
const fill = (text) =>
  text.replaceAll("__name__Meta", `${camelName}Meta`).replaceAll("__name__: RegistryEntry", `${camelName}: RegistryEntry`).replaceAll("__name__", name).replaceAll("__Name__", pascal);

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      walk(path);
      continue;
    }
    writeFileSync(path, fill(readFileSync(path, "utf8")));
    if (entry !== fill(entry)) renameSync(path, join(dir, fill(entry)));
  }
}

/** افزودن یک خط بالای خط نشانه (با همان تورفتگی) */
function insertBefore(file, marker, line) {
  const path = join(root, file);
  const text = readFileSync(path, "utf8");
  const match = text.match(new RegExp(`^([ \\t]*)${marker}$`, "m"));
  if (!match) throw new Error(`نشانه‌ی ${marker} در ${file} پیدا نشد`);
  writeFileSync(path, text.replace(match[0], `${match[1]}${line}\n${match[0]}`));
}

cpSync(join(root, "templates", "component"), target, { recursive: true });
walk(target);

// Playground site entry: server-safe meta + client controls/preview
for (const file of ["__name__.meta.ts", "__name__.tsx"]) {
  const out = join(root, "src", "registry", fill(file));
  writeFileSync(out, fill(readFileSync(join(root, "templates", "registry", file), "utf8")));
}
insertBefore("src/registry/meta.ts", "// @new-meta-import", `import { ${camelName}Meta } from "./${name}.meta";`);
insertBefore("src/registry/meta.ts", "// @new-meta", `${camelName}Meta,`);
insertBefore("src/registry/index.ts", "// @new-import", `import { ${camelName} } from "./${name}";`);
insertBefore("src/registry/index.ts", "// @new-entry", `${camelName},`);

console.log(`✔ components/${name} ساخته شد و در سایت ثبت شد (src/registry/${name}.tsx).\n`);
console.log("اجرا:");
console.log(`  pnpm dev  → http://localhost:3000/components/${name}`);
