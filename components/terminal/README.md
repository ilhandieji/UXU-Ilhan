# Terminal

کادر ترمینال تحت وب (مثل سایت‌های هاستینگ)، **کاملاً سمت کلاینت**، با ظاهر پنجره‌ای سبز ماتریکسی و درخشش سبز (green glow). دو پیاده‌سازی مستقل: [`vanilla/`](vanilla) (TypeScript) و [`react/`](react) (TSX).

> وضعیت: **ساختار پایه (کانسپت A — Window)** پیاده شده. کامندهای لینوکسی، Virtual FS و بقیه‌ی قابلیت‌های بخش «برنامه‌ریزی‌شده» هنوز نوشته نشده‌اند. تم‌های جدید بعد از تثبیت ساختار اضافه می‌شوند.

## قابلیت‌های فعلی
- قاب پنجره (نوار بالا با سه دایره و عنوان) یا حالت `minimal` بدون نوار
- بنر بزرگ، زیرعنوان، خطوط وضعیت (`boot`) و لیست راهنما (`help`)
- prompt با ورودی واقعی (`user@host:cwd$`)، تاریخچه با ↑/↓، کلیک روی ترمینال = فوکوس
- کامندهای داخلی `help` و `clear` و کامندهای سفارشی از طریق `commands`
- Dynamic: تم، variant، size، درخشش و همه‌ی رنگ/فونت/اندازه‌ها با توکن
- خروجی همیشه با `textContent`/متن React (بدون `innerHTML`)

## فایل‌ها (برای کپی)
هر نسخه دو فایل دارد، بدون زیرپوشه:

| React (`react/`) | Vanilla (`vanilla/`) | محتوا |
|---|---|---|
| `Terminal.tsx` | `terminal.ts` | رندر، ورودی، تاریخچه، اجرای کامند |
| `terminal.config.ts` | `terminal.config.ts` | نوع Options، پیش‌فرض‌ها، توکن‌ها (`themes`, `sizes`, `variants`)، کلاس‌های Tailwind |

استایل **فقط Tailwind v4** است (بدون فایل CSS).

## نیازمندی‌ها
- Tailwind CSS v4 (اگر مسیر کپی را خودکار اسکن نمی‌کند: `@source "./components/ui";`)
- React: `react` ≥ 19 (prop `ref` به‌صورت مستقیم)؛ آماده‌ی Next.js با `'use client'`
- Dependency اجرایی دیگر ندارد.

## استفاده
React:
```tsx
import { Terminal } from './Terminal'

<Terminal commands={{ echo: (args) => args.join(' ') }} />
```
Vanilla:
```ts
import { createTerminal } from './terminal';

const term = createTerminal(container, { commands: { echo: (args) => args.join(' ') } });
term.update({ theme: 'amber', size: 'lg' });
term.destroy();
```

## توسعه
`pnpm dev:react` یا `pnpm dev:vanilla` ← `?c=terminal`

## Options / Props (قرارداد مشترک)
| نام | نوع | پیش‌فرض | توضیح |
|---|---|---|---|
| `theme` | `'matrix' \| 'classic-black' \| 'amber' \| 'light' \| Partial<Tokens>` | `'matrix'` | preset یا توکن‌های سفارشی |
| `variant` | `'window' \| 'fullscreen' \| 'minimal'` | `'window'` | ساختار ظاهری |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | مقیاس |
| `glow` | `boolean` | `true` | درخشش سبز متن |
| `user` / `host` / `cwd` | `string` | `'guest'` / `'portal'` / `'~'` | اجزای prompt |
| `title` | `string` | `user@host:cwd` | عنوان نوار پنجره |
| `banner` | `string \| false` | `'TERMINAL'` | عنوان بزرگ |
| `subtitle` | `string` | `'Terminal v1.0 — web shell'` | |
| `boot` | `{ label, value }[]` | session / filesystem / matrix layer | خطوط وضعیت |
| `help` | `{ name, description }[]` | help, clear | لیست راهنما (نمایش و خروجی `help`) |
| `placeholder` | `string` | `'help · clear'` | راهنمای ورودی خالی |
| `commands` | `Record<string, (args) => string \| string[] \| void>` | `{}` | کامندهای سفارشی |
| `onCommand` | `(line) => void` | — | بعد از هر Enter |

API imperative: Vanilla `update(partial)`, `clear()`, `focus()`, `destroy()` · React `ref` با `clear()` و `focus()`.

## Theme Tokens
همه با پیشوند `--ux-terminal-`؛ مقدارها در `terminal.config.ts` تعریف و از JS روی root ست می‌شوند؛ کلاس‌های Tailwind آن‌ها را مصرف می‌کنند (مثل `bg-(color:--ux-terminal-bg)`). فونت/اندازه با توکن‌های `font-family`/`font-size` در `theme` (آبجکت) یا `size` عوض می‌شود.

| توکن | کاربرد |
|---|---|
| `bg`, `fg`, `dim`, `accent` | پس‌زمینه، متن روشن، متن کم‌رنگ، رنگ اصلی (Matrix: سبز) |
| `glow`, `glow-strong` | درخشش ملایم متن و درخشش قوی‌تر بنر و prompt (`none` = خاموش) |
| `cursor`, `selection` | کِرسر و انتخاب متن |
| `error` | رنگ خطا |
| `titlebar-bg`, `titlebar-fg`, `border` | نوار بالا و قاب |
| `dot-1`, `dot-2`, `dot-3` | سه دایره‌ی نوار بالا |
| `font-family`, `font-size`, `line-height`, `letter-spacing` | تایپوگرافی |
| `banner-size`, `banner-spacing` | اندازه و فاصله‌ی حروف بنر |
| `padding`, `radius`, `shadow`, `width`, `height` | ابعاد و قاب |

Presetها: `matrix` (سیاه + سبز نئون)، `classic-black`، `amber`، `light`.

## Variants و Sizes
- `window`: قاب با نوار بالا · `fullscreen`: تمام‌صفحه · `minimal`: بدون نوار بالا
- `sm | md | lg`: مقیاس فونت/padding

## برنامه‌ریزی‌شده (هنوز پیاده نشده)
- کامندهای لینوکسی با Virtual FS: `ls cd pwd cat mkdir touch rm cp mv head tail tree find echo grep wc sort uniq whoami date uname env history man ...`
- Parser با `|`، `>`، `>>`، `$VAR`، Tab-completion، `persist`
- افکت Matrix Rain اختیاری پشت ترمینال
- variantهای تب‌دار و شل کلاسیک (کانسپت‌های C و B) و تم‌های بیشتر

## Accessibility
`role="application"` با `aria-label`، خروجی `role="log"` + `aria-live="polite"`، ورودی با `aria-label`، فوکوس با کلیک. کنتراست `dim` روی پس‌زمینه‌ی matrix پایین است (برای متن ثانویه)؛ در تم‌های بعدی بازبینی شود.

## محدودیت‌ها
- کِرسر همان caret بومی input است (رنگ از توکن `cursor`)؛ کِرسر بلوکی سفارشی هنوز نیست.
- تاریخچه‌ی ↑/↓ فقط در حافظه است.
