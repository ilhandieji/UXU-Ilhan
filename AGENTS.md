# UXU-Ilhan — Project Master Instructions

این فایل مرجع اصلی معماری و استانداردهای پروژه است. پیش از هرگونه تغییر در ساختار یا پیاده‌سازی، آن را مطالعه کن.

در صورت تضاد درخواست موردی با قوانین این فایل، پیش از نقض قانون از کاربر سؤال کن.

---

# 0. Project Information

- **Project Name:** UXU-Ilhan
    
- **Repository Name:** ilhan-ui
    
- **Project Type:** Personal Frontend Component Library
    
- **Purpose:** ساخت، نگهداری و استفاده مجدد از کامپوننت‌های اختصاصی فرانت‌اند؛ هنگام کار روی پروژه‌ی اصلی، فایل کامپوننت را از اینجا کپی کن و برگرد.
    
- **Supported Implementations:**
    
    - Vanilla HTML / CSS / JavaScript
        
    - React / TypeScript / TSX
        
- **Package Manager:** pnpm
    
- **Distribution Model:** copy-paste (مثل shadcn/ui) — هر کامپوننت چند فایل است که مستقیم در پروژه‌ی دیگر کپی می‌شود، نه پکیج npm
    
- **Development Server:** Vite
    

## Current Development Phase

**Phase 1 — Component Development**

در حال حاضر هدف فقط توسعه کامپوننت‌ها و آزمایش مستقل آن‌ها است.

هیچ وب‌سایت مرکزی، داشبورد، گالری کامپوننت یا سیستم مدیریت آنلاین در این فاز ساخته نمی‌شود.

اولین کامپوننت پروژه Terminal است.

---

# 1. Core Architecture

## 1.1 Repository Architecture

- Repository یک پکیج ساده با **یک `package.json` در ریشه** است؛ Workspace و `package.json` جداگانه برای کامپوننت‌ها وجود ندارد. کامپوننت‌ها پکیج نیستند، **فایل** هستند.
- هر کامپوننت دو پیاده‌سازی کاملاً مجزا دارد: Vanilla و React.
- ابزار توسعه (Vite، TypeScript، Tailwind، React برای Playground) فقط یک‌بار در ریشه نصب می‌شود.
- اصل **copy-paste:** هر فایل کامپوننت باید بدون تغییر در پروژه‌ی دیگری (Next.js، Vite، HTML ساده) قابل کپی و استفاده باشد؛ import داخلی بدون پسوند (`./terminal.config`) و بدون alias.

## 1.2 Component Directory Structure

ساختار استاندارد هر کامپوننت:

```
components/<name>/
├── README.md                     # تنها README کامپوننت
├── react/
│   ├── <Name>.tsx                # کامپوننت
│   └── <name>.config.ts          # Options، پیش‌فرض‌ها، توکن‌ها، sizes/variants، کلاس‌های Tailwind
└── vanilla/
    ├── <name>.ts
    └── <name>.config.ts
```

- **هر نسخه دقیقاً دو فایل** (کامپوننت + `<name>.config.ts`) و **بدون هیچ زیرپوشه‌ای** (`src/` و ... ممنوع). فقط اگر فایلی واقعاً از حدود ۳۰۰ خط گذشت، یک فایل هم‌سطح کنارش اضافه شود.
- نام فایل تنظیمات شامل نام کامپوننت است تا چند کامپوننت در یک پوشه‌ی پروژه‌ی اصلی تداخل نداشته باشند.
- **استایل فقط با Tailwind CSS v4** (قانون §5.3)؛ فایل CSS ندارد.
- کامپوننت‌ها ساده، تک‌منظوره و خوانا (به سبک shadcn/ui و reactbits.dev)؛ بدون `index.ts` واسط یا لایه‌ی انتزاعی.
- `package.json`، `tsconfig`، `vite.config`، `index.html` و Playground **داخل پوشه‌ی کامپوننت نیستند** (Playground مرکزی §4).
- **کامپوننت جدید همیشه با `pnpm new <kebab-name>` ساخته می‌شود** (از `templates/component/`)؛ دستی ساختن ممنوع. اگر قالب نیاز به تغییر دارد، خود قالب را اصلاح کن.
- قاعده‌ی «بدون زیرپوشه» و Tailwind-only با `pnpm check:css` بررسی می‌شود.

---

# 2. Framework Separation

## 2.1 Vanilla Implementation

- استفاده از HTML، CSS و JavaScript استاندارد.
    
- بدون وابستگی به React یا فریم‌ورک‌های دیگر.
    
- بدون TSX.
    
- مستقل از پیاده‌سازی React.
    
- قابل مشاهده در Playground مرکزی Vanilla (`pnpm dev:vanilla`).
    
