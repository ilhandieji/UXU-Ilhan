# Marquee

نوار متحرک بی‌پایان (ticker) برای متن یا هر المانی؛ محتوا به اندازه‌ی لازم تکثیر می‌شود تا نوار بدون درز و همیشه پر باشد. دو پیاده‌سازی مستقل: [`react/`](react) (TSX) و [`vanilla/`](vanilla) (TypeScript).

## قابلیت‌ها

- محتوا از `items` (رشته‌ها) یا children (React) / فرزندان فعلی container (Vanilla)
- چهار جهت `left` / `right` / `up` / `down` (عمودی از روی جهت تشخیص داده می‌شود)
- حلقه‌ی بی‌درز با اندازه‌گیری واقعی محتوا (`ResizeObserver`) و تکثیر خودکار؛ حداقل تعداد کپی با `repeat`
- انیمیشن با `requestAnimationFrame` که فقط CSS variable `--ux-marquee-offset` را می‌نویسد (کلاس `translate-x-(--ux-marquee-offset)`؛ بدون keyframes و فایل CSS)
- توقف/شروع نرم (شتاب و ترمز)، توقف هنگام hover و focus، `reverseOnHover`
- `draggable`: کشیدن با موس/لمس برای جابه‌جایی، با momentum هنگام رها کردن (کلیک بعد از کشیدن لغو می‌شود)
- محو شدن لبه‌ها با mask (`fade`، `fadeSize`)
- جداکننده بین آیتم‌ها (`separator`، مثلاً `✦`)
- ۱ تا ۳ ردیف (`rows`) که یکی‌درمیان خلاف هم حرکت می‌کنند و هر کدام از آیتم دیگری شروع می‌شود
- دکمه‌ی توقف/پخش (WCAG 2.2.2) و API دستوری `pause()` / `play()` / `toggle()` / `setSpeed(n)`
- توقف خودکار وقتی نوار خارج از دید است (`IntersectionObserver`) یا تب مخفی است
- ۴ تم (`dark`، `light`، `neon`، `outline`)، ۳ variant (`plain`، `pill`، `card`) و ۳ سایز
- تغییر همه‌ی optionها در runtime بدون ساخت مجدد و بدون از دست رفتن موقعیت/وضعیت توقف

## فایل‌ها (برای کپی)

| React (`react/`)    | Vanilla (`vanilla/`) | محتوا                                                                       |
| ------------------- | -------------------- | --------------------------------------------------------------------------- |
| `Marquee.tsx`       | `marquee.ts`         | ساخت DOM، چرخه‌ی عمر، API دستوری                                            |
| `marquee.config.ts` | `marquee.config.ts`  | Options، پیش‌فرض‌ها، تم‌ها، sizes، variants، کلاس‌های Tailwind، اعتبارسنجی  |
| `marquee.engine.ts` | `marquee.engine.ts`  | موتور انیمیشن، اندازه‌گیری، hover/focus/drag (بدون فریم‌ورک؛ دو نسخه یکسان) |

موتور در فایل هم‌سطح جداست چون منطق حلقه، اندازه‌گیری و drag مستقل از فریم‌ورک است؛ هر نسخه کپی خودش را دارد. استایل **فقط Tailwind v4** است (بدون فایل CSS).

## نیازمندی‌ها

- Tailwind CSS v4 (اگر مسیر کپی را خودکار اسکن نمی‌کند: `@source "./components/ui";`)
- React: `react` ≥ 19.3 (آخرین نسخه‌ی stable: 19.3.1؛ `ref` به‌صورت prop مستقیم)؛ آماده‌ی Next.js با `'use client'`
- مرورگر با `ResizeObserver`، `IntersectionObserver` و `inert` (همه‌ی مرورگرهای مدرن)
- Dependency اجرایی دیگر ندارد.

## استفاده

React:

```tsx
"use client";
import { useRef } from "react";
import { Marquee, type MarqueeHandle } from "./Marquee";

const ticker = useRef<MarqueeHandle>(null);

<Marquee ref={ticker} items={["BUILD", "SHIP", "REPEAT"]} variant="plain" separator="✦" />

<Marquee direction="right" rows={2} label="Tech stack" draggable>
  <a href="/react">React</a>
  <a href="/ts">TypeScript</a>
  <img src="/logo.svg" alt="Logo" />
</Marquee>;

ticker.current?.setSpeed(120);
```

