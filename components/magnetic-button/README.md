# Magnetic Button

دکمه یا لینکی که وقتی نشانگر به آن نزدیک می‌شود به سمت نشانگر «کشیده» می‌شود و بعد از دور شدن، فنری به جای خود برمی‌گردد. برچسب داخلی کمی بیشتر حرکت می‌کند (parallax)، روی hover بزرگ می‌شود و با کلیک موج (ripple) می‌سازد. دو پیاده‌سازی مستقل: [`react/`](react) (TSX) و [`vanilla/`](vanilla) (TypeScript).

## قابلیت‌ها

- عنصر بومی `<button>` (پیش‌فرض) یا `<a>` (`as: "a"` + `href`)؛ کیبورد، focus و disabled همان رفتار بومی را دارند
- حرکت با حلقه‌ی `requestAnimationFrame` و lerp مستقل از نرخ فریم؛ مقادیر به‌صورت CSS Variable (`--ux-magnetic-button-tx/-ty` و `-label-tx/-label-ty`) نوشته و با کلاس‌های `translate-*` مصرف می‌شوند
- شعاع فعال‌سازی از لبه‌ی دکمه (`radius`)، قدرت دنبال‌کردن (`strength`)، parallax برچسب (`textStrength`)، نرمی (`ease`) و مدت بازگشت (`returnDuration`، با easeOutCubic)
- listener `pointermove` فقط وقتی دکمه فعال است روی `window` وجود دارد (disabled یا reduced motion ⇒ حذف می‌شود) و در `destroy` / unmount پاک می‌شود؛ حلقه‌ی rAF فقط هنگام حرکت اجرا می‌شود؛ ورودی لمسی نادیده گرفته می‌شود
- ripple با Web Animations API از نقطه‌ی کلیک (کلیک با کیبورد ⇒ از مرکز)
- آیکون فلش انتهایی که روی hover کمی جلو می‌رود
- ۴ تم (`dark`، `light`، `brand` با گرادیان، `ghost`)، ۳ variant (`solid`، `outline`، `pill`)، ۳ اندازه
- API دستوری: `reset()`
- Vanilla: دکمه/لینک موجود داخل container را ارتقا می‌دهد (محتوایش برچسب می‌شود و در `destroy` همه‌چیز به حالت اول برمی‌گردد) یا اگر نبود، یکی با `label` می‌سازد

## فایل‌ها (برای کپی)

| نسخه    | فایل‌ها                                                            |
| ------- | ------------------------------------------------------------------ |
| React   | `react/MagneticButton.tsx` · `react/magnetic-button.config.ts`     |
| Vanilla | `vanilla/magnetic-button.ts` · `vanilla/magnetic-button.config.ts` |

هر دو فایل یک نسخه را کنار هم در پروژه‌ی خودت کپی کن (مثلاً `components/ui/`). استایل **فقط Tailwind v4** است (بدون فایل CSS).

## نیازمندی‌ها

- Tailwind CSS v4 (اگر مسیر کپی را خودکار اسکن نمی‌کند: `@source "./components/ui";`)
- React: `react` ≥ 19.3 (آخرین نسخه‌ی stable: 19.3.1؛ `ref` به‌صورت prop مستقیم)؛ آماده‌ی Next.js با `'use client'`
- Dependency اجرایی دیگری ندارد.

## استفاده

React (همه‌ی attributeهای استاندارد مثل `onClick`، `type`، `aria-*`، `target`، `rel` منتقل می‌شوند؛ `children` جای `label` را می‌گیرد):

```tsx
"use client";
import { useRef } from "react";
import { MagneticButton, type MagneticButtonHandle } from "./MagneticButton";

const btn = useRef<MagneticButtonHandle>(null);

<MagneticButton ref={btn} theme="brand" variant="pill" strength={0.5} onClick={() => go()}>
  Get started
</MagneticButton>;

<MagneticButton as="a" href="https://github.com" variant="outline" icon={false} label="GitHub" />;

// Icon-only round button
<MagneticButton label="" ariaLabel="Next" variant="pill" tokens={{ "padding-x": "12px" }} />;

btn.current?.reset();
btn.current?.element; // the <button> / <a>
```

