# Theming و اصل Dynamic

هر کامپوننت باید تا حد ممکن **قابل‌تنظیم** باشد؛ هیچ مقدار ظاهری نباید فقط در کد ثابت باشد. دو نسخه Vanilla و React باید **قرارداد تنظیم یکسان** داشته باشند (کدشان مستقل است، نام‌ها یکی است).

## ۱. Design Tokens
- همه‌ی رنگ، فونت، اندازه، فاصله، radius، سایه، زمان/سرعت انیمیشن = CSS Custom Property.
- نام‌گذاری: `--ux-<component>-<token>` مثل `--ux-terminal-bg`، `--ux-terminal-font-size`.
- مقدار توکن‌ها فقط در `<name>.config.ts` (`themes`, `sizes`, `variants`) تعریف و از JS روی root به‌صورت CSS Variable ست می‌شود؛ فایل CSS وجود ندارد (ببین `tailwind.md`).
- کلاس‌های Tailwind فقط `var(--ux-...)` مصرف می‌کنند؛ رنگ/اندازه‌ی هاردکد در کلاس‌ها ممنوع (به‌جز `0`, `full`, `transparent`, `current`).
- توکن‌های جدید در README کامپوننت (جدول Theme Tokens) ثبت شوند.

## ۲. Theme / Variant / Size
- `theme`: مجموعه‌ی مقادیر توکن (preset نام‌دار مثل `matrix`) در `themes`.
- `variant`: تفاوت ساختار/استایل (مثل `window | fullscreen | minimal`) به‌صورت override توکن در `variants`.
- `size`: `sm | md | lg` به‌صورت override توکن در `sizes`.
- ترکیب با `resolveTokens`: theme ← size ← variant ← override کاربر.
- `theme` علاوه بر نام preset، آبجکت جزئی از توکن‌ها (`{ bg: '#000', accent: '#0f0' }`) را هم می‌پذیرد که به CSS variable روی همان نمونه نگاشت می‌شود (نه Global).
- تغییر `theme/variant/size/font` در runtime باید بدون ساخت مجدد کامپوننت و بدون از دست رفتن state (history، متن، cwd و ...) کار کند.

## ۳. Options عمومی
- رفتار و محتوا هم قابل تنظیم باشد (متن‌ها، prompt، فعال/غیرفعال کردن قابلیت‌ها، callbackها)؛ متن‌های رابط هاردکد نشوند (قابل override).
- Optionها، نوع‌ها و پیش‌فرض‌ها در `<name>.config.ts` تعریف می‌شوند؛ هر option مقدار پیش‌فرض و اعتبارسنجی دارد؛ مقدار نامعتبر → fallback به پیش‌فرض + `console.warn` در dev.
- API دو نسخه: Vanilla `createX(container, options)` با `update(partialOptions)`؛ React `<X {...options} />`؛ نام و معنی optionها یکسان.

## ۴. محدوده
- فقط کامپوننت را قابل‌تنظیم کن؛ UI پنل تنظیمات/گالری/Live Editor = Phase 2 و ممنوع تا درخواست صریح.
- سازگاری: `prefers-reduced-motion` و `prefers-color-scheme` در صورت ارتباط رعایت شود.