هر فرزند سطح اول یک آیتم می‌شود (داخل یک `div` با کلاس variant).

Vanilla (فرزندان فعلی container آیتم‌ها می‌شوند، مگر اینکه `items` داده شود):

```html
<div id="stack"><span>React</span><span>TypeScript</span><span>Tailwind</span></div>
```

```ts
import { createMarquee } from "./marquee";

const marquee = createMarquee(document.querySelector("#stack")!, { direction: "right" });
marquee.update({ speed: 90, theme: "neon", separator: "◆" });
marquee.pause();
marquee.destroy(); // the original children go back into #stack
```

## Options

نام و معنی در دو نسخه یکسان است. مقادیر عددی خارج از بازه clamp می‌شوند؛ مقدار نامعتبر ⇒ پیش‌فرض + `console.warn`.

| Option                 | نوع                                   | پیش‌فرض               | توضیح                                                        |
| ---------------------- | ------------------------------------- | --------------------- | ------------------------------------------------------------ |
| `theme`                | نام تم یا آبجکت توکن‌ها               | `'dark'`              | `dark` / `light` / `neon` / `outline` یا `{ bg: '#000', … }` |
| `variant`              | `'plain' \| 'pill' \| 'card'`         | `'pill'`              | فقط متن / آیتم در pill / آیتم در کارت با سایه                |
| `size`                 | `'sm' \| 'md' \| 'lg'`                | `'md'`                | اندازه‌ی فونت، padding، gap، ارتفاع حالت عمودی               |
| `items`                | `string[]`                            | `[]`                  | آیتم‌های متنی (با `textContent`)؛ خالی = children            |
| `speed`                | `number` px/s (0–5000)                | `60`                  | سرعت حرکت                                                    |
| `direction`            | `'left' \| 'right' \| 'up' \| 'down'` | `'left'`              | جهت؛ `up`/`down` نوار را عمودی می‌کند                        |
| `pauseOnHover`         | `boolean`                             | `true`                | توقف نرم هنگام hover                                         |
| `pauseOnFocus`         | `boolean`                             | `true`                | توقف وقتی focus داخل نوار است                                |
| `gap`                  | `number` (px) یا طول CSS              | `''`                  | فاصله‌ی آیتم‌ها؛ خالی = توکن `gap` سایز                      |
| `fade`                 | `boolean`                             | `true`                | محو کردن لبه‌ها با mask                                      |
| `fadeSize`             | `number` px (0–1000)                  | `48`                  | پهنای هر لبه‌ی محو                                           |
| `repeat`               | `number` (2–50)                       | `2`                   | حداقل تعداد کپی محتوا (بیشتر به‌صورت خودکار)                 |
| `reverseOnHover`       | `boolean`                             | `false`               | برعکس شدن جهت هنگام hover (وقتی `pauseOnHover` خاموش است)    |
| `draggable`            | `boolean`                             | `false`               | کشیدن/swipe برای جابه‌جایی با momentum                       |
| `paused`               | `boolean`                             | `false`               | وضعیت توقف؛ تغییرش با دکمه و `pause()`/`play()` هم‌گام است   |
| `respectReducedMotion` | `boolean`                             | `true`                | با `prefers-reduced-motion` نوار ثابت و قابل اسکرول می‌شود   |
| `separator`            | `string`                              | `''`                  | متن جداکننده بین آیتم‌ها (`aria-hidden`)                     |
| `rows`                 | `number` (1–3)                        | `1`                   | تعداد ردیف؛ ردیف‌های زوج خلاف جهت                            |
| `label`                | `string`                              | `'Scrolling content'` | `aria-label` ناحیه (`<section>`)                             |
| `controls`             | `boolean`                             | `true`                | نمایش دکمه‌ی توقف/پخش                                        |
| `pauseLabel`           | `string`                              | `'Pause animation'`   | برچسب دکمه در حال پخش                                        |
| `playLabel`            | `string`                              | `'Play animation'`    | برچسب دکمه در حال توقف                                       |

