# MatrixRain

پس‌زمینه‌ی «باران کاراکتر» روی Canvas 2D: ستون‌هایی از کاراکترها که با سر درخشان پایین (یا بالا) می‌ریزند و دنباله‌شان محو می‌شود. پیاده‌سازی مستقل و اصلی از این افکت ژانری. دو پیاده‌سازی مستقل: [`react/`](react) (TSX) و [`vanilla/`](vanilla) (TypeScript).

## قابلیت‌ها

- Canvas 2D با پشتیبانی HiDPI (سقف `maxDevicePixelRatio`)، `ResizeObserver` روی کانواس
- توقف خودکار وقتی تب مخفی است (`visibilitychange`) یا کانواس خارج از دید است (`IntersectionObserver`)؛ `destroy` همه‌چیز را کامل متوقف و پاک می‌کند
- ۵ preset (`matrix`، `cyan`، `amber`، `blood`، `mono`) و ۶ charset (`katakana`، `binary`، `hex`، `latin`، `symbols`، `custom`)
- سرعت، چگالی ستون‌ها، طول دنباله (`fade`)، تنوع سرعت هر ستون، جهت (`down` / `up`)، درخشش سر (`glow`)
- `interactive`: ستون‌های نزدیک نشانگر روشن‌تر و سریع‌تر می‌شوند
- API دستوری: `pause()`، `resume()`، `burst()` (جهش سرعت حدود ۱ ثانیه)، `clear()`
- دو variant: `contained` (کادر والد را پر می‌کند، زیر children) و `fullscreen` (`fixed inset-0`، `pointer-events-none`، با توکن z-index — مناسب افکت سراسری / easter egg)
- رنگ‌ها از CSS Variableهای resolve‌شده خوانده می‌شوند؛ هر رنگ CSS (`#hex`، `rgb()`، `oklch()`، `var(--brand)`، `transparent` برای bg) کار می‌کند
- `prefers-reduced-motion`: با `respectReducedMotion` (پیش‌فرض) فقط یک فریم ثابت رسم می‌شود
- تغییر همه‌ی optionها در runtime بدون ساخت مجدد (تغییر فونت/charset فقط ستون‌ها را دوباره می‌چیند)

## فایل‌ها (برای کپی)

هر نسخه سه فایل دارد (موتور Canvas در فایل هم‌سطح جدا است)، بدون زیرپوشه:

| React (`react/`)        | Vanilla (`vanilla/`)    | محتوا                                                                          |
| ----------------------- | ----------------------- | ------------------------------------------------------------------------------ |
| `MatrixRain.tsx`        | `matrix-rain.ts`        | DOM، چرخه‌ی عمر، API دستوری                                                    |
| `matrix-rain.config.ts` | `matrix-rain.config.ts` | Options، پیش‌فرض‌ها، presetها، charsetها، sizes، کلاس‌های Tailwind، اعتبارسنجی |
| `matrix-rain.engine.ts` | `matrix-rain.engine.ts` | موتور Canvas 2D (بدون وابستگی به فریم‌ورک؛ دو نسخه یکسان‌اند)                  |

استایل **فقط Tailwind v4** است (بدون فایل CSS).

## نیازمندی‌ها

- Tailwind CSS v4 (اگر مسیر کپی را خودکار اسکن نمی‌کند: `@source "./components/ui";`)
- React: `react` ≥ 19.3 (آخرین نسخه‌ی stable: 19.3.1؛ `ref` به‌صورت prop مستقیم)؛ آماده‌ی Next.js با `'use client'`
- Dependency اجرایی دیگر ندارد.

## استفاده

در variant `contained` کامپوننت والدش را پر می‌کند (`h-full w-full`)؛ به والد ارتفاع بدهید.

React:

```tsx
"use client";
import { useRef } from "react";
import { MatrixRain, type MatrixRainHandle } from "./MatrixRain";

const rain = useRef<MatrixRainHandle>(null);

<section className="h-screen">
  <MatrixRain ref={rain} theme="matrix" interactive>
    <h1>Wake up.</h1>
  </MatrixRain>
</section>;

rain.current?.burst();
```

افکت سراسری (در layout؛ روی صفحه، بدون گرفتن کلیک):

