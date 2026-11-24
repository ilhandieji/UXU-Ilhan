# Interactive Card

کارتی که هر محتوایی را دربر می‌گیرد و با حرکت نشانگر یک **spotlight** (نور شعاعی)، **چرخش سه‌بعدی (tilt)**، **glare** (بازتاب نور) و **درخشش حاشیه** نشان می‌دهد. دو پیاده‌سازی مستقل: [`react/`](react) (TSX) و [`vanilla/`](vanilla) (TypeScript).

## قابلیت‌ها

- سه افکت: `spotlight`، `tilt` یا هر دو (`both`)
- tilt با `maxTilt`، `perspective` و `scale`؛ glare با شفافیت قابل تنظیم؛ درخشش حاشیه که دنبال نشانگر می‌رود
- برگشت نرم به حالت استراحت با مدت `reset` هنگام خروج نشانگر
- لمسی: tilt با کشیدن انگشت و برگشت با `pointerup` / `pointercancel`؛ اختیاری: tilt با ژیروسکوپ (`deviceorientation`)
- کیبورد: فوکوس (`:focus-visible`) داخل کارت یک spotlight ثابت در مرکز نشان می‌دهد
- عملکرد: موقعیت نشانگر فقط با `requestAnimationFrame` به CSS Variableها (`--ux-interactive-card-x/-y/-rx/-ry/-s`) نوشته می‌شود؛ بدون re-render در React
- Dynamic: ۴ تم (`dark`، `glass`، `neon`، `light`)، ۳ variant، ۳ size و همه‌ی رنگ/اندازه‌ها با توکن؛ تغییر در runtime بدون ساخت مجدد

## فایل‌ها (برای کپی)

هر نسخه دو فایل دارد، بدون زیرپوشه:

| React (`react/`)             | Vanilla (`vanilla/`)         | محتوا                                                                      |
| ---------------------------- | ---------------------------- | -------------------------------------------------------------------------- |
| `InteractiveCard.tsx`        | `interactive-card.ts`        | DOM، رویدادهای pointer/focus/ژیروسکوپ، API دستوری                          |
| `interactive-card.config.ts` | `interactive-card.config.ts` | Options، پیش‌فرض‌ها، تم‌ها، sizes، variants، کلاس‌های Tailwind، اعتبارسنجی |

استایل **فقط Tailwind v4** است (بدون فایل CSS).

## نیازمندی‌ها

- Tailwind CSS v4 (اگر مسیر کپی را خودکار اسکن نمی‌کند: `@source "./components/ui";`)
- React: `react` ≥ 19.3 (آخرین نسخه‌ی stable: 19.3.1؛ `ref` به‌صورت prop مستقیم)؛ آماده‌ی Next.js با `'use client'`
- مرورگر با پشتیبانی `mask-composite` (برای حلقه‌ی حاشیه؛ همه‌ی مرورگرهای مدرن)
- Dependency اجرایی دیگر ندارد.

## استفاده

React:

```tsx
"use client";
import { useRef } from "react";
import { InteractiveCard, type InteractiveCardHandle } from "./InteractiveCard";

const card = useRef<InteractiveCardHandle>(null);

<InteractiveCard ref={card} theme="glass" maxTilt={12} className="w-80">
  <h3>Instant</h3>
  <p>Spotlight and 3D tilt that follow the pointer.</p>
</InteractiveCard>;

card.current?.reset();
```

Vanilla (فرزندان فعلی container به داخل کارت منتقل می‌شوند و با `destroy` برمی‌گردند؛ یا با `content` محتوا بدهید):

```ts
import { createInteractiveCard } from "./interactive-card";

const card = createInteractiveCard(document.querySelector("#feature")!, { theme: "neon" });
card.update({ effect: "spotlight", spotlightSize: 480 });
card.reset();
card.destroy();

// Explicit content (string = textContent, never innerHTML)
createInteractiveCard(el, { content: "Hello" });
```

## Options

نام و معنی در دو نسخه یکسان است. اعداد خارج از بازه clamp می‌شوند؛ مقدار نامعتبر ⇒ پیش‌فرض + `console.warn`.

