---
paths:
  - "components/**"
  - "templates/**"
  - "src/registry/**"
---

# ساختار و استقلال کامپوننت‌ها

- هدف: **copy-paste** (مثل shadcn/ui). هر فایل کامپوننت باید بدون تغییر در پروژه‌ی دیگری (Next.js، Vite، HTML ساده) کپی و استفاده شود.
- ساختار: `components/<name>/{README.md, react/{<Name>.tsx, <name>.config.ts}, vanilla/{<name>.ts, <name>.config.ts}}`.
- **هر نسخه دقیقاً دو فایل، بدون زیرپوشه** (`src/` ممنوع)؛ بدون `package.json`/`tsconfig`/فایل‌های سایت در پوشه‌ی کامپوننت. فایل بالای ~۳۰۰ خط ⇒ یک فایل هم‌سطح.
- importهای داخلی نسبی و بدون پسوند (`./terminal.config`)؛ بدون alias (`@/...`) و بدون import از بیرون پوشه‌ی همان نسخه.
- کامپوننت جدید فقط با `pnpm new <kebab-name>`؛ تغییر ساختار همه = اصلاح `templates/component/`.
- کد ساده و خوانا؛ بدون `index.ts` واسط و انتزاع زودهنگام.
- **Vanilla:** TypeScript (`.ts`، بدون TSX و React). API: `createX(container, options)` ← `{ update(partial), destroy() }`. `destroy` همه‌ی listener/timer/DOM را پاک کند. ورودی کاربر هرگز با `innerHTML` درج نشود. `window/document` فقط داخل `createX`.
- **React:** TSX، `'use client'`، SSR-safe، Props تایپ‌شده و هم‌نام با Options Vanilla، `ref` برای API imperative، تغییر props بدون remount.
- **استقلال:** Vanilla از React و React از Vanilla import نمی‌کند؛ Wrapper ممنوع؛ هر نسخه `<name>.config.ts` خودش را دارد (کپی مستقل).
- **Parity:** نام Options، توکن‌ها و رفتار دو نسخه یکی است؛ تغییر در یکی = همان تغییر در دیگری (یا ثبت ناهمگونی در README).
- **سایت Playground** (`src/`، Next.js + shadcn، dark-only): فقط برای مرور/کاستوم/کپی. کامپوننت‌ها هرگز از `src/` یا shadcn import نمی‌کنند. هر کامپوننت یک ورودی در `src/registry/` دارد: `<name>.meta.ts` (server-safe) و `<name>.tsx` (کنترل‌ها، preview، `customize` که مقدارها را در `<name>.config.ts` patch می‌کند) — `pnpm new` می‌سازد؛ کنترل‌ها را متناسب با Options و توکن‌های کامپوننت کامل کن.
