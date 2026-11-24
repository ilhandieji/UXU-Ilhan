# Dock

نوار آیکون به سبک داک اپلیکیشن‌ها با بزرگ‌نمایی نرم زیر نشانگر موس. طراحی اختصاصی؛ دو پیاده‌سازی مستقل: [`react/`](react) (TSX) و [`vanilla/`](vanilla) (TypeScript).

## قابلیت‌ها

- بزرگ‌نمایی بر اساس فاصله‌ی نشانگر در امتداد محور داک با افت کسینوسی نرم (`magnification`، `distance`) و انیمیشن rAF با lerp مستقل از نرخ فریم؛ اندازه‌ی هر آیتم به‌صورت CSS variable (`--ux-dock-item-size`) نوشته و با کلاس‌های width/height مصرف می‌شود
- چهار موقعیت `bottom | top | left | right`: جهت (افقی/عمودی)، جهت رشد آیتم‌ها، سمت tooltip و نقطه‌ی active را تعیین می‌کند
- tooltip (`hover | always | none`)، badge (عدد/متن؛ بیش از ۹۹ ← `99+`)، نقطه‌ی active زیر آیتم‌های `active`، پرش (bounce) هنگام کلیک
- آیتم با `href` به‌صورت `<a>` و بدون آن `<button>` رندر می‌شود
- سه variant: `floating` (پنل شیشه‌ای با blur و سایه، پیش‌فرض)، `flat`، `outline`؛ چهار theme: `glass`، `dark`، `light`، `neon`؛ سه size
- API دستوری: `setItems(items)`، `focusItem(index)`
- تغییر همه‌ی optionها در runtime بدون ساخت مجدد (اندازه‌های در حال انیمیشن و فوکوس حفظ می‌شوند؛ آیتم‌ها بر اساس `id` بازاستفاده می‌شوند)

## فایل‌ها (برای کپی)

| نسخه    | فایل‌ها                                      |
| ------- | -------------------------------------------- |
| React   | `react/Dock.tsx` · `react/dock.config.ts`    |
| Vanilla | `vanilla/dock.ts` · `vanilla/dock.config.ts` |

هر دو فایل یک نسخه را کنار هم در پروژه‌ی خودت کپی کن (مثلاً `components/ui/`). استایل **فقط Tailwind v4** است (بدون فایل CSS).

## نیازمندی‌ها

- Tailwind CSS v4 (اگر مسیر کپی را خودکار اسکن نمی‌کند: `@source "./components/ui";`)
- React: `react` ≥ 19.3 (آخرین نسخه‌ی stable: 19.3.1؛ `ref` به‌صورت prop مستقیم)؛ آماده‌ی Next.js با `'use client'`
- Dependency اجرایی دیگر ندارد.

## استفاده

کامپوننت فقط خود نوار را رندر می‌کند؛ جای‌گذاری روی صفحه (مثلاً `fixed bottom-4`) با والد است.

React:

```tsx
"use client";
import { useRef } from "react";
import { Dock, type DockHandle } from "./Dock";

const items = [
  { id: "home", label: "Home", icon: "🏠", active: true },
  { id: "files", label: "Files", icon: "📁", badge: 3 },
  { id: "github", label: "GitHub", icon: <GithubIcon />, href: "https://github.com" },
];

const dock = useRef<DockHandle>(null);

<div className="fixed bottom-4 left-1/2 -translate-x-1/2">
  <Dock ref={dock} items={items} magnification={2} onSelect={(item) => open(item.id)} />
</div>;

dock.current?.focusItem(0);
```

Vanilla:

```ts
import { createDock } from "./dock";

const dock = createDock(document.querySelector("#dock")!, {
  items: [
    { id: "home", label: "Home", icon: "🏠", active: true },
    { id: "chat", label: "Chat", icon: "💬", badge: 12 },
  ],
  onSelect: (item, index) => console.log(item.id, index),
});
dock.update({ position: "left", theme: "neon" });
dock.setItems([{ id: "home", label: "Home", icon: "🏠" }]);
dock.destroy();
```