- امکان استفاده در پروژه‌های معمولی HTML و JavaScript.
    

## 2.2 React Implementation

- استفاده از React و TypeScript.
    
- کامپوننت‌ها با فرمت TSX نوشته شوند.
    
- استفاده از React API و قابلیت‌های استاندارد آن.
    
- مستقل از پیاده‌سازی Vanilla.
    
- قابل مشاهده در Playground مرکزی React (`pnpm dev:react`).
    
- سازگاری با پروژه‌های React و Next.js.
    

## 2.3 Strict Separation Rules

این دو نسخه نباید به یکدیگر وابستگی اجرایی داشته باشند.

قوانین:

- Vanilla نباید React را Import کند.
    
- React نباید برای اجرای کامپوننت به محیط Vanilla نیاز داشته باشد.
    
- از React Wrapper برای تبدیل Vanilla به React استفاده نکن.
    
- از Web Components و Lit به‌عنوان معماری اجباری استفاده نکن.
    
- پیاده‌سازی یکی را به‌عنوان خروجی کامپایل‌شده دیگری در نظر نگیر.
    
- منطق و رابط کاربری هر نسخه باید به‌صورت مستقل پیاده‌سازی شود.
    

هر دو نسخه باید از نظر قابلیت‌ها و رفتار مورد انتظار با یکدیگر سازگار باشند، اما کدهایشان مستقل باقی بمانند.

کد مشترک فقط در صورت وجود منطق واقعاً مستقل از فریم‌ورک و با توجیه فنی استفاده شود. ایجاد اجباری Shared Layer لازم نیست.

---

# 3. Dependency Management

هر کامپوننت ممکن است به کتابخانه‌ای نیاز داشته باشد (مثلاً Three.js یا GSAP). چون کامپوننت‌ها فایل‌اند و در پروژه‌ی دیگر کپی می‌شوند، مدیریت وابستگی این‌گونه است:

## 3.1 نیازمندی‌های کامپوننت
- هر Dependency که کامپوننت در پروژه‌ی مقصد لازم دارد در بخش **«نیازمندی‌ها»** در README همان کامپوننت ثبت شود (نام، نسخه‌ی حداقل، کدام نسخه: Vanilla/React/هر دو).
- نیازمندی پایه‌ی همه: Tailwind CSS v4؛ و برای React: `react` (و `'use client'` برای Next.js).
- پیش‌فرض: بدون Dependency اضافه. قبل از افزودن، دلیل فنی و راه‌حل بدون کتابخانه را بسنج.

## 3.2 Root (Playground)
- همه‌ی ابزارها و وابستگی‌ها فقط در `package.json` ریشه نصب می‌شوند (`devDependencies`)، چون فقط Playground و type-check از آن‌ها استفاده می‌کنند: `pnpm add -D <dep>`.
- Dependency اختصاصی یک کامپوننت هم در ریشه نصب و در README آن کامپوننت ثبت می‌شود.
- `pnpm-lock.yaml` را دستی ویرایش نکن.

---

# 4. Development Environment (Playground مرکزی)

`playground/` محیط محلی توسعه است: یک صفحه‌ی Vite با HMR که کامپوننت‌ها را هنگام نوشتن در مرورگر نشان می‌دهد. دو Playground مستقل وجود دارد:

```
playground/
├── react/    index.html  main.tsx  demos.tsx  index.css  vite.config.ts
└── vanilla/  index.html  main.ts   demos.ts   index.css  vite.config.ts
```

- `pnpm dev:react` و `pnpm dev:vanilla` جداگانه اجرا و متوقف می‌شوند (Vanilla به React نیازی ندارد).
- `demos.ts[x]` فهرست دموهای کامپوننت‌هاست؛ `pnpm new` ورودی جدید را خودکار اضافه می‌کند. انتخاب دمو با `?c=<name>`.
- `index.css` تنها فایل CSS معمولی است (`@import "tailwindcss"; @source "../../components";`).
- Playground صرفاً محیط آزمایش است و نباید به محصول، گالری یا وب‌سایت تبدیل شود (Phase 2).

---

# 5. Component Development Standards

تمام کامپوننت‌ها باید استانداردهای زیر را رعایت کنند:

- کد خوانا و قابل نگهداری باشد.
    
- از پیچیدگی و Abstraction غیرضروری خودداری شود.
    
- ساختار فایل‌ها متناسب با پیچیدگی کامپوننت انتخاب شود.
    
- هیچ Component نباید به فایل‌های داخلی و خصوصی Component دیگری وابسته شود.
    
- استایل‌های هر کامپوننت تا حد امکان از محیط میزبان مستقل باشند.
    
- از Global CSS غیرضروری خودداری شود (قانون Tailwind-only در §5.3).
    