فقط React: `children`، `className`، `style`، `ref`.

### API دستوری

| React (`ref`) | Vanilla (instance) | توضیح                                                     |
| ------------- | ------------------ | --------------------------------------------------------- |
| `pause()`     | `pause()`          | توقف نرم                                                  |
| `play()`      | `play()`           | ادامه                                                     |
| `toggle()`    | `toggle()`         | جابه‌جایی بین توقف و پخش                                  |
| `setSpeed(n)` | `setSpeed(n)`      | سرعت جدید (px/s) تا وقتی option `speed` دوباره تغییر کند  |
| —             | `paused`           | وضعیت فعلی توقف                                           |
| —             | `update(partial)`  | تغییر optionها بدون از دست رفتن state                     |
| —             | `destroy()`        | حذف DOM، listenerها و observerها؛ بازگرداندن فرزندان اصلی |

## Theme Tokens

همه به‌صورت `--ux-marquee-<token>` روی root ست می‌شوند.

| Token          | منبع    | توضیح                                    |
| -------------- | ------- | ---------------------------------------- |
| `bg`           | theme   | پس‌زمینه‌ی نوار                          |
| `fg`           | theme   | رنگ متن                                  |
| `separator`    | theme   | رنگ جداکننده                             |
| `border`       | theme   | رنگ قاب نوار                             |
| `border-width` | theme   | ضخامت قاب نوار                           |
| `item-bg`      | theme   | پس‌زمینه‌ی آیتم (pill/card) و دکمه       |
| `item-border`  | theme   | قاب آیتم و دکمه                          |
| `item-shadow`  | theme   | سایه‌ی کارت (variant `card`)             |
| `font-family`  | theme   | فونت                                     |
| `font-weight`  | theme   | وزن فونت                                 |
| `radius`       | theme   | گردی گوشه‌ی نوار                         |
| `font-size`    | size    | اندازه‌ی فونت                            |
| `padding`      | size    | padding نوار                             |
| `gap`          | size    | فاصله‌ی آیتم‌ها و ردیف‌ها                |
| `height`       | size    | ارتفاع نوار در حالت عمودی                |
| `control-size` | size    | اندازه‌ی دکمه‌ی توقف/پخش                 |
| `item-padding` | variant | padding آیتم (em، تابع font-size)        |
| `item-radius`  | variant | گردی آیتم                                |
| `fade-size`    | option  | از `fadeSize`                            |
| `offset`       | engine  | جابه‌جایی فعلی هر track (هر فریم، داخلی) |

ترتیب ادغام: theme ← size ← variant ← آبجکت `theme` کاربر ← `gap` / `fadeSize`.

## محدودیت‌ها و نکات

- **Accessibility:** ریشه یک `<section aria-label>` است. فقط کپی اول ردیف اول در دسترس screen reader و Tab است؛ کپی‌ها و ردیف‌های دیگر `aria-hidden="true"` و `inert` دارند. جداکننده‌ها `aria-hidden` هستند. دکمه‌ی توقف/پخش (پیش‌فرض روشن) برای WCAG 2.2.2 است؛ focus داخل نوار هم آن را متوقف می‌کند.
- **Reduced motion:** با `respectReducedMotion` (پیش‌فرض) و `prefers-reduced-motion: reduce`، انیمیشن، drag و دکمه حذف می‌شوند، فقط یک کپی می‌ماند و نوار به‌صورت native اسکرول می‌شود. تغییر تنظیم سیستم در لحظه اعمال می‌شود.
- حالت عمودی ارتفاع ثابت دارد (توکن `height`)؛ ردیف‌ها کنار هم قرار می‌گیرند.
- Vanilla: کپی‌ها با `cloneNode` ساخته می‌شوند، پس listenerهای فرزندان اصلی فقط روی کپی اول (که خود node اصلی است) کار می‌کنند؛ برای کلیک روی آیتم‌ها از event delegation روی container استفاده کنید.
- رنگ `black` در کلاس mask فقط stop آلفای mask است و دیده نمی‌شود.
- با `speed: 0` حلقه‌ی انیمیشن کاملاً متوقف می‌شود (هزینه‌ی CPU صفر)؛ drag همچنان کار می‌کند.
