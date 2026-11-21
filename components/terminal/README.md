# Terminal

کادر ترمینال تحت وب (مثل سایت‌های هاستینگ)، **کاملاً سمت کلاینت**، با ظاهر پنجره‌ای سبز ماتریکسی و بنر ASCII. دو پیاده‌سازی مستقل: [`vanilla/`](vanilla) (TypeScript) و [`react/`](react) (TSX).

## قابلیت‌ها

- قاب پنجره (نوار بالا با سه دایره و عنوان) یا حالت `minimal` بدون نوار
- بنر ASCII، زیرعنوان، خطوط وضعیت (`boot`) و راهنمای کوتاه
- ۲۷ کامند داخلی (جدول پایین) + کامند سفارشی با `commands`
- تاریخچه با ↑/↓، تکمیل با Tab (کامند، `cd <page>`، `man <command>`)، `Ctrl+C` (توقف کامند در حال اجرا)، `Ctrl+L` (پاک‌کردن)
- کامندهای طولانی (`ping`، `traceroute`، `nmap`) خط‌به‌خط خروجی می‌دهند و با `Ctrl+C` متوقف می‌شوند
- Dynamic: تم، variant، size، درخشش و همه‌ی رنگ/فونت/اندازه‌ها با توکن
- خروجی همیشه متن ساده است (بدون `innerHTML`)

## فایل‌ها (برای کپی)

هر نسخه سه فایل دارد (کامندها در فایل هم‌سطح جدا هستند)، بدون زیرپوشه:

| React (`react/`)       | Vanilla (`vanilla/`)   | محتوا                                                                               |
| ---------------------- | ---------------------- | ----------------------------------------------------------------------------------- |
| `Terminal.tsx`         | `terminal.ts`          | رندر، ورودی، کیبورد                                                                 |
| `terminal.config.ts`   | `terminal.config.ts`   | Options، پیش‌فرض‌ها (بنر، سایت، صفحه‌ها، داده‌ی نمایشی)، توکن‌ها، کلاس‌های Tailwind |
| `terminal.commands.ts` | `terminal.commands.ts` | همه‌ی کامندها و موتور اجرا (بدون وابستگی به فریم‌ورک؛ دو نسخه یکسان‌اند)            |

استایل **فقط Tailwind v4** است (بدون فایل CSS).

## نیازمندی‌ها

- Tailwind CSS v4 (اگر مسیر کپی را خودکار اسکن نمی‌کند: `@source "./components/ui";`)
- React: `react` ≥ 19.3 (آخرین نسخه‌ی stable: 19.3.1؛ `ref` به‌صورت prop مستقیم)؛ آماده‌ی Next.js با `'use client'`
- Dependency اجرایی دیگر ندارد.

## استفاده

React (Next.js):

```tsx
'use client'
import { useRouter } from 'next/navigation'
import { Terminal } from './Terminal'

const router = useRouter()
<Terminal
  pages={[{ path: '/', title: 'home' }, { path: '/blog', title: 'articles' }]}
  navigate={(path) => router.push(path)}
  currentUser={session?.user.name ?? null}
/>
```

Vanilla:

```ts
import { createTerminal } from "./terminal";

const term = createTerminal(container, { pages: [{ path: "/", title: "home" }] });
term.update({ theme: "amber", size: "lg" });
await term.run("fastfetch");
term.destroy();
```

## توسعه

`pnpm dev` ← `http://localhost:3000/components/terminal` (تب React / Vanilla، پنل Customize، Copy)

## کامندها

همه‌ی خروجی‌ها به انگلیسی و با فرمت لینوکسی‌اند. هر کامند را می‌شود با `commands` بازنویسی کرد.

