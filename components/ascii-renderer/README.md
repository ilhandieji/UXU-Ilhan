# AsciiRenderer

تبدیل زنده‌ی **تصویر یا ویدیو** به ASCII art، کاملاً سمت کلاینت. خروجی روی یک `<canvas>` با وضوح HiDPI (سریع، رنگی) یا به‌صورت متن در `<pre>` (قابل انتخاب و کپی). دو پیاده‌سازی مستقل: [`vanilla/`](vanilla) (TypeScript) و [`react/`](react) (TSX).

## قابلیت‌ها

- charsetها: `standard`، `detailed`، `blocks` (░▒▓█)، `braille` (۲×۴ زیرپیکسل)، `binary` (0/1)، `halfblock` (▀ با دو پیکسل رنگی در هر کاراکتر)، `custom` (رشته‌ی دلخواه از روشن به پررنگ)
- dithering: `none`، `floyd` (Floyd–Steinberg)، `bayer` (ماتریس ۴×۴)
- حالت رنگ: `mono` (رنگ توکن `fg`)، `ansi16`، `ansi256`، `truecolor`
- تنظیم `brightness`، `contrast`، `gamma`، `invert` و نسبت کاراکتر (`charAspect`، پیش‌فرض: اندازه‌گیری خودکار از فونت)
- `fit`: `contain` / `cover` / `none`؛ نسبت تصویر همیشه حفظ می‌شود و خروجی در هر اندازه با وضوح کامل دوباره کشیده می‌شود (بدون کشیدگی و تاری)
- ویدیو: `<video>` مخفی، تبدیل با نرخ `fps` در حین پخش؛ توقف خودکار وقتی از دید خارج است (IntersectionObserver) یا تب مخفی است
- API imperative: `play()`، `pause()`، `render()`، `toText()`
- Dynamic: تم، variant، size و همه‌ی رنگ/فونت/اندازه‌ها با توکن؛ تغییر هر option در runtime بدون ساخت مجدد

## فایل‌ها (برای کپی)

هر نسخه سه فایل دارد، بدون زیرپوشه:

| React (`react/`)           | Vanilla (`vanilla/`)       | محتوا                                                                                            |
| -------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------ |
| `AsciiRenderer.tsx`        | `ascii-renderer.ts`        | ساخت DOM و اتصال به موتور                                                                        |
| `ascii-renderer.config.ts` | `ascii-renderer.config.ts` | Options، پیش‌فرض‌ها، اعتبارسنجی، توکن‌ها، کلاس‌های Tailwind                                      |
| `ascii-renderer.engine.ts` | `ascii-renderer.engine.ts` | تبدیل تصویر به grid، پالت‌ها، نقاش canvas و player (بدون وابستگی به فریم‌ورک؛ دو نسخه یکسان‌اند) |

استایل **فقط Tailwind v4** است (بدون فایل CSS).

## نیازمندی‌ها

- Tailwind CSS v4 (اگر مسیر کپی را خودکار اسکن نمی‌کند: `@source "./components/ui";`)
- React: `react` ≥ 19.3 (آخرین نسخه‌ی stable: 19.3.1؛ `ref` به‌صورت prop مستقیم)؛ آماده‌ی Next.js با `'use client'`
- **CORS:** برای خواندن پیکسل‌ها، تصویر/ویدیوی دامنه‌ی دیگر باید هدر `Access-Control-Allow-Origin` داشته باشد (`crossOrigin` پیش‌فرض `"anonymous"` است). بدون آن canvas «tainted» می‌شود و `onError` با پیام CORS صدا زده می‌شود. فایل‌های هم‌دامنه، `data:` و `blob:` مشکلی ندارند. `crossOrigin: "none"` فقط برای سرورهایی است که با هدر Origin مشکل دارند (و فقط هم‌دامنه کار می‌کند).

## استفاده

React:

```tsx
import { useRef } from "react";
import { AsciiRenderer, type AsciiRendererHandle } from "./AsciiRenderer";

export default function Hero() {
  const ascii = useRef<AsciiRendererHandle>(null);
  return (
    <div className="h-96">
      <AsciiRenderer
        ref={ascii}
        src="/clip.mp4"
        alt="Product demo rendered as ASCII"
        charset="braille"
        color="truecolor"
        columns={120}
      />
      <button onClick={() => navigator.clipboard.writeText(ascii.current?.toText() ?? "")}>
        Copy
      </button>
    </div>
  );
}
```

Vanilla:

```ts
import { createAsciiRenderer } from "./ascii-renderer";

const ascii = createAsciiRenderer(document.querySelector("#ascii")!, {
  src: "/photo.jpg",
  alt: "Portrait rendered as ASCII",
  columns: 100,
  dither: "floyd",
});
ascii.update({ theme: "amber", charset: "blocks" });
console.log(ascii.toText());
ascii.destroy();
```

اندازه: کامپوننت `w-full h-full` است؛ اگر والد ارتفاع مشخص داشته باشد خروجی داخل آن fit می‌شود، وگرنه ارتفاع از نسبت خروجی (`aspect-ratio`) به دست می‌آید.

## Options

| نام                    | نوع                                                                                        | پیش‌فرض       | توضیح                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------ | ------------- | ------------------------------------------------------------------- |
| `theme`                | `'terminal' \| 'paper' \| 'mono' \| 'amber' \| Partial<Tokens>`                            | `'terminal'`  | preset یا توکن‌های سفارشی                                           |
| `variant`              | `'default' \| 'outline'`                                                                   | `'default'`   | `outline` = حاشیه‌ی ۱px                                             |
| `size`                 | `'sm' \| 'md' \| 'lg'`                                                                     | `'md'`        | font-size و padding                                                 |
| `src`                  | `string`                                                                                   | `''`          | آدرس تصویر یا ویدیو                                                 |
| `type`                 | `'auto' \| 'image' \| 'video'`                                                             | `'auto'`      | auto: ویدیو اگر پسوند mp4/webm/ogv/mov/m4v/mkv یا `data:video` باشد |
| `alt`                  | `string`                                                                                   | `'ASCII art'` | برچسب دسترس‌پذیری (`role="img"` + `aria-label`)؛ حتماً توصیفی بده    |
| `columns`              | `number` (4–400)                                                                           | `80`          | عرض خروجی بر حسب کاراکتر                                            |
| `charset`              | `'standard' \| 'detailed' \| 'blocks' \| 'braille' \| 'binary' \| 'halfblock' \| 'custom'` | `'standard'`  |                                                                     |
| `customChars`          | `string`                                                                                   | `' .:oO@'`    | ramp روشن ← پررنگ برای `custom`                                     |
| `color`                | `'mono' \| 'ansi16' \| 'ansi256' \| 'truecolor'`                                           | `'mono'`      | فقط در خروجی `canvas`                                               |
| `dither`               | `'none' \| 'floyd' \| 'bayer'`                                                             | `'none'`      |                                                                     |
| `invert`               | `boolean`                                                                                  | `false`       |                                                                     |
| `brightness`           | `number` (-1…1)                                                                            | `0`           |                                                                     |
| `contrast`             | `number` (0…3)                                                                             | `1`           |                                                                     |
| `gamma`                | `number` (0.2…3)                                                                           | `1`           |                                                                     |
| `charAspect`           | `number` (0…2)                                                                             | `0`           | نسبت عرض/ارتفاع کاراکتر؛ `0` = اندازه‌گیری از فونت                  |
| `output`               | `'canvas' \| 'text'`                                                                       | `'canvas'`    | `text` = `<pre>` تک‌رنگ و قابل انتخاب                               |
| `fit`                  | `'contain' \| 'cover' \| 'none'`                                                           | `'contain'`   | `none` = اندازه‌ی طبیعی از font-size                                |
| `fps`                  | `number` (1–60)                                                                            | `24`          | نرخ تبدیل ویدیو                                                     |
| `autoplay`             | `boolean`                                                                                  | `true`        | ویدیو                                                               |
| `loop`                 | `boolean`                                                                                  | `true`        | ویدیو                                                               |
| `muted`                | `boolean`                                                                                  | `true`        | ویدیو (autoplay با صدا معمولاً توسط مرورگر مسدود می‌شود)             |
| `crossOrigin`          | `'anonymous' \| 'use-credentials' \| 'none'`                                               | `'anonymous'` | بخش CORS بالا                                                       |
| `fontSize`             | `number` (px)                                                                              | `0`           | `0` = توکن `font-size` همان `size`                                  |
| `respectReducedMotion` | `boolean`                                                                                  | `true`        | با reduced motion فقط فریم اول تا وقتی `play()` صدا زده شود         |
| `maxDevicePixelRatio`  | `number` (0.5–4)                                                                           | `2`           | سقف وضوح canvas                                                     |
| `onReady`              | `(info: { type, sourceWidth, sourceHeight, columns, rows }) => void`                       | —             | بعد از اولین رندر هر منبع                                           |
| `onError`              | `(error: Error) => void`                                                                   | —             | خطای بارگذاری یا CORS (بدون آن `console.warn`)                      |