| Option                 | نوع                                                    | پیش‌فرض     | توضیح                                                                              |
| ---------------------- | ------------------------------------------------------ | ----------- | ---------------------------------------------------------------------------------- |
| `theme`                | `'dark' \| 'glass' \| 'neon' \| 'light'` یا آبجکت توکن | `'dark'`    | preset یا آبجکت جزئی توکن‌ها (`{ bg: '#000', spotlight: '#0ff' }`)                 |
| `variant`              | `'default' \| 'outline' \| 'elevated'`                 | `'default'` | حاشیه‌ی ۱px / پس‌زمینه‌ی شفاف بدون سایه / بدون حاشیه با سایه‌ی عمیق                |
| `size`                 | `'sm' \| 'md' \| 'lg'`                                 | `'md'`      | padding، اندازه‌ی فونت و radius                                                    |
| `effect`               | `'spotlight' \| 'tilt' \| 'both'`                      | `'both'`    | افکت‌های فعال                                                                      |
| `maxTilt`              | `number` درجه (0–45)                                   | `10`        | بیشترین چرخش                                                                       |
| `perspective`          | `number` px (100–5000)                                 | `1000`      | فاصله‌ی دید؛ کمتر = سه‌بعدی‌تر                                                     |
| `scale`                | `number` (0.5–2)                                       | `1.02`      | بزرگ‌نمایی هنگام tilt                                                              |
| `glare`                | `boolean`                                              | `true`      | بازتاب نور همراه tilt                                                              |
| `glareOpacity`         | `number` (0–1)                                         | `0.15`      | شفافیت glare                                                                       |
| `spotlightSize`        | `number` px (20–2000)                                  | `360`       | قطر spotlight                                                                      |
| `spotlightOpacity`     | `number` (0–1)                                         | `0.22`      | شفافیت spotlight                                                                   |
| `borderGlow`           | `boolean`                                              | `true`      | روشن شدن حاشیه نزدیک نشانگر (در variant بدون حاشیه دیده نمی‌شود)                   |
| `reset`                | `number` ms (0–5000)                                   | `500`       | مدت برگشت به حالت استراحت                                                          |
| `gyroscope`            | `boolean`                                              | `false`     | tilt با `deviceorientation` در دستگاه‌های لمسی                                     |
| `focusable`            | `boolean`                                              | `false`     | خود کارت با Tab فوکوس بگیرد (وقتی فرزند قابل فوکوس ندارد)                          |
| `disabled`             | `boolean`                                              | `false`     | غیرفعال کردن همه‌ی افکت‌ها                                                         |
| `respectReducedMotion` | `boolean`                                              | `true`      | با `prefers-reduced-motion`: بدون tilt/scale/glare؛ spotlight ثابت در مرکز با fade |

فقط React: `children`، `className`، `style`، `ref`. فقط Vanilla: `content` (`string \| Node`)، `className`.

### API دستوری

| React (`ref`) | Vanilla (instance) | توضیح                                              |
| ------------- | ------------------ | -------------------------------------------------- |
| `reset()`     | `reset()`          | برگشت فوری (با ease) به حالت استراحت               |
| —             | `update(partial)`  | تغییر optionها بدون از دست رفتن state              |
| —             | `element`          | عنصر ریشه                                          |
| —             | `destroy()`        | حذف DOM و listenerها؛ بازگرداندن فرزندان container |

## Theme Tokens

همه با پیشوند `--ux-interactive-card-` روی عنصر ریشه ست می‌شوند:

| توکن                | منبع               | مصرف                                          |
| ------------------- | ------------------ | --------------------------------------------- |
| `bg`                | theme / variant    | پس‌زمینه‌ی کارت                               |
| `fg`                | theme              | رنگ متن                                       |
| `border`            | theme              | رنگ حلقه‌ی حاشیه                              |
| `spotlight`         | theme              | رنگ spotlight، درخشش حاشیه و حلقه‌ی فوکوس     |
| `glare`             | theme              | رنگ glare                                     |
| `shadow`            | theme / variant    | سایه در حالت استراحت                          |
| `shadow-hover`      | theme / variant    | سایه در حالت فعال                             |
| `blur`              | theme              | `backdrop-blur` (تم `glass`: `16px`)          |
| `font-family`       | theme              | فونت                                          |
| `font-size`         | size               | اندازه‌ی فونت                                 |
| `padding`           | size               | فاصله‌ی داخلی محتوا                           |
| `radius`            | size               | گردی گوشه                                     |
| `border-width`      | variant            | ضخامت حلقه‌ی حاشیه                            |
| `perspective`       | option             | `perspective()` در transform                  |
| `spotlight-size`    | option             | قطر gradient                                  |
| `spotlight-opacity` | option             | شفافیت لایه‌ی spotlight                       |
| `glare-opacity`     | option             | شفافیت لایه‌ی glare                           |
| `x` / `y`           | runtime (روی کارت) | موقعیت نشانگر (درصد)                          |
| `rx` / `ry` / `s`   | runtime (روی کارت) | چرخش و scale                                  |
| `duration`          | runtime (روی کارت) | `120ms` هنگام دنبال کردن، `reset` هنگام برگشت |

## محدودیت‌ها و نکات

- **Accessibility:** لایه‌های تزئینی `aria-hidden` هستند و رویدادها محتوا را تغییر نمی‌دهند. فوکوس با کیبورد spotlight ثابت نشان می‌دهد (بدون tilt). کارت به‌طور پیش‌فرض فوکوس نمی‌گیرد؛ برای کارت بدون لینک/دکمه `focusable` را فعال کنید. `disabled` روی ریشه `aria-disabled` می‌گذارد.
- **Reduced motion:** با `respectReducedMotion` (پیش‌فرض) و `prefers-reduced-motion: reduce`، چرخش، scale و glare حذف می‌شوند و spotlight فقط در مرکز fade می‌شود. تغییر تنظیم سیستم بلافاصله اعمال می‌شود.
- **ژیروسکوپ:** فقط روی دستگاه‌های `pointer: coarse` و با پشتیبانی `DeviceOrientationEvent`. در iOS اجازه با اولین لمس کارت درخواست می‌شود (`requestPermission`). فرض بر نگه داشتن گوشی با زاویه‌ی حدود ۴۵ درجه است.
- **لمسی:** مرورگر ممکن است هنگام اسکرول `pointercancel` بفرستد؛ کارت در این حالت به استراحت برمی‌گردد.
- ابعاد ریشه با `className` تعیین می‌شود (`block`)؛ کارت داخلی `h-full` است تا در grid هم‌ارتفاع شود.
- `transition` روی transform و سایه است؛ موقعیت نشانگر از ریشه‌ی بدون transform اندازه‌گیری می‌شود تا هنگام چرخش لرزش ایجاد نشود.
