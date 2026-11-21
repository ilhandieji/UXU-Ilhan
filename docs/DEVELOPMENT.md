# توسعه

## پیش‌نیاز

Node.js ≥ 22.18 و pnpm (نسخه‌ی `package.json` ریشه). اسکریپت‌های `scripts/` به TypeScript (`.ts`) نوشته شده‌اند و Node آن‌ها را بدون ابزار اضافه اجرا می‌کند؛ فقط syntax قابل حذف مجاز است (`erasableSyntaxOnly` در `tsconfig.json`: بدون `enum`/`namespace`) و در `pnpm typecheck` بررسی می‌شوند.

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

نوع‌ها: `color`، `slider`، `select`، `text`، `switch`، `link`؛ `target: 'token'` (توکن تم، مثل `bg`)، `'option'` (گزینه‌ی `defaults`، مسیر نقطه‌دار مثل `site.version`) یا `'none'` (فقط `link`: لینک به ابزار سایت). تغییر preset تم، override رنگ‌ها را پاک می‌کند. کنترل `color` با Color Picker داخلی سایت باز می‌شود (پالت، رنگ‌های تم، رنگ‌های اخیر، hex/RGB/alpha؛ EyeDropper فقط در مرورگرهایی که پشتیبانی می‌کنند).

### تنظیمات در URL

`src/lib/url-state.ts`: state پنل Customize (option و token)، framework (`fw`) و تب (`tab`) در query صفحه نوشته می‌شوند؛ فقط مقادیری که با `initialState` فرق دارند، با debounce و `history.replaceState`. نام پارامتر = `key` کنترل؛ boolean ⇒ `1/0`؛ slider ⇒ عدد بدون واحد. هنگام بارگذاری کلید ناشناخته و مقدار نامعتبر (خارج از choices، بازه یا رنگ نامعتبر) نادیده گرفته می‌شود. option بدون کنترل (مثل `bannerMode`) هم با نوع مقدار اولیه‌اش خوانده می‌شود. دکمه‌های **Copy link** و **Reset** در نوار بالا.

### ASCII Editor (`/ascii`)

| مسیر             | کار                                                                                                                                                                                                                                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/ascii/` | موتور مشترک: `grid` (مدل سلول، ابزارهای رسم، undo/redo)، `fonts` (FIGlet؛ ۱۰ فونت اصلی همگام + ۲۳ فونت تنبل)، `image` (charsetها، dithering، رنگ ANSI16/256/truecolor، braille، half-block)، `render` (canvas)، `export` (txt / ANSI / shell / HTML / PNG / JSON)، `terminal-banner` (ارسال به ترمینال) |
| `src/app/ascii/` | صفحه و کامپوننت‌های اختصاصی آن (تب Text / Image / Draw، خروجی‌ها)؛ تنظیمات در URL، رسم در `localStorage`                                                                                                                                                                                                |

پنل **Banner** ترمینال از همین موتور استفاده می‌کند: متن + فونت ⇒ خطوط ASCII که در `banner` فایل `terminal.config.ts` کپی‌شده bake می‌شوند (کامپوننت dependency نمی‌گیرد). «Send to Terminal» در ادیتور، اثر را (متن ساده، بدون رنگ) به‌عنوان banner ترمینال باز می‌کند.

### Copy

تب Code فایل‌های همان framework را نشان می‌دهد؛ `<name>.config.ts` با مقادیر انتخابی بازتولید می‌شود (توکن در بلوک تم انتخابی، یا `sizes`/`common` اگر آنجا تعریف شده)، تا کامپوننت بدون prop اضافه همان ظاهر را داشته باشد.

## ساخت کامپوننت جدید

```bash
pnpm new image-card
```

اسکریپت `scripts/new-component.ts`:

1. `templates/component/` را به `components/image-card/` کپی و نام‌ها را جایگزین می‌کند (kebab-case؛ نام تکراری/نامعتبر رد می‌شود).
2. در `README.md` ریشه (فهرست کامپوننت‌ها) لینک و در `docs/ROADMAP.md` یک ردیف `- [ ]` اضافه می‌کند؛ بعد از اتمام کامپوننت، تیک ROADMAP را بزن.
3. از `templates/registry/` فایل‌های `src/registry/image-card.meta.ts` و `image-card.tsx` را می‌سازد و در `meta.ts` و `index.ts` (زیر خطوط `// @new-…`) ثبت می‌کند.

بعد کنترل‌های `src/registry/<name>.tsx` را متناسب با Options و توکن‌های واقعی کامپوننت کامل کن. برای تغییر ساختار همه‌ی کامپوننت‌های آینده، خود `templates/` را اصلاح کن.

## بررسی و Build

```bash
pnpm build
```

= `check:css` (Tailwind-only و بدون زیرپوشه در کامپوننت‌ها) + `check:docs` (هر کامپوننت در README ریشه، ROADMAP، README خودش و registry باشد) + `typecheck` (`tsc`) + `next build`.

## Dependencyها

- یک `package.json` در ریشه؛ بدون workspace. نصب: `pnpm add <dep>` (سایت) یا `pnpm add -D <dep>` (ابزار).
- کامپوننت‌ها پکیج نیستند؛ نیاز پروژه‌ی مقصد در بخش «نیازمندی‌ها» README هر کامپوننت ثبت می‌شود.
- پیش‌فرض بدون Dependency اضافه برای کامپوننت‌ها (غیر از Tailwind v4 و React ≥ 19.3؛ پروژه روی `^19.3.1` است، آخرین stable)؛ دلیل هر مورد در README کامپوننت.
- `pnpm-lock.yaml` را دستی ویرایش نکن.

### ریشه

- سایت: `next` · `react` · `react-dom` · وابستگی‌های shadcn (`radix-ui`، `lucide-react`، `class-variance-authority`، `clsx`، `tailwind-merge`) · `sonner` (toast) · `react-colorful` (Color Picker) · `figlet` (فونت‌های ASCII Editor؛ هر فونت جدا import می‌شود)
- ابزار: `typescript` · `tailwindcss` · `@tailwindcss/postcss` · `tw-animate-css` · `shiki` (هایلایت کد) · `prettier` · `@types/*`

Terminal بدون کتابخانه‌ی ترمینال (xterm.js) ساخته می‌شود؛ شبیه‌ساز shell و رندر متنی کافی است.
