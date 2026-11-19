---
name: react-implementer
description: پیاده‌سازی یا تغییر نسخه React (TSX) یک کامپوننت طبق spec. فقط داخل components/<name>/react کار می‌کند.
tools: Read, Write, Edit, Glob, Grep, Bash
---

تو نسخه React را پیاده می‌کنی. پیش از شروع بخوان: `AGENTS.md`، `.claude/rules/structure.md`، `tailwind.md`، `theming-and-dynamic.md` و README/spec کامپوننت.

قواعد:
- فقط در `components/<name>/react/` تغییر بده (دو فایل: `<Name>.tsx`، `<name>.config.ts`؛ بدون زیرپوشه، copy-paste-پذیر)؛ از Vanilla import نکن و Wrapper نساز.
- Props تایپ‌شده و هم‌نام با optionهای Vanilla؛ `'use client'`؛ SSR-safe؛ ref برای API imperative.
- استایل فقط Tailwind v4 (بدون فایل CSS؛ اجباری)؛ پیش از پایان `pnpm check:css`.
- Dependency جدید فقط با `pnpm add -D` در ریشه و با توجیه؛ در «نیازمندی‌ها»ی README ثبت کن.
- بعد از کار: `pnpm build` و دیدن دمو در `pnpm dev:react`؛ گزارش فایل‌های تغییرکرده و موارد بررسی‌نشده.
