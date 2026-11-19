# توسعه

## پیش‌نیاز

Node.js و pnpm (نسخه‌ی `package.json` ریشه).

```bash
pnpm install
```

## Playground

محیط محلی توسعه با Vite و HMR برای دیدن کامپوننت‌ها هنگام نوشتن. دو Playground مستقل:

```bash
pnpm dev:react
```

```bash
pnpm dev:vanilla
```

- انتخاب کامپوننت با نوار بالای صفحه یا `?c=<name>`.
- دموها در `playground/react/demos.tsx` و `playground/vanilla/demos.ts`.
- `playground/*/index.css` تنها فایل CSS است (`@import "tailwindcss"; @source "../../components";`).

## ساخت کامپوننت جدید

```bash
pnpm new image-card
```

اسکریپت `scripts/new-component.mjs`:

1. `templates/component/` را به `components/image-card/` کپی و نام‌ها را جایگزین می‌کند (kebab-case؛ نام تکراری/نامعتبر رد می‌شود).
2. import و دموی پیش‌فرض را در هر دو `demos.ts[x]` (زیر خطوط `// @new-import` و `// @new-demo`) اضافه می‌کند.

برای تغییر ساختار همه‌ی کامپوننت‌های آینده، خود `templates/component/` را اصلاح کن.

## بررسی و Build

```bash
pnpm build
```

= `check:css` (Tailwind-only و بدون زیرپوشه) + `typecheck` (`tsc` روی components، playground و templates) + build هر دو Playground.

## Dependencyها

- یک `package.json` در ریشه؛ بدون workspace. نصب: `pnpm add -D <dep>`.
- کامپوننت‌ها پکیج نیستند؛ نیاز پروژه‌ی مقصد در بخش «نیازمندی‌ها» README هر کامپوننت ثبت می‌شود.
- پیش‌فرض بدون Dependency اضافه (غیر از Tailwind v4 و React)؛ دلیل هر مورد در README کامپوننت.
- `pnpm-lock.yaml` را دستی ویرایش نکن.

### ریشه (`devDependencies`)

`vite` · `typescript` · `tailwindcss` · `@tailwindcss/vite` · `@vitejs/plugin-react` · `react` · `react-dom` · `@types/react` · `@types/react-dom`

Terminal بدون کتابخانه‌ی ترمینال (xterm.js) ساخته می‌شود؛ شبیه‌ساز shell با Virtual FS و رندر متنی کافی است.
