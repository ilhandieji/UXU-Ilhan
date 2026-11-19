// تنظیمات و نوع‌های __Name__ — نام‌ها باید با نسخه React یکی باشد.
// استایل فقط با Tailwind: مقدار توکن‌ها اینجاست و با CSS Variable روی root ست می‌شود.

export type __Name__ThemeName = 'dark' | 'light';
export type __Name__Variant = 'default' | 'outline';
export type __Name__Size = 'sm' | 'md' | 'lg';

/** کلید توکن بدون پیشوند --ux-__name__- ؛ مثل { bg: '#000' } */
export type __Name__Tokens = Record<string, string>;

export interface __Name__Options {
  theme?: __Name__ThemeName | __Name__Tokens;
  variant?: __Name__Variant;
  size?: __Name__Size;
  label?: string;
}

export const defaults = {
  theme: 'dark',
  variant: 'default',
  size: 'md',
  label: '__Name__',
} satisfies __Name__Options;

export const themes: Record<__Name__ThemeName, __Name__Tokens> = {
  dark: { bg: '#111111', fg: '#ffffff', border: '#333333', 'font-family': 'system-ui, sans-serif', radius: '8px' },
  light: { bg: '#ffffff', fg: '#111111', border: '#d4d4d4', 'font-family': 'system-ui, sans-serif', radius: '8px' },
};

export const sizes: Record<__Name__Size, __Name__Tokens> = {
  sm: { 'font-size': '13px', padding: '8px' },
  md: { 'font-size': '16px', padding: '12px' },
  lg: { 'font-size': '20px', padding: '16px' },
};

export const variants: Record<__Name__Variant, __Name__Tokens> = {
  default: { 'border-width': '0px' },
  outline: { 'border-width': '1px' },
};

/** کلاس‌های Tailwind v4 — رشته‌ی کامل و استاتیک (تا scanner ببیند) */
export const rootClass =
  'bg-(color:--ux-__name__-bg) text-(color:--ux-__name__-fg) border-(color:--ux-__name__-border) border-(length:--ux-__name__-border-width) font-(family-name:--ux-__name__-font-family) text-(length:--ux-__name__-font-size) p-(--ux-__name__-padding) rounded-(--ux-__name__-radius)';

/** ترکیب توکن‌ها: theme ← size ← variant ← override کاربر (اگر theme آبجکت باشد) */
export function resolveTokens({ theme, size, variant }: Required<Pick<__Name__Options, 'theme' | 'size' | 'variant'>>): Record<string, string> {
  const named = typeof theme === 'string';
  const base = (named ? themes[theme] : undefined) ?? themes[defaults.theme];
  const tokens = { ...base, ...sizes[size], ...variants[variant], ...(named ? {} : theme) };
  return Object.fromEntries(Object.entries(tokens).map(([key, value]) => [`--ux-__name__-${key}`, value]));
}
