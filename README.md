# ilhan-ui

کتابخانه‌ی شخصی کامپوننت‌های فرانت‌اند به سبک **copy-paste** (مثل shadcn/ui): هر کامپوننت در دو نسخه‌ی مستقل **React (TSX)** و **Vanilla (TypeScript)**، هر نسخه فقط دو فایل، استایل فقط Tailwind v4، و کاملاً قابل‌تنظیم (رنگ، فونت، اندازه، variant).

- معماری و قواعد: [AGENTS.md](AGENTS.md) · [CLAUDE.md](CLAUDE.md) · [docs/](docs/)
- کامپوننت‌ها: [Terminal](components/terminal/README.md)

## استفاده در پروژه‌ی دیگر

دو فایل نسخه‌ی موردنظر را از `components/<name>/react/` یا `components/<name>/vanilla/` کپی کن. نیازمندی‌ها در README هر کامپوننت.

## توسعه

```bash
pnpm install
```

```bash
pnpm dev:react
```

```bash
pnpm dev:vanilla
```

```bash
pnpm new image-card
```

```bash
pnpm build
```
