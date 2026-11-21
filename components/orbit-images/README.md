# Orbit Images

تصاویری که روی یک مسیر (بیضی، دایره، ستاره، قلب، بی‌نهایت، موج، …) می‌چرخند، با حس عمق، کشیدن و پرتاب، **چرخاندن با scroll موس**، اتصال به اسکرول صفحه، کج‌شدن سه‌بعدی و ۱۱ preset. پورت کامل [Orbit Images در React Bits](https://reactbits.dev/animations/orbit-images) (ساخته‌ی Dominik Koch) با قابلیت‌های اضافه. دو پیاده‌سازی مستقل: [`react/`](react) (TSX) و [`vanilla/`](vanilla) (TypeScript).

## قابلیت‌ها

- همه‌ی رفتار نسخه‌ی اصلی: ۹ شکل + مسیر دلخواه SVG، depth (آیتم‌های عقب کوچک‌تر و کم‌رنگ‌تر، عبور از پشت/جلوی `centerContent`)، easing هر دور، کند شدن نرم هنگام hover، بزرگ‌شدن آیتم، کشیدن/swipe افقی با پرتاب و اینرسی، کلیک برای آوردن آیتم به جلو، intro (پخش از جلو + رسم خط)، `prefers-reduced-motion`، توقف خارج از دید، نسبت ابعاد خودکار
- **اضافه‌ها:**
  - **چرخ موس / ترک‌پد** (`wheel`) با اینرسی، افقی و عمودی
  - **اتصال به اسکرول صفحه** (`scrollLink`)
  - **Touch:** swipe و پرتاب + نگه‌داشتن انگشت = کند شدن مثل hover (`touchHold`)
  - **کج‌شدن سه‌بعدی** به سمت نشانگر (`tilt`)
  - **کیبورد:** ←/→ برای قبلی/بعدی
  - **API دستوری:** `next()`، `prev()`، `goTo(index)` و رویداد `onActiveChange`
  - **Spotlight** (خاکستری شدن آیتم‌های دور از جلو) و **blur عقب**
  - ثابت‌های عمق به‌صورت option (`frontGrow`، `backShrink`، `backDim`)
  - **Caption** با چهار حالت نمایش
  - شکل‌های جدید `polygon` و `flower`؛ `waveCount`، `gap`، `startOffset`
  - ۴ variant برای آیتم: `rounded`، `circle`، `polaroid`، `glass`
- تغییر همه‌ی optionها در runtime بدون remount

## فایل‌ها (برای کپی)

| React (`react/`)         | Vanilla (`vanilla/`)     | محتوا                                                                               |
| ------------------------ | ------------------------ | ----------------------------------------------------------------------------------- |
| `OrbitImages.tsx`        | `orbit-images.ts`        | ساخت DOM (SVG مسیر، آیتم‌ها، محتوای مرکز)                                           |
| `orbit-images.config.ts` | `orbit-images.config.ts` | Options، پیش‌فرض‌ها، presetها، sizes، variants، کلاس‌های Tailwind، اعتبارسنجی       |
| `orbit-images.engine.ts` | `orbit-images.engine.ts` | مولد مسیرها، انیمیشن و همه‌ی تعامل‌ها (بدون وابستگی به فریم‌ورک؛ دو نسخه یکسان‌اند) |

استایل **فقط Tailwind v4** است (بدون فایل CSS). transform/opacity/z-index/filter آیتم‌ها هر فریم توسط engine نوشته می‌شوند (مثل نسخه‌ی اصلی).

## نیازمندی‌ها

- Tailwind CSS v4 (اگر مسیر کپی را خودکار اسکن نمی‌کند: `@source "./components/ui";`)
- React: `react` ≥ 19.3 (آخرین نسخه‌ی stable: 19.3.1؛ `ref` به‌صورت prop مستقیم)؛ آماده‌ی Next.js با `'use client'`
- تصاویر نمونه‌ی `defaults.images` از picsum.photos هستند؛ با تصاویر خودتان جایگزین کنید
- Dependency اجرایی دیگر ندارد.

## استفاده

React:

```tsx
"use client";
import { useRef } from "react";
import { OrbitImages, type OrbitImagesHandle } from "./OrbitImages";

const orbit = useRef<OrbitImagesHandle>(null);

<OrbitImages
  ref={orbit}
  theme="carousel"
  images={["/a.jpg", "/b.jpg", { src: "/c.jpg", alt: "Team", caption: "Team" }]}
  wheel="hover"
  captions="front"
  centerContent={<h2>Moments</h2>}
  onActiveChange={(index) => setActive(index)}
/>;

orbit.current?.next();
```

Vanilla:

```ts
import { createOrbitImages } from "./orbit-images";

const orbit = createOrbitImages(document.querySelector("#gallery")!, {
  theme: "ribbon",
  images: ["/a.jpg", "/b.jpg", "/c.jpg"],
  centerContent: "Moments", // or a DOM node
});
orbit.update({ variant: "polaroid", tilt: 12 });
orbit.goTo(2);
orbit.destroy();
```

## Options

نام و معنی در دو نسخه یکسان است. اعداد خارج از بازه clamp می‌شوند؛ مقدار نامعتبر ⇒ پیش‌فرض + `console.warn`.

### ظاهر و حرکت (قابل تنظیم از `theme`)

| Option        | نوع                                                                                                                        | پیش‌فرض (orbit) | توضیح                                          |
| ------------- | -------------------------------------------------------------------------------------------------------------------------- | --------------- | ---------------------------------------------- |
| `shape`       | `ellipse \| circle \| square \| rectangle \| triangle \| star \| heart \| infinity \| wave \| polygon \| flower \| custom` | `'ellipse'`     | شکل مسیر                                       |
| `radiusX`     | `number`                                                                                                                   | `340`           | شعاع افقی (ellipse، rectangle، infinity، wave) |
| `radiusY`     | `number`                                                                                                                   | `80`            | شعاع عمودی (همان شکل‌ها)                       |
| `radius`      | `number`                                                                                                                   | `160`           | شعاع بقیه‌ی شکل‌ها                             |
| `rotation`    | `number` °                                                                                                                 | `-8`            | چرخش مسیر (تصاویر صاف می‌مانند)                |
| `duration`    | `number` s                                                                                                                 | `30`            | مدت یک دور                                     |
| `itemSize`    | `number`                                                                                                                   | `90`            | اندازه‌ی تصویر (هم‌واحد شعاع‌ها)               |
| `depth`       | `number` 0–1                                                                                                               | `0.6`           | حس عمق                                         |
| `itemRadius`  | `number \| string`                                                                                                         | `14`            | گردی گوشه (هم‌واحد itemSize یا هر طول CSS)     |
| `shadow`      | `number` 0–1                                                                                                               | `0.3`           | سایه                                           |
| `hoverScale`  | `number`                                                                                                                   | `1.08`          | بزرگ‌شدن آیتم هنگام hover                      |
| `hoverSpeed`  | `number` 0–1                                                                                                               | `0.3`           | سرعت هنگام hover (۰ = توقف)                    |
| `pathDash`    | `number` px                                                                                                                | `0`             | طول خط‌چین مسیر                                |
| `direction`   | `'normal' \| 'reverse'`                                                                                                    | `'normal'`      | جهت حرکت                                       |
| `easing`      | `'linear' \| 'easeIn' \| 'easeOut' \| 'easeInOut'`                                                                         | `'linear'`      | easing هر دور                                  |
| `fill`        | `boolean`                                                                                                                  | `true`          | پخش یکنواخت؛ `false` = پشت سر هم مثل قطار      |
| `showPath`    | `boolean`                                                                                                                  | `true`          | نمایش خط مسیر                                  |
| `alignToPath` | `boolean`                                                                                                                  | `false`         | چرخش تصویر هم‌جهت با منحنی                     |
| `spotlight`   | `number` 0–1                                                                                                               | `0`             | خاکستری شدن آیتم‌های دور از جلو                |
| `backBlur`    | `number` px                                                                                                                | `0`             | blur آیتم‌های عقب                              |
| `tilt`        | `number` °                                                                                                                 | `0`             | کج‌شدن سه‌بعدی به سمت نشانگر                   |

### بقیه

| Option                                 | نوع                                              | پیش‌فرض                          | توضیح                                                                |
| -------------------------------------- | ------------------------------------------------ | -------------------------------- | -------------------------------------------------------------------- |
| `theme`                                | نام preset یا `Partial<OrbitImagesLook>`         | `'orbit'`                        | preset یا آبجکت مقادیر بالا                                          |
| `variant`                              | `'rounded' \| 'circle' \| 'polaroid' \| 'glass'` | `'rounded'`                      | استایل آیتم                                                          |
| `size`                                 | `'sm' \| 'md' \| 'lg'`                           | `'md'`                           | ضریب itemSize (0.75 / 1 / 1.3)                                       |
| `images`                               | `Array<string \| { src, alt?, caption? }>`       | ۶ تصویر نمونه                    | تصاویر                                                               |
| `altPrefix`                            | `string`                                         | `'Orbiting image'`               | پیشوند alt برای URLهای ساده                                          |
| `customPath`                           | `string`                                         | `''`                             | مسیر SVG دلخواه در فضای baseWidth × baseWidth (با `shape: 'custom'`) |
| `baseWidth`                            | `number`                                         | `1400`                           | اندازه‌ی فضای مختصات                                                 |
| `starPoints` / `starInnerRatio`        | `number`                                         | `5` / `0.5`                      | تنظیم ستاره                                                          |
| `sides`                                | `number`                                         | `6`                              | اضلاع `polygon`                                                      |
| `petals`                               | `number`                                         | `5`                              | گلبرگ‌های `flower`                                                   |
| `waveCount`                            | `number`                                         | `3`                              | تعداد موج‌های `wave`                                                 |
| `gap`                                  | `number`                                         | `1.3`                            | فاصله‌ی قطار وقتی `fill: false` (برحسب itemSize)                     |
| `startOffset`                          | `number` -1–1                                    | `0`                              | جابه‌جایی همه‌ی تصاویر روی مسیر                                      |
| `width` / `height`                     | `number \| string`                               | `'100%'` / `'auto'`              | ابعاد؛ `auto` = متناسب با شکل مدار                                   |
| `pathColor` / `pathWidth`              | `string` / `number` px                           | `'rgba(128,128,128,0.35)'` / `2` | رنگ و ضخامت خط مسیر                                                  |
| `paused`                               | `boolean`                                        | `false`                          | توقف (کشیدن و چرخ موس همچنان کار می‌کنند)                            |
| `intro`                                | `boolean`                                        | `true`                           | انیمیشن ورود                                                         |
| `draggable`                            | `boolean`                                        | `true`                           | کشیدن/swipe و پرتاب                                                  |
| `clickToFront`                         | `boolean`                                        | `true`                           | کلیک = آمدن آیتم به جلو                                              |
| `keyboard`                             | `boolean`                                        | `true`                           | ←/→ قبلی/بعدی (کادر قابل فوکوس می‌شود)                               |
| `wheel`                                | `'off' \| 'hover' \| 'focus'`                    | `'hover'`                        | چرخاندن با چرخ موس: خاموش / وقتی نشانگر روی مدار است / فقط با فوکوس  |
| `wheelSpeed`                           | `number`                                         | `1`                              | حساسیت چرخ موس                                                       |
| `scrollLink`                           | `boolean`                                        | `false`                          | اسکرول صفحه مدار را می‌چرخاند                                        |
| `scrollSpeed`                          | `number`                                         | `0.5`                            | دور به ازای هر ارتفاع viewport (منفی = برعکس)                        |
| `touchHold`                            | `boolean`                                        | `true`                           | نگه‌داشتن انگشت = کند شدن مثل hover                                  |
| `frontGrow` / `backShrink` / `backDim` | `number`                                         | `0.3` / `0.45` / `0.55`          | شدت اثرات depth                                                      |
| `captions`                             | `'off' \| 'hover' \| 'front' \| 'always'`        | `'off'`                          | نمایش caption                                                        |
| `objectFit`                            | `'cover' \| 'contain'`                           | `'cover'`                        | برش تصویر                                                            |
| `loading`                              | `'lazy' \| 'eager'`                              | `'lazy'`                         | بارگذاری تصویر                                                       |
| `onItemClick`                          | `(index, src) => void`                           | —                                | کلیک روی تصویر؛ آیتم‌ها دکمه‌ی قابل فوکوس می‌شوند                    |
| `onActiveChange`                       | `(index) => void`                                | —                                | وقتی آیتم جلو عوض می‌شود                                             |
| `centerContent`                        | React: `ReactNode` · Vanilla: `Node \| string`   | —                                | محتوای وسط مدار                                                      |

فقط React: `className`، `style`، `ref`. Vanilla: `className` در options.

### API دستوری

| React (`ref`) | Vanilla (instance) | توضیح                                 |
| ------------- | ------------------ | ------------------------------------- |
| `next()`      | `next()`           | آیتم بعدی به جلو                      |
| `prev()`      | `prev()`           | آیتم قبلی به جلو                      |
| `goTo(index)` | `goTo(index)`      | آیتم مشخص به جلو (کوتاه‌ترین مسیر)    |
| —             | `update(partial)`  | تغییر optionها بدون از دست رفتن state |
| —             | `destroy()`        | حذف DOM و همه‌ی listenerها            |

## Presetها (`themes`)

| Preset     | شکل      | ویژگی                                             |
| ---------- | -------- | ------------------------------------------------- |
| `orbit`    | ellipse  | پیش‌فرض، چرخش -8°                                 |
| `carousel` | ellipse  | depth بالا، آیتم بزرگ، بدون خط                    |
| `halo`     | circle   | بدون depth، آیتم گرد، خط‌چین                      |
| `ribbon`   | infinity | قطار هم‌جهت با منحنی                              |
| `star`     | star     |                                                   |
| `heart`    | heart    |                                                   |
| `wave`     | wave     | قطار هم‌جهت با منحنی                              |
| `hexagon`  | polygon  | جدید؛ ۶ ضلعی خط‌چین                               |
| `flower`   | flower   | جدید؛ دایره‌ی گلبرگی با آیتم گرد                  |
| `gallery`  | ellipse  | جدید؛ depth زیاد، spotlight و blur، توقف با hover |
| `tilted`   | ellipse  | جدید؛ چرخش -18° و tilt سه‌بعدی                    |

## Theme Tokens

روی root به‌صورت CSS Variable ست می‌شوند (`--ux-orbit-images-*`):

| توکن                                    | منبع                                | مصرف                               |
| --------------------------------------- | ----------------------------------- | ---------------------------------- |
| `radius`                                | `itemRadius` (یا variant)           | گردی گوشه‌ی قاب                    |
| `shadow`                                | `shadow`                            | `box-shadow` قاب                   |
| `hover-scale`                           | `hoverScale`                        | `scale` هنگام hover/فوکوس          |
| `path-color`                            | `pathColor`                         | `stroke` مسیر                      |
| `width` / `height`                      | `width` / `height`                  | ابعاد root                         |
| `aspect`                                | تخمین اولیه، سپس اندازه‌گیری engine | `aspect-ratio` وقتی `height: auto` |
| `item-size`                             | engine (px)                         | اندازه‌ی فونت caption              |
| `frame` / `padding` / `border` / `ring` | `variant`                           | قاب polaroid / glass               |
| `caption-color` / `caption-bg`          | `variant`                           | رنگ caption                        |

## نگاشت به props اصلی React Bits

همه‌ی props اصلی با همان نام وجود دارند (`responsive` که در نسخه‌ی اصلی استفاده نمی‌شد حذف شد). تفاوت‌ها:

- پیش‌فرض‌های ظاهری از preset `orbit` دمو گرفته شده‌اند (مثلاً `radiusX: 340`، `itemSize: 90`)، نه از پیش‌فرض‌های خام کامپوننت (`700`، `64`)
- `wheel` به‌صورت پیش‌فرض `'hover'` است؛ برای رفتار دقیق نسخه‌ی اصلی `wheel="off"` بدهید

## محدودیت‌ها و نکات فنی

- در حالت `wheel: 'hover'` تا وقتی نشانگر روی مدار است، چرخ موس صفحه را اسکرول نمی‌کند (رویداد مصرف می‌شود)؛ اگر مدار بخش بزرگی از صفحه است، `'focus'` را در نظر بگیرید.
- swipe عمودی روی موبایل همچنان صفحه را اسکرول می‌کند (`touch-action: pan-y`)؛ فقط حرکت افقی مدار را می‌چرخاند.
- `tilt` کل صحنه را (شامل `centerContent`) کج می‌کند.
- اگر مرورگر `requestAnimationFrame` را متوقف کند (تب پنهان)، انیمیشن هم متوقف می‌شود و بعد ادامه می‌دهد.
