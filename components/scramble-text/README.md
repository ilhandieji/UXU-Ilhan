# ScrambleText

افکت متن «رمزگشایی»: هر کاراکتر مدتی با کاراکترهای تصادفی عوض می‌شود و بعد متن نهایی آشکار می‌شود. با تغییر متن در runtime، از متن فعلی به متن جدید می‌رود (مثل تابلوی split-flap). دو پیاده‌سازی مستقل: [`vanilla/`](vanilla) (TypeScript) و [`react/`](react) (TSX).

## قابلیت‌ها

- مجموعه کاراکترهای آماده: `symbols`، `hex`، `binary`، `katakana`، `alphanumeric`، `blocks` (`░▒▓█`) و `custom` با `customChars`
- زمان‌بندی با `requestAnimationFrame`: سرعت تعویض (`speed`)، مدت scramble هر کاراکتر (`scrambleDuration`) و فاصله‌ی شروع کاراکترها (`stagger`)
- جهت آشکار شدن: `start`، `end`، `center`، `random`
- trigger: `mount`، `hover`، `inView`، `loop` (با `loopDelay`)، `manual`
- انتقال split-flap: کاراکترهای بدون تغییر ثابت می‌مانند و بقیه از حالت فعلی به متن جدید می‌روند
- فاصله و خط جدید حفظ می‌شود (`preserveSpaces`)؛ متن چندخطی پشتیبانی می‌شود
- `monospace` برای جلوگیری از لرزش عرض (فونت `mono-font` + `tabular-nums`)
- رنگ جدا برای کاراکترهای آشکارنشده + کم‌رنگ کردن آن‌ها (variant) و درخشش اختیاری
- API imperative: `play()`، `replay()`، `stop()`، `setText(text)`
- متن هرگز با `innerHTML` درج نمی‌شود

## فایل‌ها (برای کپی)

هر نسخه سه فایل دارد، بدون زیرپوشه:

| React (`react/`)          | Vanilla (`vanilla/`)      | محتوا                                                           |
| ------------------------- | ------------------------- | --------------------------------------------------------------- |
| `ScrambleText.tsx`        | `scramble-text.ts`        | رندر، triggerها، API                                            |
| `scramble-text.config.ts` | `scramble-text.config.ts` | Options، پیش‌فرض‌ها، charsetها، توکن‌ها، کلاس‌های Tailwind      |
| `scramble-text.engine.ts` | `scramble-text.engine.ts` | زمان‌بندی انیمیشن (بدون وابستگی به فریم‌ورک؛ دو نسخه یکسان‌اند) |

استایل **فقط Tailwind v4** است (بدون فایل CSS).

## نیازمندی‌ها

- Tailwind CSS v4 (اگر مسیر کپی را خودکار اسکن نمی‌کند: `@source "./components/ui";`)
- React: `react` ≥ 19.3 (آخرین نسخه‌ی stable: 19.3.1؛ `ref` به‌صورت prop مستقیم)؛ آماده‌ی Next.js با `'use client'`
- Dependency اجرایی دیگر ندارد.

## استفاده

React:

```tsx
import { useRef } from "react";
import { ScrambleText, type ScrambleTextHandle } from "./ScrambleText";

const ref = useRef<ScrambleTextHandle>(null);

<ScrambleText
  ref={ref}
  as="h1"
  text="DECRYPTING THE FUTURE"
  charset="katakana"
  theme="cyber"
  size="lg"
/>;
<button onClick={() => ref.current?.replay()}>Replay</button>;
```

Vanilla:

```ts
import { createScrambleText } from "./scramble-text";

const title = createScrambleText(container, {
  as: "h1",
  text: "DECRYPTING THE FUTURE",
  trigger: "inView",
});
title.update({ theme: "amber", direction: "center" });
title.setText("ACCESS GRANTED"); // split-flap transition
title.stop(); // jump to the final text
title.destroy();
```

## Options

| نام                    | نوع                                                                                      | پیش‌فرض                   | توضیح                                                     |
| ---------------------- | ---------------------------------------------------------------------------------------- | ------------------------- | --------------------------------------------------------- |
| `text`                 | `string`                                                                                 | `'DECRYPTING THE FUTURE'` | متن نهایی (فاصله و `\n` مجاز)                             |
| `as`                   | `'span' \| 'p' \| 'h1' \| 'h2' \| 'h3' \| 'div'`                                         | `'span'`                  | تگ ریشه                                                   |
| `theme`                | `'matrix' \| 'cyber' \| 'plain' \| 'amber' \| Partial<Tokens>`                           | `'matrix'`                | preset یا توکن‌های سفارشی                                 |
| `variant`              | `'solid' \| 'dim' \| 'ghost'`                                                            | `'solid'`                 | میزان کم‌رنگی کاراکترهای آشکارنشده                        |
| `size`                 | `'sm' \| 'md' \| 'lg'`                                                                   | `'md'`                    | اندازه‌ی فونت                                             |
| `charset`              | `'symbols' \| 'hex' \| 'binary' \| 'katakana' \| 'alphanumeric' \| 'blocks' \| 'custom'` | `'symbols'`               | کاراکترهای تصادفی                                         |
| `customChars`          | `string`                                                                                 | `''`                      | برای `charset: 'custom'` (خالی ← `symbols` + هشدار)       |
| `speed`                | `number` (ms)                                                                            | `40`                      | فاصله‌ی تعویض کاراکترهای تصادفی (۱۰–۱۰۰۰)                 |
| `scrambleDuration`     | `number` (ms)                                                                            | `600`                     | مدت scramble هر کاراکتر پیش از آشکار شدن                  |
| `stagger`              | `number` (ms)                                                                            | `40`                      | فاصله‌ی شروع کاراکترهای پشت‌سرهم                          |
| `trigger`              | `'mount' \| 'hover' \| 'inView' \| 'loop' \| 'manual'`                                   | `'mount'`                 | زمان شروع انیمیشن                                         |
| `loopDelay`            | `number` (ms)                                                                            | `2000`                    | مکث بین دورها در `loop`                                   |
| `direction`            | `'start' \| 'end' \| 'center' \| 'random'`                                               | `'start'`                 | ترتیب آشکار شدن                                           |
| `preserveSpaces`       | `boolean`                                                                                | `true`                    | فاصله‌ها scramble نمی‌شوند (`\n` همیشه حفظ می‌شود)        |
| `monospace`            | `boolean`                                                                                | `true`                    | فونت `mono-font` به‌جای `font-family` (بدون لرزش عرض)     |
| `glow`                 | `boolean`                                                                                | `true`                    | اعمال توکن `glow` به‌عنوان `text-shadow`                  |
| `respectReducedMotion` | `boolean`                                                                                | `true`                    | با `prefers-reduced-motion` متن نهایی فوراً نمایش داده شود |
| `onComplete`           | `() => void`                                                                             | —                         | پس از پایان هر اجرا (هر دور loop و هر انتقال متن)         |