مقدار نامعتبر ← مقدار پیش‌فرض + `console.warn`.

### API imperative

React با `ref` (`AsciiRendererHandle`) و Vanilla روی instance (به‌علاوه‌ی `update(partial)` و `destroy()`):

| متد        | توضیح                                                 |
| ---------- | ----------------------------------------------------- |
| `play()`   | پخش ویدیو (reduced motion را هم نادیده می‌گیرد)       |
| `pause()`  | توقف ویدیو                                            |
| `render()` | اندازه‌گیری دوباره‌ی فونت و تبدیل فریم فعلی همین حالا |
| `toText()` | ASCII فعلی به‌صورت متن ساده (خطوط با `\n`)            |

## توکن‌ها (CSS Variables)

مقدارها در `ascii-renderer.config.ts` (`themes`, `sizes`, `variants`) و روی root ست می‌شوند:

| توکن                               | توضیح                         | terminal                         | paper     | mono      | amber     |
| ---------------------------------- | ----------------------------- | -------------------------------- | --------- | --------- | --------- |
| `--ux-ascii-renderer-bg`           | پس‌زمینه                      | `#050a05`                        | `#f4efe1` | `#000000` | `#0d0800` |
| `--ux-ascii-renderer-fg`           | رنگ کاراکترها در حالت `mono`  | `#33ff66`                        | `#1a1a1a` | `#ffffff` | `#ffb000` |
| `--ux-ascii-renderer-border`       | رنگ حاشیه                     | `#1f4d2a`                        | `#d8cfb8` | `#333333` | `#4d3500` |
| `--ux-ascii-renderer-font-family`  | فونت monospace                | `ui-monospace, …`                |           |           |           |
| `--ux-ascii-renderer-line-height`  | ارتفاع خط (ضریب)              | `1.2`                            |           |           |           |
| `--ux-ascii-renderer-radius`       | گردی گوشه                     | `8px`                            |           |           |           |
| `--ux-ascii-renderer-font-size`    | اندازه‌ی طبیعی کاراکتر (size) | sm `8px` · md `10px` · lg `14px` |           |           |           |
| `--ux-ascii-renderer-padding`      | فاصله‌ی داخلی (size)          | sm `8px` · md `12px` · lg `16px` |           |           |           |
| `--ux-ascii-renderer-border-width` | ضخامت حاشیه (variant)         | default `0px` · outline `1px`    |           |           |           |

متغیرهای هندسی (`-aspect`، `-out-w`، `-out-h`، `-out-font-size`) را خود کامپوننت محاسبه می‌کند و توکن تم نیستند.

## توسعه

`pnpm dev` ← `http://localhost:3000/components/ascii-renderer` (تب React / Vanilla، پنل Customize، Copy). دمو یک تصویر رنگی را روی canvas می‌سازد (آفلاین کار می‌کند) و دو تصویر نمونه از picsum.photos هم دارد.

## محدودیت‌ها و نکات

- **Accessibility:** root نقش `img` با `aria-label={alt}` دارد؛ canvas و `<pre>` برای screen reader مخفی‌اند. متن کامل با `toText()` در دسترس است.
- **Reduced motion:** با `prefers-reduced-motion: reduce` ویدیو خودکار پخش نمی‌شود و فقط فریم اول نمایش داده می‌شود؛ `play()` آن را صریحاً پخش می‌کند.
- خروجی `text` همیشه تک‌رنگ است (`color` نادیده گرفته می‌شود) و عرض آن به عرض واقعی glyphها در فونت بستگی دارد (braille در بعضی فونت‌ها پهن‌تر است). `halfblock` بدون رنگ در `text` معنایی ندارد؛ برای آن `canvas` را انتخاب کن.
- حداکثر ۴۰۰ ستون/سطر؛ تبدیل ویدیو با ستون زیاد و `truecolor` روی دستگاه ضعیف سنگین است (`fps` یا `columns` را کم کن).
- کاراکترهای بلاکی (█▀▄▌▐ و ░▒▓) روی canvas به‌صورت مستطیل کشیده می‌شوند تا بدون درز کنار هم بنشینند.
- تصویر ویدیو در یک `<video>` نامرئی داخل root نگه داشته می‌شود (مرورگرها ویدیوی خارج از صفحه را گاهی متوقف می‌کنند).
