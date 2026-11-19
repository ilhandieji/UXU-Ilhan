#!/usr/bin/env node
// استفاده: pnpm new <kebab-case-name>
// کپی templates/component به components/<name>، جایگزینی placeholderها و ثبت دمو در playground.
import { cpSync, existsSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const name = process.argv[2];

if (!name || !/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(name)) {
  console.error('نام نامعتبر. از kebab-case استفاده کن، مثل: pnpm new image-card');
  process.exit(1);
}

const target = join(root, 'components', name);
if (existsSync(target)) {
  console.error(`components/${name} از قبل وجود دارد.`);
  process.exit(1);
}

const pascal = name.split('-').map((p) => p[0].toUpperCase() + p.slice(1)).join('');
const fill = (text) => text.replaceAll('__name__', name).replaceAll('__Name__', pascal);

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      walk(path);
      continue;
    }
    writeFileSync(path, fill(readFileSync(path, 'utf8')));
    if (entry !== fill(entry)) renameSync(path, join(dir, fill(entry)));
  }
}

/** افزودن یک خط بالای خط نشانه (با همان تورفتگی) */
function insertBefore(file, marker, line) {
  const path = join(root, file);
  const text = readFileSync(path, 'utf8');
  const match = text.match(new RegExp(`^([ \\t]*)${marker}$`, 'm'));
  if (!match) throw new Error(`نشانه‌ی ${marker} در ${file} پیدا نشد`);
  writeFileSync(path, text.replace(match[0], `${match[1]}${line}\n${match[0]}`));
}

cpSync(join(root, 'templates', 'component'), target, { recursive: true });
walk(target);

const key = name.includes('-') ? `'${name}'` : name;
insertBefore('playground/vanilla/demos.ts', '// @new-import', `import { create${pascal} } from '../../components/${name}/vanilla/${name}';`);
insertBefore('playground/vanilla/demos.ts', '// @new-demo', `${key}: (el) => {\n    create${pascal}(el);\n  },`);
insertBefore('playground/react/demos.tsx', '// @new-import', `import { ${pascal} } from '../../components/${name}/react/${pascal}'`);
insertBefore('playground/react/demos.tsx', '// @new-demo', `${key}: () => <${pascal} />,`);

console.log(`✔ components/${name} ساخته شد و در playground ثبت شد.\n`);
console.log('اجرا:');
console.log(`  pnpm dev:react    → ?c=${name}`);
console.log(`  pnpm dev:vanilla  → ?c=${name}`);
