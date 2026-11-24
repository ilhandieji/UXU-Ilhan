# CodeBlock

نمایش کد با رنگ‌بندی Syntax و دکمه‌ی کپی، **بدون هیچ Dependency**. یک tokenizer کوچک داخلی دارد و برای دقت بیشتر می‌توان highlighter واقعی (shiki، prism، …) را از طریق `highlight` وصل کرد. دو پیاده‌سازی مستقل: [`react/`](react) (TSX) و [`vanilla/`](vanilla) (TypeScript).

## قابلیت‌ها

- tokenizer داخلی برای `ts` / `tsx` / `js` / `jsx`، `json`، `css`، `bash` / `sh`، `html` / `xml` (با رنگ‌بندی `<script>` و `<style>` داخلی) و `text` (بدون رنگ‌بندی)
- انواع توکن: `comment`، `string`، `keyword`، `number`، `function`، `type`، `operator`، `punctuation`، `tag`، `attribute`، `property`، `variable`
- کد همیشه با `textContent` / span رندر می‌شود؛ **هرگز** `innerHTML` برای متن کد استفاده نمی‌شود
- شماره‌ی خط (`showLineNumbers`، `startLine`)، خط‌های هایلایت‌شده (`"1,3-5"` یا `[1, 3]`)، soft wrap، `maxHeight` با اسکرول
- هدر با عنوان فایل، badge زبان، سه نقطه‌ی پنجره و دکمه‌ی Copy (Clipboard API + fallback با textarea مخفی و `execCommand`)، حالت «Copied» به مدت ۱.۵ ثانیه
- ۴ تم (`midnight` شبیه GitHub Dark، `vampire` شبیه Dracula، `paper` روشن، `terminal` سبز)، ۳ variant (`default`، `minimal` بدون هدر، `window` شبیه پنجره‌ی macOS)، ۳ size
- تغییر همه‌ی optionها در runtime بدون ساخت مجدد (tokenize فقط با تغییر کد/زبان دوباره اجرا می‌شود)

## فایل‌ها (برای کپی)

هر نسخه سه فایل دارد، بدون زیرپوشه:

| React (`react/`)          | Vanilla (`vanilla/`)      | محتوا                                                                           |
| ------------------------- | ------------------------- | ------------------------------------------------------------------------------- |
| `CodeBlock.tsx`           | `code-block.ts`           | رندر DOM، کپی، API دستوری                                                       |
| `code-block.config.ts`    | `code-block.config.ts`    | Options، پیش‌فرض‌ها، تم‌ها، sizes، variants، کلاس‌های Tailwind، اعتبارسنجی، کپی |
| `code-block.highlight.ts` | `code-block.highlight.ts` | tokenizer (بدون وابستگی به فریم‌ورک؛ دو نسخه یکسان‌اند)                         |

استایل **فقط Tailwind v4** است (بدون فایل CSS).

## نیازمندی‌ها

- Tailwind CSS v4 (اگر مسیر کپی را خودکار اسکن نمی‌کند: `@source "./components/ui";`)
- React: `react` ≥ 19.3 (آخرین نسخه‌ی stable: 19.3.1؛ `ref` به‌صورت prop مستقیم)؛ آماده‌ی Next.js با `'use client'`
- Dependency اجرایی دیگری ندارد.

## استفاده

React:

```tsx
"use client";
import { useRef } from "react";
import { CodeBlock, type CodeBlockHandle } from "./CodeBlock";

const block = useRef<CodeBlockHandle>(null);

<CodeBlock
  ref={block}
  code={source}
  language="tsx"
  title="App.tsx"
  highlightLines="3-4"
  variant="window"
  theme="vampire"
  onCopy={(code) => console.log("copied", code.length)}
/>;

await block.current?.copy();
```

Vanilla:

```ts
import { createCodeBlock } from "./code-block";

const block = createCodeBlock(document.querySelector("#snippet")!, {
  code: "pnpm add -D tailwindcss",
  language: "bash",
  title: "install.sh",
});
block.update({ theme: { bg: "#000", keyword: "#0f0" }, wrap: true });
await block.copy();
block.destroy();
```

استفاده از یک highlighter واقعی (مثلاً shiki):

```tsx
import { codeToHtml } from "shiki";

// shiki is async: render on the server (or in an effect) first, then pass the result
const html = await codeToHtml(code, { lang: "ts", theme: "github-dark" });

<CodeBlock code={code} language="ts" highlight={() => html} />;
```

> ⚠️ خروجی `highlight` **بدون هیچ تغییری به‌عنوان HTML درج می‌شود.** فقط خروجی یک highlighter مطمئن را که خودش کد را escape می‌کند برگردان؛ هرگز HTML ساخته‌شده از ورودی کاربر را مستقیم برنگردان. با `highlight`، شماره‌ی خط و خط‌های هایلایت‌شده اعمال نمی‌شوند. تابع باید synchronous باشد.

## Options

