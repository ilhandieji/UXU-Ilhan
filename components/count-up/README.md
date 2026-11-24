# CountUp

عدد متحرک که از `from` تا `to` می‌شمارد (آمار، قیمت، درصد). دو پیاده‌سازی مستقل: [`vanilla/`](vanilla) (TypeScript) و [`react/`](react) (TSX).

## قابلیت‌ها

- انیمیشن با `requestAnimationFrame` و ۵ easing: `linear`، `easeOut`، `easeInOut`، `spring` (کمی از هدف رد می‌شود و برمی‌گردد)، `expo`
- قالب‌بندی با `Intl.NumberFormat`: locale (مثلاً `fa-IR` برای ارقام فارسی، `ar-EG`، `de-DE`)، تعداد اعشار، جداکننده‌ی هزارگان، `compact` (`1.2M`) و ارز (`currency: "USD"`)؛ هر ترکیب تنظیمات یک‌بار ساخته و کش می‌شود
- `prefix` / `suffix` با رنگ جدا (توکن `prefix-color`)
- شروع با `mount`، `inView` (پیش‌فرض، با IntersectionObserver) یا `manual`؛ `once: false` = هر بار که وارد صفحه شود دوباره می‌شمارد
- تغییر `to` در runtime: از مقدار فعلیِ نمایش‌داده‌شده تا مقدار جدید انیمیشن می‌گیرد
- `tabular-nums` تا عرض عدد هنگام شمارش نلرزد
- API دستوری: `start()`، `reset()`، `update(to)`
- Dynamic: ۴ تم (`plain`، `neon`، `gold`، `mono`)، ۴ اندازه (`sm`، `md`، `lg`، `xl`) و همه‌ی رنگ/فونت/وزن/فاصله/درخشش با توکن

## فایل‌ها (برای کپی)

| نسخه    | فایل‌ها                                              |
| ------- | ---------------------------------------------------- |
| React   | `react/CountUp.tsx` · `react/count-up.config.ts`     |
| Vanilla | `vanilla/count-up.ts` · `vanilla/count-up.config.ts` |

هر دو فایل یک نسخه را کنار هم در پروژه‌ی خودت کپی کن (مثلاً `components/ui/`). استایل **فقط Tailwind v4** است.

## نیازمندی‌ها

- Tailwind CSS v4 (اگر مسیر کپی را خودکار اسکن نمی‌کند: `@source "./components/ui";`)
- React: `react` ≥ 19.3 (آخرین نسخه‌ی stable: 19.3.1؛ `ref` به‌صورت prop مستقیم)؛ آماده‌ی Next.js با `'use client'`
- مرورگر مدرن (`Intl.NumberFormat` با `notation`؛ بدون IntersectionObserver، `inView` بلافاصله شروع می‌کند)
- Dependency اجرایی دیگر ندارد.

## استفاده

React:

```tsx
import { useRef } from "react";
import { CountUp, type CountUpHandle } from "./CountUp";

const users = useRef<CountUpHandle>(null);

<CountUp ref={users} to={12480} suffix="+" />
<CountUp to={1_200_000} notation="compact" currency="USD" decimals={1} theme="neon" />
<CountUp to={99.9} decimals={1} suffix="%" locale="fa-IR" onComplete={(v) => console.log(v)} />

users.current?.start(); // replay
users.current?.update(13000); // from the shown value to 13000
```

Vanilla:

```ts
import { createCountUp } from "./count-up";

const users = createCountUp(container, { to: 12480, suffix: "+" });
users.update(13000); // number = new target (animates from the shown value)
users.update({ locale: "fa-IR", theme: { fg: "#7df9ff" } }); // options, without losing state
users.start();
users.reset();
users.destroy();
```

## Options

