# __Name__

توضیح کوتاه: این کامپوننت چه کاری انجام می‌دهد.

## فایل‌ها (برای کپی)
| نسخه | فایل‌ها |
|---|---|
| React | `react/__Name__.tsx` · `react/__name__.config.ts` |
| Vanilla | `vanilla/__name__.ts` · `vanilla/__name__.config.ts` |

هر دو فایل یک نسخه را کنار هم در پروژه‌ی خودت کپی کن (مثلاً `components/ui/`).

## نیازمندی‌ها
- Tailwind CSS v4 (اگر مسیر کپی را خودکار اسکن نمی‌کند: `@source "./components/ui";`)
- React: `react` ≥ 18 (Next.js: آماده با `'use client'`)

## استفاده
React:
```tsx
import { __Name__ } from './__Name__'

<__Name__ theme="dark" size="md" />
```
Vanilla:
```ts
import { create__Name__ } from './__name__';

const inst = create__Name__(container, { theme: 'dark', size: 'md' });
inst.update({ theme: { bg: '#000', fg: '#0f0' } });
inst.destroy();
```

## Options
| نام | نوع | پیش‌فرض | توضیح |
|---|---|---|---|
| `theme` | `'dark' \| 'light' \| Partial<Tokens>` | `'dark'` | preset یا توکن‌های سفارشی |
| `variant` | `'default' \| 'outline'` | `'default'` | |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | |
| `label` | `string` | `'__Name__'` | |

## توکن‌ها (CSS Variables)
مقدارها در `__name__.config.ts` (`themes`, `sizes`, `variants`) و روی root ست می‌شوند:
`--ux-__name__-bg`, `-fg`, `-border`, `-border-width`, `-font-family`, `-font-size`, `-padding`, `-radius`

## توسعه
`pnpm dev:react` یا `pnpm dev:vanilla` ← `?c=__name__`

## محدودیت‌ها
—