Vanilla:

```html
<div id="cta"><button>Get started</button></div>
```

```ts
import { createMagneticButton } from "./magnetic-button";

// Enhances the existing <button>; with an empty container it creates one from `label`
const cta = createMagneticButton(document.querySelector("#cta")!, { theme: "brand" });
cta.element.addEventListener("click", () => go());
cta.update({ variant: "pill", strength: 0.6 });
cta.reset();
cta.destroy(); // removes listeners and restores the original button
```

هر container فقط یک دکمه را مدیریت می‌کند (اولین فرزند مستقیم `button`/`a`)؛ برای چند دکمه، هر کدام را در یک container جدا بگذار.

## Options

نام و معنی در دو نسخه یکسان است. اعداد خارج از بازه clamp می‌شوند؛ مقدار نامعتبر ⇒ پیش‌فرض + `console.warn`.

| Option                 | نوع                                                     | پیش‌فرض         | توضیح                                                                        |
| ---------------------- | ------------------------------------------------------- | --------------- | ---------------------------------------------------------------------------- |
| `theme`                | `'dark' \| 'light' \| 'brand' \| 'ghost'` یا آبجکت توکن | `'dark'`        | preset یا آبجکت جزئی توکن‌ها (روی `dark` ادغام می‌شود)                       |
| `variant`              | `'solid' \| 'outline' \| 'pill'`                        | `'solid'`       | ساختار ظاهری                                                                 |
| `size`                 | `'sm' \| 'md' \| 'lg'`                                  | `'md'`          | padding، اندازه‌ی فونت، فاصله و اندازه‌ی آیکون                               |
| `tokens`               | `Record<string, string>`                                | `{}`            | override توکن‌ها (آخرین لایه)                                                |
| `as`                   | `'button' \| 'a'`                                       | `'button'`      | عنصر رندرشده (Vanilla: هنگام ارتقای عنصر موجود نادیده گرفته می‌شود)          |
| `href`                 | `string`                                                | `''`            | مقصد لینک وقتی `as: 'a'`                                                     |
| `label`                | `string`                                                | `'Get started'` | متن دکمه؛ خالی = فقط آیکون                                                   |
| `ariaLabel`            | `string`                                                | `''`            | نام دسترس‌پذیر (برای دکمه‌ی فقط‌آیکون لازم است)                              |
| `icon`                 | `boolean`                                               | `true`          | فلش انتهایی                                                                  |
| `strength`             | `number` (0–1)                                          | `0.35`          | سهم فاصله‌ی نشانگر که دکمه دنبال می‌کند                                      |
| `radius`               | `number` px (0–1000)                                    | `80`            | فاصله‌ی فعال‌سازی از لبه‌ی دکمه                                              |
| `textStrength`         | `number` (0–1)                                          | `0.15`          | حرکت اضافه‌ی برچسب نسبت به دکمه (parallax)                                   |
| `ease`                 | `number` (0.01–1)                                       | `0.15`          | ضریب lerp در هر فریم (1 = چسبیده به نشانگر)                                  |
| `returnDuration`       | `number` ms (0–5000)                                    | `600`           | مدت بازگشت به حالت اول                                                       |
| `scaleOnHover`         | `number` (0.5–2)                                        | `1.05`          | مقیاس هنگام hover (1 = بدون تغییر)                                           |
| `ripple`               | `boolean`                                               | `true`          | موج از نقطه‌ی کلیک                                                           |
| `disabled`             | `boolean`                                               | `false`         | `<button disabled>` یا `<a aria-disabled tabindex=-1>` بدون href؛ حرکت متوقف |
| `respectReducedMotion` | `boolean`                                               | `true`          | با `prefers-reduced-motion` حرکت، scale، جابه‌جایی آیکون و ripple خاموش      |

در پنل Playground شعاع فعال‌سازی با کلید `magnetRadius` نمایش داده می‌شود تا با توکن `radius` (گردی گوشه) قاطی نشود؛ در کد همان option `radius` است.

فقط React: `children`، `className`، `style`، `ref` و attributeهای بومی `button`/`a`.

