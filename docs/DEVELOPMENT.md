# توسعه

## پیش‌نیاز

Node.js و pnpm (نسخه‌ی `package.json` ریشه).

```bash
pnpm install
```

## سایت Playground

سایت Next.js (App Router) + shadcn/ui در `src/`، فقط dark. برای مرور کامپوننت‌ها، Live Preview (React و Vanilla)، کاستوم کردن و کپی.

```bash
pnpm dev
```

سپس `http://localhost:3000` (صفحه‌ی هر کامپوننت: `/components/<name>`).

| مسیر                          | کار                                                                                                                              |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/`                    | layout (dark، sidebar)، صفحه‌ی خانه، `components/[slug]` (سورس فایل‌ها هنگام build با `fs` خوانده می‌شود)                        |
| `src/components/`             | UI سایت: `component-studio`، `customize-panel`، `preview-frame`، `code-view`، `app-sidebar`                                      |
| `src/components/ui/`          | shadcn (فقط UI سایت؛ کامپوننت‌های کتابخانه از آن استفاده نمی‌کنند)                                                               |
| `src/lib/customize-config.ts` | فقط مقدارهای literal را در `<name>.config.ts` عوض می‌کند (کامنت و ساختار می‌ماند)                                                |
| `src/registry/`               | برای هر کامپوننت: `<name>.meta.ts` (server-safe: نام، فایل‌ها، نیازمندی‌ها) و `<name>.tsx` (کنترل‌ها، preview، customize، usage) |
| `src/app/globals.css`         | تنها فایل CSS: Tailwind + `@source "../../components"` + تم dark سایت                                                            |

### کنترل‌ها

نوع‌ها: `color`، `slider`، `select`، `text`، `switch`؛ `target: 'token'` (توکن تم، مثل `bg`) یا `'option'` (گزینه‌ی `defaults`، مسیر نقطه‌دار مثل `site.version`). تغییر preset تم، override رنگ‌ها را پاک می‌کند.

### Copy

تب Code فایل‌های همان framework را نشان می‌دهد؛ `<name>.config.ts` با مقادیر انتخابی بازتولید می‌شود (توکن در بلوک تم انتخابی، یا `sizes`/`common` اگر آنجا تعریف شده)، تا کامپوننت بدون prop اضافه همان ظاهر را داشته باشد.

## ساخت کامپوننت جدید

```bash
pnpm new image-card
```

اسکریپت `scripts/new-component.mjs`:

1. `templates/component/` را به `components/image-card/` کپی و نام‌ها را جایگزین می‌کند (kebab-case؛ نام تکراری/نامعتبر رد می‌شود).
2. از `templates/registry/` فایل‌های `src/registry/image-card.meta.ts` و `image-card.tsx` را می‌سازد و در `meta.ts` و `index.ts` (زیر خطوط `// @new-…`) ثبت می‌کند.

بعد کنترل‌های `src/registry/<name>.tsx` را متناسب با Options و توکن‌های واقعی کامپوننت کامل کن. برای تغییر ساختار همه‌ی کامپوننت‌های آینده، خود `templates/` را اصلاح کن.

## بررسی و Build

```bash
pnpm build
```

= `check:css` (Tailwind-only و بدون زیرپوشه در کامپوننت‌ها) + `typecheck` (`tsc`) + `next build`.

## Dependencyها

- یک `package.json` در ریشه؛ بدون workspace. نصب: `pnpm add <dep>` (سایت) یا `pnpm add -D <dep>` (ابزار).
- کامپوننت‌ها پکیج نیستند؛ نیاز پروژه‌ی مقصد در بخش «نیازمندی‌ها» README هر کامپوننت ثبت می‌شود.
- پیش‌فرض بدون Dependency اضافه برای کامپوننت‌ها (غیر از Tailwind v4 و React)؛ دلیل هر مورد در README کامپوننت.
- `pnpm-lock.yaml` را دستی ویرایش نکن.

### ریشه

- سایت: `next` · `react` · `react-dom` · وابستگی‌های shadcn (`radix-ui`، `lucide-react`، `class-variance-authority`، `clsx`، `tailwind-merge`) · `sonner` (toast)
- ابزار: `typescript` · `tailwindcss` · `@tailwindcss/postcss` · `tw-animate-css` · `shiki` (هایلایت کد) · `prettier` · `@types/*`

Terminal بدون کتابخانه‌ی ترمینال (xterm.js) ساخته می‌شود؛ شبیه‌ساز shell و رندر متنی کافی است.