- قابلیت استفاده مجدد در پروژه‌های مختلف حفظ شود.
    
- Props و API عمومی هر نسخه مستند شوند.
    
- ورودی‌ها و رفتارهای غیرمعتبر مدیریت شوند.
    
- Accessibility و Responsive Design در صورت مرتبط بودن رعایت شوند.
    
- از Dependency جدید بدون دلیل فنی استفاده نشود.
    

## 5.3 Tailwind-only (قانون اجباری)

- استایل هر کامپوننت و هر فایل **فقط با Tailwind CSS v4** نوشته می‌شود؛ در React اجباری و در Vanilla هم همان قانون (استثنا فقط وقتی Tailwind نمی‌تواند، مثل `@keyframes` سفارشی).
- فایل `.css` در پوشه‌ی کامپوننت، تگ `<style>`، `@apply` و CSS-in-JS ممنوع. استثنای CSS خام: فایل با خط اول `/* tailwind-exception: <دلیل> */` و ثبت دلیل در README.
- مقدار Dynamic (رنگ، فونت، اندازه، ...) = CSS Variable `--ux-<name>-*` ست‌شده از JS و مصرف‌شده با کلاس Tailwind (مثل `bg-(color:--ux-terminal-bg)`)؛ مقدار توکن‌ها در `<name>.config.ts`.
- کلاس‌ها رشته‌ی کامل و استاتیک باشند. تنها CSS معمولی: `playground/*/index.css`. پروژه‌ی مقصد باید Tailwind v4 داشته باشد و مسیر کامپوننت را اسکن کند.
- `tailwindcss` و `@tailwindcss/vite` در devDependencies ریشه.
- بررسی خودکار: `pnpm check:css` (بخشی از `pnpm build`). جزئیات: `.claude/rules/tailwind.md`.

## 5.1 Vanilla Compatibility

کامپوننت‌های Vanilla باید در محیط‌های معمولی HTML و JavaScript قابل استفاده باشند.

نباید برای اجرای آن‌ها به زیرساخت Next.js یا React نیاز باشد.

## 5.2 React Compatibility

کامپوننت‌های React باید API و Props استاندارد و Type-Safe داشته باشند.

مرز Server و Client در Next.js باید در صورت لزوم رعایت شود.

---

# 6. Documentation Standards

هر کامپوننت **یک** `README.md` در `components/<name>/` دارد (README جدا برای Vanilla/React نیست).

حداقل اطلاعات موردنیاز:

- معرفی و قابلیت‌ها
    
- روش کپی در پروژه‌ی دیگر و «نیازمندی‌ها»
    
- نمونه استفاده Vanilla و React
    
- جدول Options و Theme Tokens
    
- Dependencyها، محدودیت‌ها و نکات فنی
    

مستندات اصلی Repository:

```
docs/
├── COMPONENT-STANDARD.md   # معماری + استاندارد + قرارداد Dynamic
├── DEVELOPMENT.md          # Playground، pnpm new، Dependencyها
└── ROADMAP.md
```

محتوای این مستندات باید با معماری واقعی پروژه هماهنگ باشد.

---

# 7. Testing and Validation

هر پیاده‌سازی باید به‌صورت مستقل آزمایش شود.

- Vanilla و React جداگانه تست شوند.
    
- عملکرد اصلی دو نسخه با یکدیگر مقایسه شود.
    
- تغییر در یک نسخه نباید باعث خرابی نسخه دیگر شود.
    
- وابستگی‌های نصب‌شده بررسی شوند.
    
- Build و اجرای Production در صورت تعریف شدن بررسی شود.
    
- خطاهای TypeScript در نسخه React بررسی شوند.
    
- رفتارهای اصلی کامپوننت تست شوند.
    

حداقل بررسی: `pnpm build` (شامل `check:css` و `tsc`) و دیدن کامپوننت در هر دو Playground. ابزار تست فقط وقتی تست واقعی نوشته می‌شود اضافه شود (در ریشه)، و فایل تست کنار کامپوننت قرار نمی‌گیرد مگر با هماهنگی.

---

# 8. Repository Structure

ساختار کلی Repository باید به شکل زیر باشد:

```
ilhan-ui/
├── components/<name>/     # فقط فایل‌های کامپوننت (§1.2)
├── playground/            # react/ و vanilla/ (§4)
├── templates/component/   # قالب pnpm new
├── scripts/               # new-component.mjs · check-tailwind.mjs
├── docs/                  # COMPONENT-STANDARD, DEVELOPMENT, ROADMAP
├── package.json  tsconfig.json  pnpm-lock.yaml
├── AGENTS.md  CLAUDE.md  README.md  .gitignore
└── .claude/{rules,agents}
```

