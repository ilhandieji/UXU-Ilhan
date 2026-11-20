# Dependencyها، مستندات و بررسی

- یک `package.json` در ریشه؛ بدون workspace. ابزار و وابستگی‌ها فقط با `pnpm add -D <dep>` در ریشه (برای Playground و type-check).
- کامپوننت‌ها پکیج نیستند؛ هر Dependency که پروژه‌ی مقصد لازم دارد در بخش «نیازمندی‌ها» README همان کامپوننت ثبت می‌شود (نام، حداقل نسخه، Vanilla/React).
- نیازمندی پایه: Tailwind CSS v4؛ React برای نسخه React. پیش‌فرض: بدون Dependency اضافه؛ قبل از افزودن دلیل فنی بیاور.
- `pnpm-lock.yaml` را دستی ویرایش نکن.
- مستندات: هر کامپوننت یک `README.md` (معرفی، نمونه استفاده، روش کپی + نیازمندی‌ها، Options، Theme Tokens، محدودیت‌ها). docs/ فقط سه فایل: COMPONENT-STANDARD، DEVELOPMENT، ROADMAP. تغییر معماری/API ⇒ مستندات همان لحظه. زبان فارسی؛ کد و دستورها انگلیسی.
- بررسی پیش از اتمام: `pnpm build` (check:css + tsc + next build) و دیدن کامپوننت در سایت (`pnpm dev`، تب React و Vanilla)؛ موارد بررسی‌نشده را گزارش کن.