| نام                    | نوع                                                          | پیش‌فرض      | توضیح                                                                 |
| ---------------------- | ------------------------------------------------------------ | ------------ | --------------------------------------------------------------------- |
| `from`                 | `number`                                                     | `0`          | مقدار شروع                                                            |
| `to`                   | `number`                                                     | `1000`       | مقدار نهایی؛ تغییرش انیمیشن از مقدار فعلی                             |
| `duration`             | `number` (ثانیه)                                             | `2`          | ۰ تا ۶۰؛ `0` = بدون انیمیشن                                           |
| `delay`                | `number` (ثانیه)                                             | `0`          | فقط قبل از `start` (نه هنگام تغییر `to`)                              |
| `easing`               | `'linear' \| 'easeOut' \| 'easeInOut' \| 'spring' \| 'expo'` | `'easeOut'`  |                                                                       |
| `decimals`             | `number`                                                     | `0`          | تعداد ثابت رقم اعشار (۰ تا ۲۰)                                        |
| `locale`               | `string`                                                     | `'en-US'`    | BCP 47؛ نامعتبر ← `en-US`                                             |
| `separator`            | `boolean`                                                    | `true`       | جداکننده‌ی هزارگان                                                    |
| `notation`             | `'standard' \| 'compact'`                                    | `'standard'` | `compact` = `12K`، `1.2M`                                             |
| `currency`             | `string`                                                     | `''`         | کد ISO 4217 (`USD`, `EUR`, `IRR`)؛ خالی = عدد ساده                    |
| `prefix` / `suffix`    | `string`                                                     | `''`         | متن قبل/بعد عدد (با `textContent` درج می‌شود)                         |
| `trigger`              | `'mount' \| 'inView' \| 'manual'`                            | `'inView'`   |                                                                       |
| `once`                 | `boolean`                                                    | `true`       | `inView`: `false` = با خروج از صفحه reset و با ورود دوباره اجرا       |
| `threshold`            | `number`                                                     | `0.3`        | `inView`: نسبت دیده‌شدن برای شروع (۰ تا ۱)                            |
| `as`                   | `'span' \| 'div' \| 'p' \| 'strong' \| 'dd' \| 'h1'…'h6' …`  | `'span'`     | تگ ریشه                                                               |
| `respectReducedMotion` | `boolean`                                                    | `true`       | با `prefers-reduced-motion` مقدار نهایی بدون انیمیشن نشان داده می‌شود |
| `ariaLive`             | `boolean`                                                    | `false`      | اعلام مقدار نهایی بعد از هر اجرا (`aria-live="polite"`)               |
| `onComplete`           | `(value: number) => void`                                    | —            | پایان هر انیمیشن                                                      |
| `theme`                | `'plain' \| 'neon' \| 'gold' \| 'mono' \| Partial<Tokens>`   | `'plain'`    | preset یا توکن‌های سفارشی                                             |
| `size`                 | `'sm' \| 'md' \| 'lg' \| 'xl'`                               | `'md'`       | ۲۴ / ۳۶ / ۴۸ / ۷۲ پیکسل                                               |

React علاوه بر این `className`، `style` و `ref` (`CountUpHandle`) می‌گیرد.

API دستوری:

| متد       | React (`ref`)          | Vanilla                                  |
| --------- | ---------------------- | ---------------------------------------- |
| `start()` | اجرا از `from` تا `to` | همان                                     |
| `reset()` | توقف و نمایش `from`    | همان                                     |
| `update`  | `update(to: number)`   | `update(to: number \| Partial<Options>)` |
| `value`   | مقدار نمایش‌داده‌شده   | همان؛ به‌علاوه‌ی `element` و `destroy()` |

مقدار نامعتبر هر option به پیش‌فرض برمی‌گردد و یک `console.warn` چاپ می‌شود.

## توکن‌ها (CSS Variables)

مقدارها در `count-up.config.ts` (`themes`, `sizes`) و روی root ست می‌شوند:

| توکن                           | توضیح                                                  |
| ------------------------------ | ------------------------------------------------------ |
| `--ux-count-up-fg`             | رنگ عدد (`plain`: `currentColor`)                      |
| `--ux-count-up-prefix-color`   | رنگ prefix / suffix                                    |
| `--ux-count-up-font-family`    | فونت                                                   |
| `--ux-count-up-font-size`      | اندازه (از `sizes`)                                    |
| `--ux-count-up-font-weight`    | وزن فونت                                               |
| `--ux-count-up-letter-spacing` | فاصله‌ی حروف                                           |
| `--ux-count-up-glow`           | `text-shadow` (`none` یا مثلاً `0 0 12px currentColor`) |

## توسعه

`pnpm dev` ← `http://localhost:3000/components/count-up` (تب React / Vanilla، پنل Customize، Copy)

## محدودیت‌ها و نکات

- **Accessibility:** عدد متحرک `aria-hidden` است و یک `span` با کلاس `sr-only` متن کامل (prefix + مقدار نهایی + suffix) را به screen reader می‌دهد، پس شمارش فریم‌به‌فریم خوانده نمی‌شود. `aria-live` به‌صورت پیش‌فرض خاموش است تا شلوغی ایجاد نکند؛ با `ariaLive: true` متن `sr-only` تا پایان انیمیشن مقدار شروع را دارد و در پایان به مقدار نهایی تغییر می‌کند و اعلام می‌شود.
- **Reduced motion:** با `respectReducedMotion` (پیش‌فرض) و تنظیم `prefers-reduced-motion: reduce` مقدار نهایی بلافاصله نمایش داده می‌شود و `onComplete` صدا زده می‌شود.
- easing `spring` ممکن است لحظه‌ای کمی بیشتر از `to` نشان دهد.
- در React فریم‌ها مستقیم در DOM نوشته می‌شوند (بدون re-render در هر فریم). در SSR مقدار `from` رندر می‌شود.
- در صفحه‌ی RTL، جای prefix/suffix از جهت متن میزبان پیروی می‌کند.
- `variant` ندارد (ساختار تنها یک حالت دارد)؛ ترکیب توکن‌ها: theme ← size ← override کاربر.
- تفاوت عمدی API دو نسخه: `update` در Vanilla options هم می‌پذیرد (چون props ندارد)؛ در React optionها از props می‌آیند. `update(to)` در React یک هدف موقت است و تغییر بعدی prop `to` بر آن غلبه می‌کند.
