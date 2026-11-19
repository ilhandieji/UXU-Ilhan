---
paths:
  - "components/**"
  - "templates/**"
  - "playground/**"
---

# ساختار و استقلال کامپوننت‌ها

- هدف: **copy-paste** (مثل shadcn/ui). هر فایل کامپوننت باید بدون تغییر در پروژه‌ی دیگری (Next.js، Vite، HTML ساده) کپی و استفاده شود.
- ساختار: `components/<name>/{README.md, react/{<Name>.tsx, <name>.config.ts}, vanilla/{<name>.ts, <name>.config.ts}}`.
- **هر نسخه دقیقاً دو فایل، بدون زیرپوشه** (`src/` ممنوع)؛ بدون `package.json`/`tsconfig`/`vite.config`/`index.html`/playground در پوشه‌ی کامپوننت. فایل بالای ~۳۰۰ خط ⇒ یک فایل هم‌سطح.
- importهای داخلی نسبی و بدون پسوند (`./terminal.config`)؛ بدون alias (`@/...`) و بدون import از بیرون پوشه‌ی همان نسخه.
- کامپوننت جدید فقط با `pnpm new <kebab-name>`؛ تغییر ساختار همه = اصلاح `templates/component/`.
- کد ساده و خوانا؛ بدون `index.ts` واسط و انتزاع زودهنگام.
- **Vanilla:** TypeScript (`.ts`، بدون TSX و React). API: `createX(container, options)` ← `{ update(partial), destroy() }`. `destroy` همه‌ی listener/timer/DOM را پاک کند. ورودی کاربر هرگز با `innerHTML` درج نشود. `window/document` فقط داخل `createX`.
- **React:** TSX، `'use client'`، SSR-safe، Props تایپ‌شده و هم‌نام با Options Vanilla، `ref` برای API imperative، تغییر props بدون remount.
- **استقلال:** Vanilla از React و React از Vanilla import نمی‌کند؛ Wrapper ممنوع؛ هر نسخه `<name>.config.ts` خودش را دارد (کپی مستقل).
- **Parity:** نام Options، توکن‌ها و رفتار دو نسخه یکی است؛ تغییر در یکی = همان تغییر در دیگری (یا ثبت ناهمگونی در README).
- **Playground** (`playground/react`, `playground/vanilla`): فقط محیط آزمایش؛ دموها در `demos.ts[x]` (`pnpm new` خودکار ثبت می‌کند).