| نام               | نوع                                                                   | پیش‌فرض      | توضیح                                                                       |
| ----------------- | --------------------------------------------------------------------- | ------------ | --------------------------------------------------------------------------- |
| `code`            | `string`                                                              | `''`         | متن کد (یک newline انتهایی حذف می‌شود)                                      |
| `language`        | `string`                                                              | `'ts'`       | `ts, tsx, js, jsx, json, css, bash, sh, html, xml, text`؛ ناشناخته = `text` |
| `title`           | `string`                                                              | `''`         | نام فایل در هدر                                                             |
| `showLineNumbers` | `boolean`                                                             | `true`       |                                                                             |
| `startLine`       | `number`                                                              | `1`          | شماره‌ی اولین خط                                                            |
| `highlightLines`  | `string \| number[]`                                                  | `''`         | `"1,3-5"` یا `[1, 3]` — بر اساس شماره‌ی نمایش‌داده‌شده                      |
| `wrap`            | `boolean`                                                             | `false`      | soft wrap به‌جای اسکرول افقی                                                |
| `copy`            | `boolean`                                                             | `true`       | نمایش دکمه‌ی کپی                                                            |
| `copyLabel`       | `string`                                                              | `'Copy'`     | متن و aria-label دکمه                                                       |
| `copiedLabel`     | `string`                                                              | `'Copied'`   | متن بعد از کپی (و اعلان aria-live)                                          |
| `maxHeight`       | `string`                                                              | `'none'`     | طول CSS مثل `'320px'`؛ بیشتر از آن اسکرول می‌شود                            |
| `showLanguage`    | `boolean`                                                             | `true`       | badge زبان در هدر                                                           |
| `windowControls`  | `boolean`                                                             | `false`      | سه نقطه در هدر (در variant `window` همیشه روشن)                             |
| `ariaLabel`       | `string`                                                              | `''`         | نام دسترس‌پذیر ناحیه‌ی کد؛ خالی = `title` یا `"Code"`                       |
| `theme`           | `'midnight' \| 'vampire' \| 'paper' \| 'terminal' \| Partial<Tokens>` | `'midnight'` | preset یا توکن‌های سفارشی (روی همان نمونه)                                  |
| `variant`         | `'default' \| 'minimal' \| 'window'`                                  | `'default'`  | `minimal`: بدون هدر، دکمه‌ی کپی شناور (با hover/focus)                      |
| `size`            | `'sm' \| 'md' \| 'lg'`                                                | `'md'`       | اندازه‌ی فونت، فاصله و ارتفاع خط                                            |
| `highlight`       | `(code, language) => string`                                          | —            | HTML مطمئن از highlighter بیرونی (هشدار بالا)                               |
| `onCopy`          | `(code: string) => void`                                              | —            | بعد از کپی موفق                                                             |

API دستوری: React `ref` ← `{ copy(): Promise<boolean> }`؛ Vanilla `createCodeBlock(container, options)` ← `{ update(partial), copy(), element, destroy() }`.

مقدار نامعتبر → مقدار پیش‌فرض + `console.warn`.

## توکن‌ها (CSS Variables)

همه با پیشوند `--ux-code-block-`؛ مقدارها در `code-block.config.ts` (`themes`, `sizes`, `variants`) و روی root ست می‌شوند. ترتیب ترکیب: theme ← size ← variant ← override کاربر.

| گروه   | توکن‌ها                                                                                                                             |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| سطح    | `bg`, `fg`, `header-bg`, `header-fg`, `border`, `line-number`, `line-highlight`, `selection`, `accent` (focus و حالت Copied)        |
| Syntax | `comment`, `string`, `keyword`, `number`, `function`, `type`, `operator`, `punctuation`, `tag`, `attribute`, `property`, `variable` |
| پنجره  | `dot-close`, `dot-minimize`, `dot-maximize`, `shadow` (در variants)                                                                 |
| اندازه | `font-family`, `font-size`, `header-font-size`, `line-height`, `padding`, `radius`                                                  |
| داخلی  | `max-height` (از option `maxHeight`)، `gutter` (عرض ستون شماره‌ی خط، خودکار)                                                        |

## توسعه

`pnpm dev` ← `http://localhost:3000/components/code-block` (تب React / Vanilla، پنل Customize، Copy). در Playground انتخاب زبان، نمونه‌کد همان زبان را جایگزین می‌کند.

## محدودیت‌ها و نکات

- tokenizer داخلی یک parser کامل نیست (مبتنی بر regex و چند حالت ساده)؛ برای کدهای پیچیده یا زبان‌های دیگر از `highlight` استفاده کن.
- Generic در `.tsx` (مثل `<T,>`) ممکن است به‌عنوان تگ JSX رنگ شود؛ در `ts` تگ JSX تشخیص داده نمی‌شود.
- Accessibility: ناحیه‌ی کد `role="region"` با `aria-label` و `tabIndex=0` دارد تا با کیبورد اسکرول شود؛ شماره‌ی خط‌ها `aria-hidden` هستند و هنگام انتخاب متن کپی نمی‌شوند (`select-none`)؛ دکمه‌ی کپی `aria-label` دارد و نتیجه در یک ناحیه‌ی `aria-live="polite"` اعلام می‌شود؛ focus با `focus-visible` نمایش داده می‌شود.
- انیمیشنی جز transition کوتاه رنگ/شفافیت ندارد، بنابراین `prefers-reduced-motion` نیاز به حالت جدا ندارد.
- Clipboard API فقط در secure context (HTTPS / localhost) کار می‌کند؛ در غیر این صورت fallback قدیمی `execCommand('copy')` استفاده می‌شود و اگر آن هم شکست بخورد `copy()` مقدار `false` برمی‌گرداند.
