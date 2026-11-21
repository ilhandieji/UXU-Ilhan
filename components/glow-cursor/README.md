# Glow Cursor

نوری که از نشانگر موس جاری می‌شود، در یک شبیه‌سازی سیال WebGL2 در هوا پخش می‌شود و هنگام محو شدن «سرد» می‌شود (از رنگ اصلی به رنگ دوم). پورت کامل [Glow Cursor در React Bits](https://reactbits.dev/animations/glow-cursor) (ساخته‌ی David Haz) با قابلیت‌های اضافه. دو پیاده‌سازی مستقل: [`react/`](react) (TSX) و [`vanilla/`](vanilla) (TypeScript).

## قابلیت‌ها

- همه‌ی رفتار نسخه‌ی اصلی: شبیه‌سازی سیال (advection با MacCormack، حل فشار ۲۰ گامی)، dye سه‌کاناله (energy / heat / gas)، bloom پنج‌سطحی، grain، emitter فنری، burst با کلیک، حالت ink برای پس‌زمینه‌ی روشن، `prefers-reduced-motion`، توقف خودکار هنگام خارج از دید / تب مخفی / سکون، سقف DPR
- ۱۱ preset: شش preset اصلی (comet، ember، aurora، smoke، ion، silk) + پنج preset جدید (neon، plasma، gold، toxic، ink)
- **اضافه‌ها:** `colorMode` (solid / rainbow / velocity)، `flow`، burst قابل تنظیم (`burstJets`، `burstSize`)، مسیر خودکار `idle`، `hideCursor`، `paused`، `mode: 'auto'`، سه variant (`contained` / `overlay` / `fixed` برای کل صفحه)، `size`، `opacity`، رنگ از CSS variable (`color: 'var(--brand)'`)، API دستوری (`burst()`، `clear()`)، `onBurst`، `onUnsupported` و `fallback`
- تغییر همه‌ی optionها در runtime بدون ساخت مجدد WebGL context (فقط تغییر `quality` یا اندازه، تکسچرها را دوباره می‌سازد)

## فایل‌ها (برای کپی)

هر نسخه سه فایل دارد (موتور و شیدرها چون از ۳۰۰ خط بیشترند جدا شده‌اند)، بدون زیرپوشه:

| React (`react/`)        | Vanilla (`vanilla/`)    | محتوا                                                                         |
| ----------------------- | ----------------------- | ----------------------------------------------------------------------------- |
| `GlowCursor.tsx`        | `glow-cursor.ts`        | DOM، چرخه‌ی عمر، API دستوری                                                   |
| `glow-cursor.config.ts` | `glow-cursor.config.ts` | Options، پیش‌فرض‌ها، presetها، sizes، variants، کلاس‌های Tailwind، اعتبارسنجی |
| `glow-cursor.engine.ts` | `glow-cursor.engine.ts` | شیدرها و شبیه‌سازی WebGL2 (بدون وابستگی به فریم‌ورک؛ دو نسخه یکسان‌اند)       |

استایل **فقط Tailwind v4** است (بدون فایل CSS).

## نیازمندی‌ها

- Tailwind CSS v4 (اگر مسیر کپی را خودکار اسکن نمی‌کند: `@source "./components/ui";`)
- React: `react` ≥ 19 (prop `ref` به‌صورت مستقیم)؛ آماده‌ی Next.js با `'use client'`
- مرورگر با WebGL2 و `EXT_color_buffer_float` (همه‌ی مرورگرهای مدرن)؛ در غیر این صورت چیزی رسم نمی‌شود و `onUnsupported` / `fallback` اجرا می‌شود
- Dependency اجرایی دیگر ندارد.

## استفاده

کامپوننت والدش را پر می‌کند (`h-full w-full`)؛ به والد ارتفاع بدهید.

React:

```tsx
"use client";
import { useRef } from "react";
import { GlowCursor, type GlowCursorHandle } from "./GlowCursor";

const glow = useRef<GlowCursorHandle>(null);

<section className="h-screen bg-black">
  <GlowCursor ref={glow} theme="aurora" idle colorMode="velocity">
    <h1>Move and click</h1>
  </GlowCursor>
</section>;

glow.current?.burst(); // burst at the center
```

افکت سراسری برای کل سایت (در layout):

```tsx
<GlowCursor variant="fixed" theme="neon" />
```

Vanilla (نور به‌صورت یک لایه داخل container اضافه می‌شود و فرزندان قبلی سر جایشان می‌مانند):

```ts
import { createGlowCursor } from "./glow-cursor";

const glow = createGlowCursor(document.querySelector("#hero")!, { theme: "ember" });
glow.update({ colorMode: "rainbow", linger: 2.4 });
glow.burst(120, 80);
glow.destroy();
```

## Options

نام و معنی در دو نسخه یکسان است. مقادیر عددی خارج از بازه clamp می‌شوند؛ مقدار نامعتبر ⇒ پیش‌فرض + `console.warn`.

| Option                 | نوع                                      | پیش‌فرض       | توضیح                                                                   |
| ---------------------- | ---------------------------------------- | ------------- | ----------------------------------------------------------------------- |
| `theme`                | نام preset یا `Partial<GlowCursorLight>` | `'comet'`     | preset یا آبجکت مقادیر نور                                              |
| `color`                | `string`                                 | از preset     | رنگ نور تازه (هر رنگ CSS یا `var(--x)`)                                 |
| `secondaryColor`       | `string`                                 | از preset     | رنگی که نور به آن سرد می‌شود؛ خالی = سایه‌ی عمیق‌تر `color`             |
| `intensity`            | `number` (0–10)                          | از preset     | روشنایی                                                                 |
| `trailWidth`           | `number` px (0.5–64)                     | از preset     | ضخامت نور                                                               |
| `linger`               | `number` s (0.1–10)                      | از preset     | مدت ماندن نور                                                           |
| `glow`                 | `number` (0–5)                           | از preset     | شدت هاله (bloom)                                                        |
| `hotspot`              | `number` (0–5)                           | از preset     | هسته‌ی سفید داغ نزدیک cursor                                            |
| `followSpeed`          | `number` (0–1)                           | از preset     | میزان چسبیدن نور به cursor                                              |
| `grain`                | `number` (0–2)                           | از preset     | دانه‌ی فیلم                                                             |
| `variant`              | `'contained' \| 'overlay' \| 'fixed'`    | `'contained'` | زیر children / روی children / کل viewport                               |
| `size`                 | `'sm' \| 'md' \| 'lg'`                   | `'md'`        | ضریب پهنای trail و burst (0.7 / 1 / 1.6)                                |
| `mode`                 | `'dark' \| 'light' \| 'auto'`            | `'dark'`      | نور افزایشی / جوهر روی پس‌زمینه‌ی روشن / بر اساس `prefers-color-scheme` |
| `quality`              | `'low' \| 'medium' \| 'high'`            | `'high'`      | رزولوشن شبیه‌سازی                                                       |
| `colorMode`            | `'solid' \| 'rainbow' \| 'velocity'`     | `'solid'`     | رنگ ثابت / چرخش hue در زمان / تغییر hue با سرعت حرکت                    |
| `hueSpeed`             | `number` (0–720)                         | `40`          | درجه بر ثانیه (rainbow) یا ضریب جابه‌جایی hue (velocity)                |
| `flow`                 | `number` (0–3)                           | `0.75`        | میزان هل دادن هوا توسط trail (0 = بدون چرخش)                            |
| `clickBurst`           | `boolean`                                | `true`        | انفجار نور با کلیک                                                      |
| `burstJets`            | `number` (1–24)                          | `6`           | تعداد شاخه‌های burst                                                    |
| `burstSize`            | `number` (0.1–5)                         | `1`           | اندازه و قدرت burst                                                     |
| `idle`                 | `boolean`                                | `false`       | وقتی cursor بیرون یا ساکن است، نور روی مسیر لیساژو حرکت می‌کند          |
| `idleDelay`            | `number` s (0–60)                        | `2`           | مدت سکون پیش از شروع مسیر idle                                          |
| `hideCursor`           | `boolean`                                | `false`       | مخفی‌کردن cursor بومی (در `fixed` برای کل صفحه)                         |
| `respectReducedMotion` | `boolean`                                | `true`        | با `prefers-reduced-motion` سیال غیرفعال و فقط محو شدن باقی می‌ماند     |
| `enabled`              | `boolean`                                | `true`        | `false` = نور جدید رسم نمی‌شود، نور فعلی محو می‌شود                     |
| `paused`               | `boolean`                                | `false`       | فریز کامل شبیه‌سازی                                                     |
| `blendMode`            | `string`                                 | `'auto'`      | `mix-blend-mode` کانواس؛ auto = `screen` (dark) / `normal` (light)      |
| `opacity`              | `number` (0–1)                           | `1`           | شفافیت لایه                                                             |
| `zIndex`               | `number`                                 | `50`          | z-index در `overlay` و `fixed`                                          |
| `maxDevicePixelRatio`  | `number` (0.5–4)                         | `2`           | سقف تراکم پیکسل کانواس                                                  |
| `onBurst`              | `(x, y) => void`                         | —             | بعد از هر burst                                                         |
| `onUnsupported`        | `() => void`                             | —             | وقتی WebGL2 در دسترس نیست                                               |

فقط React: `children`، `fallback` (به‌جای نور وقتی پشتیبانی نمی‌شود)، `className`، `style`، `ref`.

### API دستوری

| React (`ref`)   | Vanilla (instance) | توضیح                                         |
| --------------- | ------------------ | --------------------------------------------- |
| `burst(x?, y?)` | `burst(x?, y?)`    | burst در مختصات px نسبت به کادر؛ پیش‌فرض مرکز |
| `clear()`       | `clear()`          | پاک‌کردن فوری نور و هوا                       |
| —               | `update(partial)`  | تغییر optionها بدون از دست رفتن state         |
| —               | `supported`        | `false` اگر WebGL2 در دسترس نباشد             |
| —               | `destroy()`        | حذف کانواس، listenerها و منابع GPU            |

## Presetها (`themes`)

| Preset   | color     | secondaryColor | تفاوت با comet                        |
| -------- | --------- | -------------- | ------------------------------------- |
| `comet`  | `#5f8bff` | خودکار         | پیش‌فرض                               |
| `ember`  | `#ffb347` | `#ff3b1a`      | linger 1.1                            |
| `aurora` | `#5effc4` | `#2a8cff`      | linger 2.4، glow 1.5                  |
| `smoke`  | `#ffffff` | `#9a9aa8`      | intensity 0.9، linger 2.6، glow 0.6   |
| `ion`    | `#7ff3ff` | `#3a5bff`      | intensity 1.6، trailWidth 2، linger 1 |
| `silk`   | `#5f8bff` | خودکار         | trailWidth 7، linger 2، glow 1.6      |
| `neon`   | `#ff3df2` | `#7a2bff`      | intensity 1.5، glow 1.6               |
| `plasma` | `#ff6ad5` | `#3cf0ff`      | trailWidth 4، linger 1.8، glow 1.4    |
| `gold`   | `#ffd36b` | `#b8641a`      | linger 1.6، hotspot 1.1               |
| `toxic`  | `#b6ff3d` | `#1fbf5a`      | grain 0.15، followSpeed 0.4           |
| `ink`    | `#1b1b2f` | `#4a3aff`      | برای `mode: 'light'`                  |

## Theme Tokens

مقادیر نور uniformهای WebGL هستند (نه CSS)؛ فقط لایه‌ی کانواس با CSS Variable تنظیم می‌شود (موتور آن‌ها را روی کانواس ست می‌کند):

| توکن                       | منبع                            | مصرف                                           |
| -------------------------- | ------------------------------- | ---------------------------------------------- |
| `--ux-glow-cursor-blend`   | `blendMode` (auto بر اساس mode) | `[mix-blend-mode:var(--ux-glow-cursor-blend)]` |
| `--ux-glow-cursor-opacity` | `opacity`                       | `opacity-(--ux-glow-cursor-opacity)`           |
| `--ux-glow-cursor-z`       | `zIndex`                        | `z-(--ux-glow-cursor-z)` (overlay/fixed)       |

## نگاشت به props اصلی React Bits

همه‌ی props اصلی با همان نام و پیش‌فرض وجود دارند، به‌جز:

- `theme: 'dark' | 'light'` ⇒ **`mode`** (چون در این کتابخانه `theme` = preset است) — مقدار `auto` هم اضافه شده
- مقادیر نور (`color`، `linger`، …) هم مستقیم و هم از طریق `theme` قابل تنظیم‌اند

## محدودیت‌ها و نکات فنی

- در `colorMode` غیر از `solid`، رنگ کل نور موجود با هم تغییر می‌کند (رنگ uniform سراسری است، نه ذخیره‌شده در هر پیکسل).
- هر نمونه یک WebGL context دارد؛ مرورگرها تعداد context هم‌زمان را محدود می‌کنند (معمولاً ۱۶)، پس برای کل سایت یک نمونه‌ی `fixed` بهتر از چند نمونه است.
- رویدادهای pointer روی `window` گوش داده می‌شوند و کانواس `pointer-events-none` است؛ پس روی تعامل با محتوا اثری ندارد.
- رنگ `var(--x)` هنگام تغییر رنگ resolve می‌شود؛ اگر خود متغیر CSS بعداً عوض شد، `update` را دوباره صدا بزنید.
- Vanilla کلاس‌های `relative isolate` را (اگر نداشت) به container اضافه و در `destroy` حذف می‌کند.