React علاوه بر این `className`، `style` و `ref` (`ScrambleTextHandle`) می‌گیرد.

### API imperative

| متد             | توضیح                                                                        |
| --------------- | ---------------------------------------------------------------------------- |
| `play()`        | شروع scramble از ابتدا، اگر در حال اجرا نباشد                                |
| `replay()`      | شروع دوباره از ابتدا (حتی وسط اجرا)                                          |
| `stop()`        | پرش به متن نهایی و لغو دور بعدی loop (loop با `play`/`replay` ادامه می‌یابد) |
| `setText(text)` | انتقال split-flap به متن جدید (در React تا تغییر بعدی prop `text`)           |

Vanilla علاوه بر این `update(partial)`، `destroy()` و `element` (ریشه؛ با تغییر `as` جایگزین می‌شود) دارد.

## توکن‌ها (CSS Variables)

مقدارها در `scramble-text.config.ts` (`themes`، `sizes`، `variants`) و روی ریشه ست می‌شوند (ترتیب: theme ← size ← variant ← override):

| توکن                                   | پیش‌فرض (matrix)                | توضیح                                  |
| -------------------------------------- | ------------------------------- | -------------------------------------- |
| `--ux-scramble-text-fg`                | `#d1ffd6`                       | رنگ متن آشکارشده                       |
| `--ux-scramble-text-scrambled`         | `#00ff41`                       | رنگ کاراکترهای آشکارنشده               |
| `--ux-scramble-text-scrambled-opacity` | `1` / `0.6` / `0.3`             | از variant (`solid` / `dim` / `ghost`) |
| `--ux-scramble-text-font-family`       | `system-ui, sans-serif`         | وقتی `monospace: false`                |
| `--ux-scramble-text-mono-font`         | `ui-monospace, …`               | وقتی `monospace: true`                 |
| `--ux-scramble-text-font-size`         | `16px` / `28px` / `48px`        | از size (`sm` / `md` / `lg`)           |
| `--ux-scramble-text-font-weight`       | `700`                           |                                        |
| `--ux-scramble-text-letter-spacing`    | `1px`                           |                                        |
| `--ux-scramble-text-line-height`       | `1.2`                           |                                        |
| `--ux-scramble-text-glow`              | `0 0 12px rgb(0 255 65 / 0.55)` | `text-shadow` وقتی `glow: true`        |

تم `plain` برای `fg` و `scrambled` از `currentColor` استفاده می‌کند و `glow` آن `none` است؛ پس رنگ والد را به ارث می‌برد.

## توسعه

`pnpm dev` ← `http://localhost:3000/components/scramble-text` (تب React / Vanilla، پنل Customize، Copy)

## محدودیت‌ها و نکات

- **Accessibility:** متن نهایی در یک `span` با کلاس `sr-only` قرار دارد و کاراکترهای متحرک داخل `span` با `aria-hidden="true"` هستند؛ صفحه‌خوان فقط متن نهایی را می‌خواند. با `setText` متن `sr-only` فوراً به‌روز می‌شود.
- **Reduced motion:** با `respectReducedMotion: true` و `prefers-reduced-motion: reduce`، هیچ انیمیشنی اجرا نمی‌شود، متن نهایی نمایش داده می‌شود، `onComplete` بلافاصله صدا زده می‌شود و loop متوقف است.
- **SSR:** نسخه React در سرور و اولین رندر کلاینت متن نهایی را نشان می‌دهد؛ انیمیشن بعد از mount شروع می‌شود. در `inView` تا دیده شدن، متن نهایی نمایش داده می‌شود.
- **Trigger `hover`:** با `pointerenter` شروع می‌شود؛ اگر در حال اجرا باشد دوباره شروع نمی‌شود. `inView` فقط یک بار اجرا می‌شود.
- هر کاراکتر یک `span` است؛ برای تیتر و متن کوتاه مناسب است، نه پاراگراف‌های خیلی طولانی.
- کاراکترها بر اساس code point جدا می‌شوند (ایموجی سالم می‌ماند، ولی ایموجی‌های ترکیبی ZWJ ممکن است جدا شوند). متن راست‌به‌چپ کار می‌کند ولی charsetهای پیش‌فرض لاتین/ژاپنی‌اند؛ برای فارسی از `custom` استفاده کن.
- با `monospace: false` و فونت متناسب، عرض متن هنگام scramble کمی تغییر می‌کند.
