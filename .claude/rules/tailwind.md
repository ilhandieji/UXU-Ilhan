---
paths:
  - "components/**"
  - "templates/**"
  - "playground/**"
---

# Tailwind-only

**استایل همه‌ی کامپوننت‌ها فقط با Tailwind CSS v4 نوشته می‌شود.** در React اجباری است؛ در Vanilla هم همان قانون (فقط وقتی Tailwind واقعاً نمی‌تواند، استثنا).

## قواعد
- کلاس‌های Tailwind داخل کامپوننت و `<name>.config.ts`؛ **فایل `.css` در پوشه‌ی کامپوننت ممنوع**، همچنین `<style>`، `@apply`، CSS-in-JS و استایل inline برای چیزی جز مقدار CSS Variable توکن‌ها.
- رشته‌ی کلاس‌ها **کامل و استاتیک** باشد (بدون الحاق مثل `` `bg-${c}-500` ``)، وگرنه scanner نمی‌بیند. نقشه‌های نام←کلاس را در `<name>.config.ts` نگه دار.
- مقدار Dynamic (رنگ/فونت/اندازه/radius/...) = CSS Variable `--ux-<name>-<token>` که از JS روی root ست می‌شود؛ مصرف با سینتکس v4 و type-hint صریح:
  `bg-(color:--ux-x-bg)` · `text-(color:--ux-x-fg)` · `border-(color:--ux-x-border)` · `font-(family-name:--ux-x-font-family)` · `text-(length:--ux-x-font-size)` · `p-(--ux-x-padding)` · `rounded-(--ux-x-radius)` · `[box-shadow:var(--ux-x-shadow)]`.
- انیمیشن/افکت: اول کلاس‌های Tailwind (`animate-*`, `transition-*`)، بعد `canvas`/Web Animations API.
- **استثنای CSS خام:** فقط اگر Tailwind نمی‌تواند (مثلاً `@keyframes` سفارشی): فایل `<name>.css` کنار کامپوننت با خط اول `/* tailwind-exception: <دلیل> */` و ثبت دلیل در README کامپوننت.
- تنها فایل CSS معمولی: `playground/*/index.css` (`@import "tailwindcss"; @source "../../components";`).
- پروژه‌ی مقصد Tailwind v4 دارد؛ اگر فایل کپی‌شده خارج از مسیرهای اسکن خودکار است، با `@source` اضافه شود.
- بررسی خودکار: `pnpm check:css` (در `pnpm build` هم اجرا می‌شود).