| کامند                | کار                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------ |
| `help`               | لیست همه‌ی کامندها با توضیح (در یک صفحه)                                                         |
| `man <command>`      | نحوه‌ی استفاده (NAME / SYNOPSIS)                                                                 |
| `version`            | نام و نسخه‌ی سایت از `site` (مثل `UXU-Ilhan v1.01.1`)                                            |
| `clear`              | پاک کردن صفحه                                                                                    |
| `banner`             | چاپ دوباره‌ی بنر ASCII                                                                           |
| `fastfetch`          | لوگوی ASCII سمت چپ + سایت، زبان، کیبورد، رزولوشن مرورگر، هسته‌ی CPU، RAM (یا N/A)، منطقه‌ی زمانی |
| `whoami`             | `currentUser` یا `guest`                                                                         |
| `history`            | کامندهای همین نشست (فقط در حافظه؛ با رفرش پاک می‌شود)                                            |
| `date`               | تاریخ و ساعت کلاینت با فرمت `date` لینوکس                                                        |
| `ls`                 | صفحه‌های قابل رفتن (`pages`)                                                                     |
| `cd <page>`          | رفتن به صفحه (`cd blog`، `cd blog/`، `cd ..`، `cd ~`)                                            |
| `pwd`                | آدرس کامل صفحه‌ی فعلی                                                                            |
| `back`               | صفحه‌ی قبلی (`onBack` یا `history.back()`)                                                       |
| `sitemap`            | درخت صفحه‌ها با آدرس                                                                             |
| `find <word>`        | جستجو فقط در صفحه‌ی فعلی (تعداد + ۵ نمونه + اسکرول به اولین مورد)                                |
| `calc <expr>`        | ماشین‌حساب امن (`+ - * / % ^`، پرانتز، `pi`، `e`، `sqrt` و ...)                                  |
| `sha256 <text>`      | هش واقعی SHA-256                                                                                 |
| `base64 [-d] <text>` | encode / decode (پشتیبانی UTF-8)                                                                 |
| `rot13 <text>`       | رمز ROT13                                                                                        |
| `xxd <text>`         | hex dump با فرمت `xxd`                                                                           |
| `echo <text>`        | چاپ متن (پشتیبانی از `"..."`)                                                                    |
| `ping [-c n] <host>` | پینگ شبیه‌سازی‌شده با خروجی دقیق لینوکس                                                          |
| `traceroute <host>`  | مسیر شبیه‌سازی‌شده                                                                               |
| `whois <domain>`     | ایستر اگ با اطلاعات ساختگی                                                                       |
| `ifconfig`           | اینترفیس‌های نمایشی از `showcase.ifconfig`                                                       |
| `nmap`               | اسکن نمایشی از `showcase.wifi` و `showcase.hosts` با زمان واقعی                                  |
| `curl <url>`         | ایستر اگ: `curl: (7) Failed to connect — this is a browser tab, not a shell`                     |

## Options / Props (قرارداد مشترک)

| نام             | نوع                                                                    | پیش‌فرض                                | توضیح                             |
| --------------- | ---------------------------------------------------------------------- | -------------------------------------- | --------------------------------- |
| `theme`         | `'matrix' \| 'classic-black' \| 'amber' \| 'light' \| Partial<Tokens>` | `'matrix'`                             | preset یا توکن‌های سفارشی         |
| `variant`       | `'window' \| 'fullscreen' \| 'minimal'`                                | `'window'`                             | ساختار ظاهری                      |
| `size`          | `'sm' \| 'md' \| 'lg'`                                                 | `'md'`                                 | مقیاس                             |
| `glow`          | `boolean`                                                              | `true`                                 | درخشش سبز                         |
| `user` / `host` | `string`                                                               | `'guest'` / `'portal'`                 | اجزای prompt                      |
| `cwd`           | `string`                                                               | `''` (خودکار از آدرس، مثل `~/blog`)    | مسیر prompt                       |
| `currentUser`   | `string \| null`                                                       | —                                      | کاربر لاگین‌شده (whoami و prompt) |
| `title`         | `string`                                                               | `user@host:cwd`                        | عنوان نوار پنجره                  |
| `banner`        | `string[] \| false`                                                    | ASCII `UXU-ILHAN`                      | بنر ابتدایی و کامند `banner`      |
| `subtitle`      | `string`                                                               | `'UXU-Ilhan v1.01.1 — web terminal'`   |                                   |
| `boot`          | `{ label, value }[]`                                                   | session / filesystem                   | خطوط وضعیت                        |
| `help`          | `{ name, description }[]`                                              | help / fastfetch / cd                  | راهنمای کوتاه زیر بنر             |
| `placeholder`   | `string`                                                               | `'help · ls · fastfetch'`              | راهنمای ورودی خالی                |
| `site`          | `{ name, version, language }`                                          | `UXU-Ilhan` / `v1.01.1` / `TypeScript` | برای `version` و `fastfetch`      |
| `pages`         | `{ path, title }[]`                                                    | `[{ path: '/', title: 'home' }]`       | برای `cd`، `ls`، `sitemap`        |
| `navigate`      | `(path) => void`                                                       | `location.assign`                      | ناوبری SPA (مثل `router.push`)    |
| `onBack`        | `() => void`                                                           | `history.back()`                       | برای `back`                       |
| `fastfetchArt`  | `string[]`                                                             | ASCII `UXU`                            | لوگوی سمت چپ `fastfetch`          |
| `showcase`      | `{ ifconfig, wifi, hosts }`                                            | داده‌ی نمونه                           | خروجی `ifconfig` و `nmap`         |
| `commands`      | `Record<string, fn \| { usage, description, run }>`                    | `{}`                                   | کامند سفارشی یا بازنویسی داخلی    |
| `onCommand`     | `(line) => void`                                                       | —                                      | بعد از هر Enter                   |