با اضافه شدن کامپوننت‌های آینده، فقط فولدر مربوط به آن‌ها به `components/` (و یک ورودی دمو به Playground) اضافه می‌شود.

---

# 9. Development Roadmap

## Phase 1 — Component Development (Current)

هدف: ایجاد زیرساخت و توسعه اولین کامپوننت.

کارهای این فاز:

1. آماده‌سازی Repository، Playground مرکزی و `pnpm new`.
    
2. ایجاد ساختار اولین کامپوننت با نام Terminal.
    
3. ایجاد پیاده‌سازی مستقل Vanilla.
    
4. ایجاد پیاده‌سازی مستقل React.
    
5. ثبت دمو در هر دو Playground.
    
6. ثبت نیازمندی‌ها در README.
    
7. تست و مستندسازی کامپوننت.
    

در این فاز فقط روی توسعه کامپوننت‌ها تمرکز کن.

## Phase 2 — Component Playground Platform (Future)

این فاز فعلاً خارج از محدوده توسعه است.

قابلیت‌های احتمالی:

- وب‌سایت مرکزی نمایش کامپوننت‌ها.
    
- Live Preview.
    
- تغییر Dynamic رنگ‌ها.
    
- تغییر فونت و سایر Design Tokens.
    
- تنظیم Props از طریق UI.
    
- مشاهده سورس Vanilla و React.
    
- نمایش و مقایسه کدها.
    
- انتخاب نسخه و نوع Styling.
    

تا زمانی که کاربر صریحاً شروع این فاز را درخواست نکرده، هیچ‌کدام از این قابلیت‌ها را پیاده‌سازی نکن.

## Phase 3 — Distribution (Future)

این فاز نیز فعلاً خارج از محدوده است.

قابلیت‌های احتمالی:

- انتشار Packageها.
    
- مستندات نصب و استفاده.
    
- نسخه‌بندی.
    
- آماده‌سازی خروجی برای استفاده در پروژه‌های خارجی.
    

---

# 10. Strict Project Rules

1. معماری فعلی را بدون دلیل تغییر نده.
    
2. برای قابلیت‌های آینده زودتر از موعد زیرساخت نساز.
    
3. هیچ وب‌سایت مرکزی یا داشبوردی در Phase 1 ایجاد نکن.
    
4. هیچ کامپوننت نمونه اضافی برای پر کردن Repository نساز.
    
5. Vanilla و React را مستقل نگه دار.
    
6. نیازمندی‌های هر کامپوننت را در README خودش ثبت کن.
    
7. فایل‌های کامپوننت را copy-paste-پذیر نگه دار (بدون زیرپوشه، بدون alias، بدون وابستگی به فایل خارج از پوشه‌ی همان نسخه).
    
8. Playground React و Vanilla باید مستقلاً قابل اجرا باشند.
    
9. کدهای موجود را بدون بررسی کامل تغییر نده.
    
10. پیش از Refactor گسترده، تأثیر آن بر هر دو نسخه را بررسی کن.
    
11. مستندات را هم‌زمان با تغییرات معماری به‌روز نگه دار.
    
12. از Overengineering و Abstraction زودهنگام خودداری کن.
    

---

# 11. Working Method

قبل از شروع هر وظیفه:

1. `CLAUDE.md` و مستندات مرتبط را بخوان.
    
2. ساختار فعلی کامپوننت را بررسی کن.
    
3. نیازمندی‌های README و `package.json` ریشه را بررسی کن.
    
4. مشخص کن تغییر موردنظر مربوط به Vanilla، React یا هر دو است.
    
5. تغییرات را در محدوده همان کامپوننت نگه دار.
    

هنگام توسعه:

- به جای بازنویسی غیرضروری، ساختار موجود را حفظ کن.
    
- تغییرات معماری را بدون هماهنگی اعمال نکن.
    
- وابستگی جدید را بدون بررسی نیاز واقعی اضافه نکن.
    
- قابلیت‌های خارج از درخواست را خودسرانه پیاده‌سازی نکن.
    

پس از اتمام:

- `pnpm build` و هر دو Playground را بررسی کن.
    
- خطاهای مربوط به Build و Runtime را برطرف کن.
    
- README مربوطه را به‌روز کن.
    
- نتیجه و فایل‌های تغییرکرده را گزارش بده.
    

**اصل نهایی پروژه:**

UXU-Ilhan یک مجموعه از کامپوننت‌های مستقل و قابل استفاده مجدد است. کیفیت، استقلال، قابلیت نگهداری و امکان توسعه هر کامپوننت در اولویت قرار دارد. توسعه زیرساخت‌های آینده نباید مانع ساخت و آزمایش کامپوننت فعلی شود.