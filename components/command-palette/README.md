# Command Palette

لانچر سبک `Ctrl/⌘ + K` (مثل VS Code، Linear و cmdk) با جستجوی fuzzy، هایلایت حروف پیداشده، گروه‌بندی، نمایش shortcut و پشتیبانی کامل کیبورد و ARIA. دو پیاده‌سازی مستقل: [`vanilla/`](vanilla) (TypeScript) و [`react/`](react) (TSX).

## قابلیت‌ها

- دو variant: `dialog` (مودال وسط صفحه با overlay، پیش‌فرض) و `inline` (رندر در همان‌جا، همیشه باز — برای embed)
- جستجوی fuzzy داخلی (تطبیق subsequence با امتیازدهی: حروف پشت‌سرهم، شروع کلمه، شروع متن) روی `label` و `keywords`
- هایلایت حروف تطبیق‌یافته با `<mark>` (ساخته‌شده با DOM / JSX؛ هرگز `innerHTML`)
- گروه‌ها با عنوان، آیکن (ایموجی/متن کوتاه)، shortcut با `<kbd>`، آیتم غیرفعال
- hotkey سراسری قابل تنظیم (`mod+k`؛ `mod` در macOS = Cmd و در بقیه = Ctrl)
- مودال: بستن با Esc یا کلیک روی backdrop، focus trap، برگرداندن فوکوس به عنصر قبلی، قفل اسکرول صفحه
- حالت controlled (`open` + `onOpenChange`) یا uncontrolled (`defaultOpen`)
- ناوبری پیش‌فرض با `location.assign(href)` وقتی `onSelect` آیتم را هندل نکند
- Dynamic: تم (`dark`، `light`، `terminal`)، سایز و همه‌ی رنگ/فونت/اندازه‌ها با توکن

## فایل‌ها (برای کپی)

| نسخه    | فایل‌ها                                                            |
| ------- | ------------------------------------------------------------------ |
| React   | `react/CommandPalette.tsx` · `react/command-palette.config.ts`     |
| Vanilla | `vanilla/command-palette.ts` · `vanilla/command-palette.config.ts` |

هر دو فایل یک نسخه را کنار هم در پروژه‌ی خودت کپی کن (مثلاً `components/ui/`). موتور جستجو، تجزیه‌ی hotkey و توکن‌ها در فایل config هستند (در دو نسخه یکسان).

## نیازمندی‌ها

- Tailwind CSS v4 (اگر مسیر کپی را خودکار اسکن نمی‌کند: `@source "./components/ui";`)
- React: `react` ≥ 19.3 (آخرین نسخه‌ی stable: 19.3.1؛ `ref` به‌صورت prop مستقیم)، و `react-dom` برای `createPortal` دیالوگ؛ آماده‌ی Next.js با `'use client'`
- Dependency اجرایی دیگر ندارد.

## استفاده

React (Next.js، controlled):

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CommandPalette } from "./CommandPalette";

const items = [
  { id: "home", label: "Home", group: "Pages", icon: "🏠", href: "/" },
  { id: "blog", label: "Blog", group: "Pages", icon: "📝", href: "/blog", keywords: ["posts"] },
  { id: "copy", label: "Copy link", group: "Actions", icon: "🔗", shortcut: ["Ctrl", "L"] },
];

export function SiteSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <CommandPalette
      items={items}
      open={open}
      onOpenChange={setOpen}
      onSelect={(item) => {
        if (item.href) router.push(item.href);
        else if (item.id === "copy") navigator.clipboard.writeText(location.href);
      }}
    />
  );
}
```

با `ref` (نوع `CommandPaletteHandle`): `ref.current.open()`، `close()`، `toggle()`، `setItems(items)`، `focus()`.

Vanilla:

```ts
import { createCommandPalette } from "./command-palette";

