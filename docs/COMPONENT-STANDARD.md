# معماری و استاندارد کامپوننت

مرجع اصلی: [`AGENTS.md`](../AGENTS.md).

## معماری
- مدل **copy-paste** (مثل shadcn/ui): کامپوننت‌ها پکیج نیستند، فایل‌اند و مستقیم در پروژه‌ی دیگر کپی می‌شوند. یک `package.json` در ریشه فقط برای Playground و type-check.
- هر کامپوننت دو نسخه‌ی مستقل دارد: `react` (TSX) و `vanilla` (TypeScript بدون فریم‌ورک). بین آن‌ها import اجرایی یا Wrapper نیست.
- ساختار هر کامپوننت با `pnpm new <name>` ساخته می‌شود (ببین [DEVELOPMENT](DEVELOPMENT.md)):

```
components/<name>/
├── README.md
├── react/    <Name>.tsx   <name>.config.ts
└── vanilla/  <name>.ts    <name>.config.ts
```

## سادگی (سبک reactbits)
- هر کامپوننت یک کار انجام می‌دهد و کد آن خوانا و کوتاه است؛ بدون لایه‌ی انتزاعی، پوشه‌ی داخلی یا `index.ts` واسط.
- دو فایل ثابت در هر نسخه، **بدون زیرپوشه**: کامپوننت · `<name>.config.ts`. importها نسبی و بدون پسوند/alias تا کپی بدون تغییر کار کند. اگر فایلی از حدود ۳۰۰ خط گذشت، فقط یک فایل هم‌سطح اضافه کن.
- دو نسخه کدشان مستقل است ولی **نام Options، توکن‌ها و رفتار یکی** است.

## قرارداد Dynamic
| محور | مکانیزم | مثال |
|---|---|---|
| رنگ/فونت/اندازه/فاصله/radius | CSS Variable ست‌شده از JS + کلاس Tailwind | `bg-(color:--ux-terminal-bg)` |
| Theme | preset در `themes` یا آبجکت جزئی توکن | `theme="matrix"` / `{ bg: '#000' }` |
| Variant | override توکن در `variants` | `window \| fullscreen \| minimal` |
| Size | override توکن در `sizes` | `sm \| md \| lg` |
| رفتار/متن | Options/Props با پیش‌فرض | `welcomeMessage` |

- توکن‌ها، Options و پیش‌فرض‌ها فقط در `<name>.config.ts`؛ کلاس‌های Tailwind فقط `var(--ux-*)` مصرف می‌کنند.

## Tailwind-only
استایل فقط با Tailwind v4؛ فایل `.css`، `<style>` و `@apply` در پوشه‌ی کامپوننت ممنوع. استثنا: فایل با خط اول `/* tailwind-exception: دلیل */`. تنها CSS معمولی `playground/*/index.css` است. پروژه‌ی مقصد Tailwind v4 دارد. بررسی: `pnpm check:css`. جزئیات: `.claude/rules/tailwind.md`.
- تغییر runtime بدون remount و بدون از دست رفتن state؛ Option نامعتبر → پیش‌فرض.

## API استاندارد
Vanilla: `createX(container, options)` ← `{ update(partial), destroy() }`
React: `<X {...options} />` (`'use client'`، سازگار با SSR)

## Dependencyها
پیش‌فرض بدون Dependency (غیر از Tailwind v4 و React). نصب برای Playground در ریشه (`pnpm add -D`)؛ نیاز پروژه‌ی مقصد در «نیازمندی‌ها»ی README کامپوننت.

## چک‌لیست تحویل
- [ ] هیچ رنگ/فونت/اندازه‌ی هاردکد نیست و فایل CSS اضافه نشده (`pnpm check:css`)
- [ ] Options و توکن‌ها در README و `<name>.config.ts` هماهنگ‌اند
- [ ] «نیازمندی‌ها» در README ثبت شده و فایل‌ها بدون تغییر کپی‌شدنی‌اند
- [ ] دو نسخه نام‌ها و رفتار یکسان دارند
- [ ] Accessibility/Responsive بررسی شده
- [ ] `pnpm build` پاس می‌شود و دمو در هر دو Playground دیده شده
- [ ] cleanup (`destroy`/unmount) کامل است