کامند سفارشی: `(args, ctx) => string | string[] | Output | void | Promise<...>`؛ `ctx.print` برای خروجی تدریجی و `ctx.sleep` برای تأخیر قابل توقف با `Ctrl+C`.

API imperative: Vanilla `update(partial)`, `run(line)`, `clear()`, `focus()`, `destroy()` · React `ref` با `run(line)`, `clear()`, `focus()`.

## Theme Tokens

همه با پیشوند `--ux-terminal-`؛ مقدارها در `terminal.config.ts` تعریف و از JS روی root ست می‌شوند؛ کلاس‌های Tailwind آن‌ها را مصرف می‌کنند (مثل `bg-(color:--ux-terminal-bg)`).

| توکن                                                        | کاربرد                                                             |
| ----------------------------------------------------------- | ------------------------------------------------------------------ |
| `bg`, `fg`, `dim`, `accent`                                 | پس‌زمینه، متن روشن، متن کم‌رنگ، رنگ اصلی (Matrix: سبز)             |
| `glow`, `glow-strong`                                       | درخشش ملایم متن و درخشش قوی‌تر بنر، لوگو و prompt (`none` = خاموش) |
| `cursor`, `selection`                                       | کِرسر و انتخاب متن                                                  |
| `error`                                                     | رنگ خطا                                                            |
| `titlebar-bg`, `titlebar-fg`, `border`                      | نوار بالا و قاب                                                    |
| `dot-1`, `dot-2`, `dot-3`                                   | سه دایره‌ی نوار بالا                                               |
| `font-family`, `font-size`, `line-height`, `letter-spacing` | تایپوگرافی                                                         |
| `banner-size`, `banner-line-height`                         | اندازه و فاصله‌ی خطوط بنر و لوگوی ASCII                            |
| `padding`, `radius`, `shadow`, `width`, `height`            | ابعاد و قاب                                                        |

Presetها: `matrix` (سیاه + سبز نئون)، `classic-black`، `amber`، `light`.

## Variants و Sizes

- `window`: قاب با نوار بالا · `fullscreen`: تمام‌صفحه · `minimal`: بدون نوار بالا
- `sm | md | lg`: مقیاس فونت/padding

## برنامه‌ریزی‌شده (هنوز پیاده نشده)

- افکت Matrix Rain اختیاری پشت ترمینال
- variantهای تب‌دار و شل کلاسیک (کانسپت‌های C و B) و تم‌های بیشتر

## Accessibility

`role="application"` با `aria-label`، خروجی `role="log"` + `aria-live="polite"`، ورودی با `aria-label`، فوکوس با کلیک.

## محدودیت‌ها

- `ping`، `traceroute`، `whois`، `ifconfig`، `nmap` و `curl` نمایشی‌اند و هیچ درخواست شبکه‌ای نمی‌فرستند.
- `fastfetch`: زبان کیبورد از `navigator.language` می‌آید (مرورگر layout کیبورد را نمی‌دهد)؛ RAM فقط در مرورگرهای Chromium (`deviceMemory`)، بقیه `N/A`.
- `cd` بدون `navigate` صفحه را کامل بارگذاری می‌کند و ترمینال از نو شروع می‌شود؛ در SPA (مثل Next.js) `navigate` بدهید.
- کِرسر همان caret بومی input است (رنگ از توکن `cursor`).