```tsx
{
  easterEgg && <MatrixRain variant="fullscreen" bg="rgb(0 0 0 / 0.85)" zIndex={60} />;
}
```

Vanilla (کانواس به‌عنوان اولین فرزند container اضافه می‌شود و فرزندان قبلی روی آن می‌مانند):

```ts
import { createMatrixRain } from "./matrix-rain";

const rain = createMatrixRain(document.querySelector("#hero")!, {
  theme: "cyan",
  charset: "binary",
});
rain.update({ speed: 1.5, direction: "up", theme: { head: "var(--brand)" } });
rain.burst();
rain.destroy();
```

## Options

نام و معنی در دو نسخه یکسان است. مقادیر عددی خارج از بازه clamp می‌شوند؛ مقدار نامعتبر ⇒ پیش‌فرض + `console.warn`.

| Option                 | نوع                                                                   | پیش‌فرض         | توضیح                                                    |
| ---------------------- | --------------------------------------------------------------------- | --------------- | -------------------------------------------------------- |
| `theme`                | نام preset یا `Partial<Tokens>`                                       | `'matrix'`      | preset یا آبجکت توکن‌ها (کلید بدون پیشوند، مثل `{ bg }`) |
| `variant`              | `'contained' \| 'fullscreen'`                                         | `'contained'`   | داخل کادر والد / کل viewport، click-through              |
| `size`                 | `'sm' \| 'md' \| 'lg'`                                                | `'md'`          | اندازه‌ی فونت (12 / 16 / 22px)                           |
| `charset`              | `'katakana' \| 'binary' \| 'hex' \| 'latin' \| 'symbols' \| 'custom'` | `'katakana'`    | مجموعه‌ی کاراکترها                                       |
| `customChars`          | `string`                                                              | `''`            | کاراکترهای `custom` (خالی ⇒ katakana + هشدار)            |
| `fontSize`             | `number` px (6–96)                                                    | از size         | اندازه‌ی هر خانه                                         |
| `speed`                | `number` (0.05–10)                                                    | `1`             | ضریب سرعت ریزش                                           |
| `density`              | `number` (0–1)                                                        | `0.85`          | نسبت ستون‌های فعال                                       |
| `fade`                 | `number` (0–1)                                                        | `0.35`          | بیشتر = دنباله‌ی کوتاه‌تر                                |
| `randomSpeed`          | `number` (0–1)                                                        | `0.5`           | تنوع سرعت هر ستون                                        |
| `direction`            | `'down' \| 'up'`                                                      | `'down'`        | جهت ریزش                                                 |
| `headColor`            | `string` (رنگ CSS)                                                    | از theme        | رنگ کاراکتر سر ستون (توکن `head`)                        |
| `color`                | `string` (رنگ CSS)                                                    | از theme        | رنگ دنباله                                               |
| `bg`                   | `string` (رنگ CSS)                                                    | از theme        | پس‌زمینه‌ی لایه (`transparent` مجاز)                     |
| `glow`                 | `number` px (0–100)                                                   | از theme        | shadow blur سر ستون                                      |
| `opacity`              | `number` (0–1)                                                        | از theme (`1`)  | شفافیت کل لایه                                           |
| `zIndex`               | `number`                                                              | از theme (`50`) | z-index در `fullscreen`                                  |
| `paused`               | `boolean`                                                             | `false`         | توقف انیمیشن (فریم فعلی می‌ماند)                         |
| `respectReducedMotion` | `boolean`                                                             | `true`          | با `prefers-reduced-motion` فقط یک فریم ثابت             |
| `interactive`          | `boolean`                                                             | `false`         | ستون‌های نزدیک نشانگر روشن‌تر و سریع‌تر                  |
| `maxDevicePixelRatio`  | `number` (0.5–4)                                                      | `2`             | سقف تراکم پیکسل کانواس                                   |

فقط React: `children` (محتوای روی باران)، `className`، `style`، `ref`. در Vanilla فرزندان فعلی container روی باران می‌مانند.

### API دستوری