### API دستوری

| React (`ref`) | Vanilla (instance) | توضیح                                                       |
| ------------- | ------------------ | ----------------------------------------------------------- |
| `reset()`     | `reset()`          | برگرداندن فوری دکمه و برچسب به مرکز                         |
| `element`     | `element`          | عنصر `<button>` / `<a>`                                     |
| —             | `update(partial)`  | تغییر optionها بدون ساخت مجدد (تغییر `as` تگ را عوض می‌کند) |
| —             | `destroy()`        | حذف listenerها، rAF، DOM اضافه و بازگرداندن عنصر ارتقایافته |

## Theme Tokens

همه با پیشوند `--ux-magnetic-button-` روی خود دکمه ست می‌شوند. ترتیب ادغام: theme ← size ← variant ← `tokens`.

| توکن                                  | منبع      | توضیح                                               |
| ------------------------------------- | --------- | --------------------------------------------------- |
| `bg`                                  | theme     | رنگ پس‌زمینه                                        |
| `bg-image`                            | theme     | گرادیان پس‌زمینه (`none` یا `linear-gradient(...)`) |
| `bg-hover`                            | theme     | رنگ پس‌زمینه در hover                               |
| `bg-image-hover`                      | theme     | گرادیان در hover                                    |
| `fg` · `fg-hover`                     | theme     | رنگ متن و آیکون                                     |
| `border`                              | theme     | رنگ border                                          |
| `border-width`                        | theme     | ضخامت border                                        |
| `ring`                                | theme     | رنگ حلقه‌ی focus (`focus-visible`)                  |
| `ripple`                              | theme     | رنگ موج کلیک                                        |
| `shadow`                              | theme     | سایه                                                |
| `radius`                              | theme     | گردی گوشه (`pill` ⇒ `9999px`)                       |
| `font-family` · `font-weight`         | theme     | فونت                                                |
| `duration`                            | theme     | مدت transition رنگ، scale و آیکون                   |
| `ripple-duration`                     | theme     | مدت انیمیشن ripple                                  |
| `disabled-opacity`                    | theme     | شفافیت در حالت disabled                             |
| `icon-shift`                          | theme     | جابه‌جایی آیکون در hover                            |
| `padding-x` · `padding-y`             | size      | فاصله‌ی داخلی                                       |
| `font-size`                           | size      | اندازه‌ی فونت                                       |
| `gap`                                 | size      | فاصله‌ی برچسب و آیکون                               |
| `icon-size`                           | size      | اندازه‌ی آیکون                                      |
| `scale`                               | محاسبه‌ای | از `scaleOnHover` (در reduced motion = 1)           |
| `tx` · `ty` · `label-tx` · `label-ty` | runtime   | جابه‌جایی دکمه و برچسب (هر فریم)                    |

## محدودیت‌ها و نکات

- **Accessibility:** عنصر بومی است؛ Enter/Space، Tab و `focus-visible` بدون کد اضافه کار می‌کنند. حرکت فقط با موس/قلم است و focus کیبورد دکمه را جابه‌جا نمی‌کند. برای دکمه‌ی بدون متن `ariaLabel` (یا `aria-label`) بدهید. آیکون `aria-hidden` است.
- **Reduced motion:** با `respectReducedMotion` (پیش‌فرض) و `prefers-reduced-motion: reduce`، listener اضافه نمی‌شود و scale، جابه‌جایی آیکون و ripple خاموش‌اند؛ تغییر تنظیم سیستم در لحظه اعمال می‌شود.
- مرکز دکمه در هر حرکت با `getBoundingClientRect` منهای جابه‌جایی فعلی محاسبه می‌شود؛ بنابراین در layoutهای اسکرول‌شونده و responsive درست کار می‌کند.
- دکمه `overflow-hidden` است (برای ripple)؛ محتوای بیرون‌زده بریده می‌شود. برای جابه‌جایی آزاد، والد نباید `overflow-hidden` تنگ داشته باشد.
- رنگ‌های `bg`/`border` در `outline` و `ghost` شفاف (`#00000000`) هستند.