## Options

| نام                    | نوع                                                         | پیش‌فرض      | توضیح                                                                             |
| ---------------------- | ----------------------------------------------------------- | ------------ | --------------------------------------------------------------------------------- |
| `items`                | `DockItem[]`                                                | `[]`         | آیتم‌ها (جدول پایین)؛ آیتم بدون `id`/`label` رشته‌ای یا `id` تکراری حذف می‌شود    |
| `onSelect`             | `(item, index) => void`                                     | —            | با کلیک، Enter یا Space                                                           |
| `magnification`        | `number` (۱ تا ۴)                                           | `1.8`        | بیشینه‌ی مقیاس آیتم زیر نشانگر؛ `1` = بدون بزرگ‌نمایی                             |
| `distance`             | `number` (px)                                               | `140`        | شعاع اثر نشانگر در امتداد محور                                                    |
| `baseSize`             | `number` (px)                                               | از `size`    | اندازه‌ی آیتم در حالت سکون (توکن `base-size` را override می‌کند)                  |
| `gap`                  | `number` (px)                                               | از `size`    | فاصله‌ی آیتم‌ها (توکن `gap` را override می‌کند)                                   |
| `position`             | `'bottom' \| 'top' \| 'left' \| 'right'`                    | `'bottom'`   | جهت، سمت رشد، سمت tooltip و نقطه                                                  |
| `labels`               | `'hover' \| 'always' \| 'none'`                             | `'hover'`    | نمایش tooltip                                                                     |
| `indicator`            | `boolean`                                                   | `true`       | نقطه کنار آیتم‌های `active`                                                       |
| `bounce`               | `boolean`                                                   | `true`       | پرش آیکون هنگام انتخاب (Web Animations API)                                       |
| `variant`              | `'floating' \| 'flat' \| 'outline'`                         | `'floating'` |                                                                                   |
| `theme`                | `'glass' \| 'dark' \| 'light' \| 'neon' \| Partial<Tokens>` | `'glass'`    | preset یا توکن‌های سفارشی                                                         |
| `size`                 | `'sm' \| 'md' \| 'lg'`                                      | `'md'`       | `base-size` ۳۶ / ۴۸ / ۶۴ px                                                       |
| `respectReducedMotion` | `boolean`                                                   | `true`       | با `prefers-reduced-motion` بزرگ‌نمایی و پرش خاموش، hover فقط رنگ را تغییر می‌دهد |
| `label`                | `string`                                                    | `'Dock'`     | `aria-label` نوار                                                                 |
| `renderIcon`           | `(item) => …`                                               | —            | محتوای سفارشی آیکون؛ اگر `null` برگرداند `item.icon` استفاده می‌شود               |

فقط React: `className`، `style` و `ref` (`DockHandle`).

### `DockItem`

| نام      | نوع                    | توضیح                                    |
| -------- | ---------------------- | ---------------------------------------- |
| `id`     | `string`               | یکتا؛ کلید بازاستفاده‌ی المان            |
| `label`  | `string`               | متن tooltip و `aria-label`               |
| `icon`   | `string` / `ReactNode` | emoji یا متن کوتاه (تفاوت دو نسخه پایین) |
| `href`   | `string?`              | رندر به‌صورت لینک                        |
| `active` | `boolean?`             | نقطه‌ی active و `aria-current`           |
| `badge`  | `string \| number?`    | `0` یا `''` پنهان است                    |

**تفاوت دو نسخه (نام optionها یکی است):** در React، `icon` هر `ReactNode` (مثلاً SVG) می‌پذیرد و `renderIcon` یک `ReactNode` برمی‌گرداند؛ در Vanilla، `icon` رشته است (با `textContent` درج می‌شود) و `renderIcon` یک `Node` یا رشته برمی‌گرداند.

### API دستوری