const palette = createCommandPalette(document.body, {
  items: [{ id: "home", label: "Home", group: "Pages", href: "/" }],
  onSelect: (item) => console.log(item.id), // returns undefined = handled
});
palette.open();
palette.update({ theme: "terminal", size: "lg" });
palette.setItems([...]);
palette.destroy();
```

در variant `dialog` نسخه‌ی Vanilla، دیالوگ به `document.body` اضافه می‌شود و `container` استفاده نمی‌شود؛ در `inline` پنل داخل `container` رندر می‌شود.

## Options / Props (قرارداد مشترک)

| نام             | نوع                                                  | پیش‌فرض                       | توضیح                                                                    |
| --------------- | ---------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------ |
| `items`         | `CommandPaletteItem[]`                               | `[]`                          | آیتم‌ها (جدول پایین)؛ آیتم بدون `id`/`label` رشته‌ای نادیده گرفته می‌شود |
| `open`          | `boolean`                                            | —                             | حالت controlled (فقط `dialog`)                                           |
| `defaultOpen`   | `boolean`                                            | `false`                       | حالت اولیه‌ی uncontrolled                                                |
| `onOpenChange`  | `(open) => void`                                     | —                             | با Esc، backdrop، hotkey، انتخاب و API imperative                        |
| `onSelect`      | `(item) => boolean \| void`                          | —                             | برگرداندن `false` = ناوبری پیش‌فرض با `href`                             |
| `hotkey`        | `string`                                             | `'mod+k'`                     | مثل `ctrl+shift+p`؛ `''` = غیرفعال. در `inline` فقط فوکوس می‌کند         |
| `placeholder`   | `string`                                             | `'Type a command or search…'` |                                                                          |
| `emptyText`     | `string`                                             | `'No results found.'`         | وقتی نتیجه‌ای نیست                                                       |
| `closeOnSelect` | `boolean`                                            | `true`                        | بستن دیالوگ بعد از انتخاب                                                |
| `maxResults`    | `number`                                             | `50`                          | حداکثر ردیف‌ها (≥ ۱)                                                     |
| `showGroups`    | `boolean`                                            | `true`                        | عنوان گروه‌ها                                                            |
| `footer`        | `boolean`                                            | `true`                        | راهنمای کلیدها زیر لیست                                                  |
| `labels`        | `{ title, navigate, select, close }`                 | انگلیسی                       | متن‌های رابط (نام دسترس‌پذیر و راهنمای footer)                           |
| `theme`         | `'dark' \| 'light' \| 'terminal' \| Partial<Tokens>` | `'dark'`                      | preset یا توکن‌های سفارشی (روی `dark`)                                   |
| `variant`       | `'dialog' \| 'inline'`                               | `'dialog'`                    | ساختار                                                                   |
| `size`          | `'sm' \| 'md' \| 'lg'`                               | `'md'`                        | مقیاس                                                                    |

React علاوه بر این‌ها `className` (روی پنل) و `ref` می‌گیرد. Vanilla: `update(partial)`، `open()`، `close()`، `toggle()`، `setItems(items)`، `focus()`، `isOpen`، `destroy()`.

### `CommandPaletteItem`

| فیلد       | نوع         | توضیح                                         |
| ---------- | ----------- | --------------------------------------------- |
| `id`       | `string`    | یکتا                                          |
| `label`    | `string`    | متن ردیف (جستجو و هایلایت)                    |
| `group`    | `string?`   | عنوان گروه                                    |
| `icon`     | `string?`   | ایموجی یا متن کوتاه                           |
| `shortcut` | `string[]?` | مثل `["⌘", "K"]` (فقط نمایشی)                 |
| `keywords` | `string[]?` | کلمات اضافه برای جستجو (هایلایت نمی‌شوند)     |
| `href`     | `string?`   | ناوبری پیش‌فرض                                |
| `disabled` | `boolean?`  | قابل انتخاب نیست و ناوبری کیبورد از آن می‌پرد |

## Theme Tokens

همه با پیشوند `--ux-command-palette-`؛ مقدارها در `command-palette.config.ts` (`common`، `themes`، `sizes`) تعریف و از JS روی پنل (`inline`) یا overlay (`dialog`) ست می‌شوند. ترتیب ادغام: theme ← size ← override کاربر.

| توکن                                                         | کاربرد                                               |
| ------------------------------------------------------------ | ---------------------------------------------------- |
| `bg`, `fg`, `muted`, `border`                                | پس‌زمینه، متن، متن کم‌رنگ (گروه، kbd، footer)، قاب   |
| `accent`, `accent-fg`                                        | ردیف فعال و متن آن                                   |
| `highlight`                                                  | رنگ حروف پیداشده                                     |
| `overlay`                                                    | پس‌زمینه‌ی backdrop دیالوگ                           |
| `radius`, `item-radius`, `shadow`                            | قاب پنل و ردیف‌ها                                    |
| `font-family`, `font-size`, `small-size`                     | تایپوگرافی (`small-size` برای گروه، kbd و footer)    |
| `padding`, `gap`, `item-height`, `input-height`, `icon-size` | فاصله‌ها و ارتفاع‌ها (در `sizes`)                    |
| `width`, `max-height`                                        | حداکثر عرض پنل و ارتفاع لیست (در `sizes`)            |
| `offset`, `z`                                                | فاصله‌ی دیالوگ از بالای صفحه و z-index (در `common`) |

Presetها: `dark`، `light`، `terminal` (سبز روی سیاه، مونواسپیس).

## کیبورد و Accessibility

- `↑`/`↓` (چرخشی، آیتم غیرفعال رد می‌شود)، `Home`/`End`، `Enter` انتخاب، `Esc` بستن (در `inline`: پاک کردن جستجو)، hover موس ردیف فعال را عوض می‌کند.
- ورودی `role="combobox"` با `aria-expanded`، `aria-controls`، `aria-activedescendant` و `aria-autocomplete="list"`؛ لیست `role="listbox"`؛ ردیف‌ها `role="option"` با `aria-selected` و `aria-disabled`؛ گروه‌ها `role="group"` با `aria-labelledby`.
- دیالوگ `role="dialog"` + `aria-modal`؛ فوکوس روی ورودی می‌ماند (Tab و focus خارج از پنل برمی‌گردد) و بعد از بستن به عنصر قبلی برمی‌گردد (مگر `onSelect` فوکوس را عمداً جای دیگری برده باشد).
- انیمیشنی جز `transition-colors` ردیف‌ها ندارد که با `prefers-reduced-motion` خاموش می‌شود.

## توسعه

`pnpm dev` ← `http://localhost:3000/components/command-palette` (تب React / Vanilla، پنل Customize، Copy). دمو به‌صورت پیش‌فرض `inline` است و دکمه‌ی «Open dialog» نسخه‌ی دیالوگ را باز می‌کند.

## محدودیت‌ها و نکات

- قفل اسکرول با کلاس `overflow-hidden` روی `<html>` است (جبران عرض scrollbar انجام نمی‌شود).
- `shortcut` فقط نمایشی است؛ کلیدهای میان‌بر آیتم‌ها را خودت ثبت کن.
- جستجو در حافظه و همگام است؛ برای هزاران آیتم یا جستجوی سمت سرور، `setItems` / `items` را خودت فیلتر کن.
- اگر چند نمونه hotkey یکسان داشته باشند، همه واکنش نشان می‌دهند؛ برای نمونه‌های اضافه `hotkey=""` بده.
