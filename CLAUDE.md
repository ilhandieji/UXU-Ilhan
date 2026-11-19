@AGENTS.md

# CLAUDE.md — مکمل AGENTS.md

`AGENTS.md` مرجع اصلی معماری است. این فایل فقط تصمیم‌های تکمیلی و فهرست rules/agents را ثبت می‌کند. در صورت تضاد، پیش از نقض قانون از کاربر سؤال کن.

## تصمیم‌های تکمیلی
- **Vanilla با TypeScript (`.ts`) نوشته می‌شود** (بدون TSX و بدون React). عبارت «JavaScript استاندارد» در AGENTS.md به معنی «بدون فریم‌ورک» است؛ خروجی build، JS استاندارد است.
- **اصل Dynamic (اجباری برای هر کامپوننت):** رنگ، فونت، اندازه، variant و هر جنبه‌ی قابل‌تغییر دیگر باید از طریق Design Token (CSS Variables) و Options/Props قابل تنظیم باشد. جزئیات: `.claude/rules/theming-and-dynamic.md`. این اصل ساخت پلتفرم Playground (Phase 2) نیست.
- Terminal: ساختار پایه (کانسپت A — Window، سبز ماتریکسی) پیاده شده؛ کامندهای لینوکسی، Virtual FS، تم‌ها و variantهای بعدی فقط با درخواست صریح اضافه شوند.

## Rules (`.claude/rules/`)
| فایل | موضوع |
|---|---|
| `theming-and-dynamic.md` | توکن‌ها، theme/variant/size، قرارداد Dynamic |
| `tailwind.md` | قانون Tailwind-only (بدون فایل CSS) |
| `structure.md` | ساختار دوفایلی copy-paste، Vanilla/React، Playground، parity |
| `dependencies.md` | Dependencyها، مستندات، بررسی پایانی |

## Agents (`.claude/agents/`)
`component-architect` · `vanilla-implementer` · `react-implementer` · `parity-reviewer` · `docs-writer`

## ساخت کامپوننت جدید
`pnpm new <kebab-name>` (قالب: `templates/component/`) — هر نسخه فقط دو فایل بدون زیرپوشه: `<Name>.tsx`/`<name>.ts` + `<name>.config.ts`؛ کپی‌شدنی مثل shadcn/ui. استایل **فقط Tailwind v4** (`pnpm check:css`). دمو خودکار در Playground مرکزی ثبت می‌شود.

## دستورها
`pnpm dev:react` · `pnpm dev:vanilla` · `pnpm new <name>` · `pnpm build` (check:css + typecheck + build)

## جریان کار پیشنهادی
architect (spec و توکن‌ها) ← implementerها (هر کدام در پوشه‌ی خودشان) ← parity-reviewer ← docs-writer.
