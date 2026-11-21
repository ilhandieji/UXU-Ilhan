# Dependencyها، مستندات و بررسی

- یک `package.json` در ریشه؛ بدون workspace. ابزار و وابستگی‌ها فقط با `pnpm add -D <dep>` در ریشه (برای Playground و type-check).
- کامپوننت‌ها پکیج نیستند؛ هر Dependency که پروژه‌ی مقصد لازم دارد در بخش «نیازمندی‌ها» README همان کامپوننت ثبت می‌شود (نام، حداقل نسخه، Vanilla/React).
- نیازمندی پایه: Tailwind CSS v4؛ برای نسخه React: `react` ≥ 19.3 (آخرین stable: 19.3.1). پیش‌فرض: بدون Dependency اضافه؛ قبل از افزودن دلیل فنی بیاور.
- `pnpm-lock.yaml` را دستی ویرایش نکن.
- **فهرست‌های مرکزی:** افزودن/تغییر نام/حذف کامپوننت ⇒ هم‌زمان لینک در `README.md` ریشه (خط `- کامپوننت‌ها:`) و ردیف `docs/ROADMAP.md` را به‌روز کن (`pnpm new` خودکار اضافه می‌کند؛ `pnpm check:docs` کنترل می‌کند؛ پایان کار ⇒ تیک ROADMAP).
- مستندات: هر کامپوننت یک `README.md` (معرفی، نمونه استفاده، روش کپی + نیازمندی‌ها، Options، Theme Tokens، محدودیت‌ها). docs/ فقط سه فایل: COMPONENT-STANDARD، DEVELOPMENT، ROADMAP. تغییر معماری/API ⇒ مستندات همان لحظه. زبان مستندات فارسی؛ کد، دستورها و **همه‌ی کامنت‌های کد انگلیسی** (کامنت فارسی در کد ممنوع).
- بررسی پیش از اتمام: `pnpm build` (check:css + check:docs + tsc + next build) و دیدن کامپوننت در سایت (`pnpm dev`، تب React و Vanilla)؛ موارد بررسی‌نشده را گزارش کن.