| React (`ref`) | Vanilla (instance) | توضیح                                                   |
| ------------- | ------------------ | ------------------------------------------------------- |
| `pause()`     | `pause()`          | توقف دستی (مستقل از option `paused`)                    |
| `resume()`    | `resume()`         | لغو `pause()`                                           |
| `burst()`     | `burst()`          | جهش سرعت (تا ۴ برابر) که طی ~۱ ثانیه آرام می‌شود        |
| `clear()`     | `clear()`          | پاک‌کردن کانواس و شروع دوباره‌ی همه‌ی ستون‌ها از لبه    |
| —             | `update(partial)`  | تغییر optionها بدون از دست رفتن state                   |
| —             | `destroy()`        | توقف کامل، حذف کانواس، listenerها، observerها و توکن‌ها |

## Presetها (`themes`)

| Preset   | bg        | color     | head      | glow   |
| -------- | --------- | --------- | --------- | ------ |
| `matrix` | `#020604` | `#1fd65f` | `#d8ffe4` | `8px`  |
| `cyan`   | `#01070a` | `#22d3ee` | `#e0fbff` | `8px`  |
| `amber`  | `#0a0600` | `#f59e0b` | `#fff3d6` | `8px`  |
| `blood`  | `#0a0102` | `#e11d2e` | `#ffd6da` | `10px` |
| `mono`   | `#050505` | `#a3a3a3` | `#ffffff` | `4px`  |

## Theme Tokens

روی root (React) یا container (Vanilla) ست می‌شوند؛ رنگ‌ها، فونت و glow را موتور از روی کانواس می‌خواند و بقیه با کلاس Tailwind مصرف می‌شوند:

| توکن                           | مصرف                                           |
| ------------------------------ | ---------------------------------------------- |
| `--ux-matrix-rain-bg`          | `bg-(color:--ux-matrix-rain-bg)` روی کانواس    |
| `--ux-matrix-rain-color`       | رنگ دنباله (موتور)                             |
| `--ux-matrix-rain-head`        | رنگ و رنگ درخشش سر ستون (موتور)                |
| `--ux-matrix-rain-glow`        | shadow blur سر ستون، px (موتور)                |
| `--ux-matrix-rain-font-family` | فونت کانواس (موتور)؛ پیش‌فرض monospace         |
| `--ux-matrix-rain-font-size`   | اندازه‌ی خانه، px (موتور؛ `sizes`)             |
| `--ux-matrix-rain-opacity`     | `opacity-(--ux-matrix-rain-opacity)`           |
| `--ux-matrix-rain-z-index`     | `z-(--ux-matrix-rain-z-index)` در `fullscreen` |

ترتیب ادغام: theme ← size ← variant ← آبجکت theme ← optionهای مستقیم (`bg`، `color`، `headColor`، `glow`، `fontSize`، `opacity`، `zIndex`).

## محدودیت‌ها و نکات فنی

- Accessibility: کانواس `aria-hidden` است و تزئینی است؛ متن مهم را به‌صورت children بگذارید و کنتراست آن با `bg` را بررسی کنید.
- `prefers-reduced-motion` زنده دنبال می‌شود؛ با `respectReducedMotion: false` انیمیشن همیشه اجرا می‌شود.
- `fullscreen` با `position: fixed` داخل همان root/container رسم می‌شود؛ اگر یکی از والدها `transform`/`filter` داشته باشد، fixed نسبت به آن والد می‌شود — برای افکت سراسری آن را مستقیم در layout یا `body` بگذارید.
- رویداد pointer (در `interactive`) روی `window` گوش داده می‌شود و کانواس `pointer-events-none` است؛ پس تعامل با محتوا را نمی‌گیرد.
- رنگ `var(--x)` هنگام `update` resolve می‌شود؛ اگر خود متغیر بعداً عوض شد، `update` را دوباره صدا بزنید.
- Vanilla کلاس‌های `relative isolate` را (اگر نداشت) و توکن‌ها را به container اضافه و در `destroy` به حالت قبل برمی‌گرداند.
- katakana از نیم‌عرض (half-width) استفاده می‌کند تا همه‌ی خانه‌ها هم‌عرض باشند؛ برای charset سفارشی با کاراکترهای پهن، `fontSize` را بزرگ‌تر کنید.

## توسعه

`pnpm dev` ← `http://localhost:3000/components/matrix-rain` (تب React / Vanilla، پنل Customize، Copy)
