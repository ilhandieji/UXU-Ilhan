#!/usr/bin/env node
// قواعد فایل‌های کامپوننت:
//  ۱) Tailwind-only: فایل CSS (مگر با خط اول `/* tailwind-exception: دلیل */`) و تگ <style> ممنوع.
//  ۲) بدون زیرپوشه: هر نسخه (react/ و vanilla/) فقط فایل دارد، نه src/ یا پوشه‌ی دیگر.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const EXCEPTION = /^\s*\/\*\s*tailwind-exception:\s*\S+/;
const IMPLS = ['react', 'vanilla'];
const errors = [];

const dirsIn = (dir) => (existsSync(dir) ? readdirSync(dir).map((n) => join(dir, n)).filter((p) => statSync(p).isDirectory()) : []);

const implDirs = [...dirsIn(join(root, 'components')), join(root, 'templates', 'component')]
  .flatMap((component) => IMPLS.map((impl) => join(component, impl)))
  .filter(existsSync);

for (const dir of implDirs) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const rel = relative(root, path);
    if (statSync(path).isDirectory()) {
      errors.push(`${rel}/: زیرپوشه ممنوع است (فقط فایل‌های کامپوننت)`);
      continue;
    }
    const text = readFileSync(path, 'utf8');
    if (entry.endsWith('.css') && !EXCEPTION.test(text.split('\n')[0])) {
      errors.push(`${rel}: فایل CSS ممنوع است (یا خط اول /* tailwind-exception: دلیل */ بگذار)`);
    }
    if (/\.(ts|tsx|js|jsx)$/.test(entry) && /<style[\s>]/.test(text)) {
      errors.push(`${rel}: تگ <style> ممنوع است`);
    }
  }
}

if (errors.length) {
  console.error('✖ نقض قواعد کامپوننت:\n' + errors.map((e) => '  - ' + e).join('\n'));
  process.exit(1);
}
console.log(`✔ ${implDirs.length} پوشه‌ی کامپوننت بررسی شد (Tailwind-only، بدون زیرپوشه).`);