| متد                | توضیح                                                            |
| ------------------ | ---------------------------------------------------------------- |
| `setItems(items)`  | جایگزینی آیتم‌ها (در React تا تغییر بعدی prop `items` معتبر است) |
| `focusItem(index)` | فوکوس روی آیتم و انتقال tabindex                                 |
| `update(partial)`  | فقط Vanilla                                                      |
| `destroy()`        | فقط Vanilla: حذف DOM، listenerها، rAF و انیمیشن‌ها               |
| `element`          | فقط Vanilla: المان toolbar                                       |

## Theme Tokens

مقدارها در `dock.config.ts` (`themes`، `sizes`، `variants`) تعریف و روی root به‌صورت `--ux-dock-<token>` ست می‌شوند. ترتیب ترکیب: theme ← size ← variant ← override کاربر.

| توکن                                           | توضیح                                  |
| ---------------------------------------------- | -------------------------------------- |
| `bg` · `border` · `border-width` · `fg`        | پنل                                    |
| `item-bg` · `item-bg-hover`                    | پس‌زمینه‌ی آیتم                        |
| `tooltip-bg` · `tooltip-fg` · `tooltip-radius` | tooltip                                |
| `indicator` · `indicator-size`                 | نقطه‌ی active                          |
| `badge-bg` · `badge-fg` · `badge-size`         | badge                                  |
| `ring`                                         | حلقه‌ی focus-visible                   |
| `radius` · `item-radius` · `padding`           | شکل                                    |
| `shadow` · `blur`                              | سایه و backdrop-blur پنل               |
| `font-family` · `font-size`                    | متن tooltip و badge                    |
| `base-size` · `gap`                            | اندازه‌ی سکون آیتم و فاصله (از `size`) |
| `duration`                                     | زمان transition رنگ و tooltip          |

متغیر runtime: `--ux-dock-item-size` روی هر آیتم (فقط هنگام بزرگ‌نمایی؛ در حالت سکون حذف می‌شود و `base-size` اعمال است).

ثابت‌های انیمیشن (غیربصری) در `motion`: `lerp`، `settle`، `bounceMs`.

## Accessibility

- `role="toolbar"` با `aria-label` (`label`) و `aria-orientation`
- roving tabindex: فقط یک آیتم در Tab؛ کلیدهای جهت در امتداد محور (چپ/راست یا بالا/پایین، چرخشی)، `Home`/`End`
- آیتم‌ها `<button>` یا `<a>`؛ Enter/Space فعال می‌کنند (Space روی لینک هم)
- `aria-label` هر آیتم = `label`؛ tooltip، badge و نقطه `aria-hidden` هستند؛ آیتم active: `aria-current`
- فوکوس با کیبورد هم بزرگ‌نمایی را حول آیتم فوکوس‌شده نشان می‌دهد؛ حلقه‌ی `focus-visible`

## محدودیت‌ها و نکات فنی

- ارتفاع (یا عرض در حالت عمودی) پنل ثابت و برابر اندازه‌ی سکون است؛ آیتم‌های بزرگ‌شده به بیرون (خلاف لبه‌ی صفحه) سرریز می‌کنند، پس والد نباید `overflow-hidden` نزدیک داک داشته باشد.
- با `labels: 'always'` و بزرگ‌نمایی زیاد، برچسب‌های کنار هم ممکن است روی هم بیفتند.
- مرکز آیتم‌ها در هر فریم از `getBoundingClientRect` خوانده می‌شود (رفتار استاندارد داک‌ها)؛ حلقه‌ی rAF پس از رسیدن به اندازه‌ی هدف متوقف می‌شود.
- badge متن badge را به صفحه‌خوان اعلام نمی‌کند؛ در صورت نیاز آن را در `label` بیاورید (مثلاً `"Chat, 12 unread"`).

## توسعه

`pnpm dev` ← `http://localhost:3000/components/dock` (تب React / Vanilla، پنل Customize، Copy)
