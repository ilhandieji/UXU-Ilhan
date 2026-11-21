# ilhan-ui

کتابخانه‌ی شخصی کامپوننت‌های فرانت‌اند به سبک **copy-paste** (مثل shadcn/ui): هر کامپوننت در دو نسخه‌ی مستقل **React (TSX)** و **Vanilla (TypeScript)**، هر نسخه چند فایل کپی‌شدنی، استایل فقط Tailwind v4، و کاملاً قابل‌تنظیم (رنگ، فونت، اندازه، variant).

- معماری و قواعد: [AGENTS.md](AGENTS.md) · [CLAUDE.md](CLAUDE.md) · [docs/](docs/)
- کامپوننت‌ها: [Terminal](components/terminal/README.md) · [Glow Cursor](components/glow-cursor/README.md) · [Orbit Images](components/orbit-images/README.md)

## سایت Playground

سایت Next.js + shadcn/ui (فقط dark) برای مرور کامپوننت‌ها، Live Preview (React و Vanilla)، کاستوم کردن رنگ/فونت/قاب/متن و کپی همان حالت؛ `<name>.config.ts` با مقادیر انتخابی بازتولید می‌شود. تنظیمات در URL ذخیره می‌شوند (refresh و اشتراک لینک)، و ابزار **ASCII Editor** (`/ascii`) متن، تصویر و وب‌کم را به ASCII تبدیل می‌کند.

```bash
pnpm install
```

```bash
pnpm dev
```

سپس `http://localhost:3000`.

## استفاده در پروژه‌ی دیگر

فایل‌های نسخه‌ی موردنظر را از تب Code سایت (یا مستقیم از `components/<name>/react/` یا `components/<name>/vanilla/`) در یک پوشه کپی کن. نیازمندی‌ها در README هر کامپوننت.

## توسعه

```bash
pnpm new image-card
```

```bash
pnpm build
```
