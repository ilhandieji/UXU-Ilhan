// تنظیمات و نوع‌های Terminal — نام‌ها باید با نسخه React یکی باشد. spec: ../README.md
// استایل فقط با Tailwind: مقدار توکن‌ها اینجاست و با CSS Variable روی root ست می‌شود.

export type TerminalThemeName = 'matrix' | 'classic-black' | 'amber' | 'light';
export type TerminalVariant = 'window' | 'fullscreen' | 'minimal';
export type TerminalSize = 'sm' | 'md' | 'lg';

/** کلید توکن بدون پیشوند --ux-terminal- ؛ مثل { bg: '#000', accent: '#0f0' } */
export type TerminalTokens = Record<string, string>;

/** خروجی کامند: متن، چند خط، یا هیچ */
export type TerminalCommand = (args: string[]) => string | string[] | void;

export interface TerminalOptions {
  theme?: TerminalThemeName | TerminalTokens;
  variant?: TerminalVariant;
  size?: TerminalSize;
  /** درخشش سبز متن (green glow) */
  glow?: boolean;
  user?: string;
  host?: string;
  cwd?: string;
  /** عنوان نوار پنجره؛ پیش‌فرض user@host:cwd */
  title?: string;
  /** عنوان بزرگ بالای ترمینال؛ false = بدون بنر */
  banner?: string | false;
  subtitle?: string;
  /** خطوط وضعیت زیر بنر */
  boot?: { label: string; value: string }[];
  /** لیست راهنما (کامندهای معرفی‌شده) */
  help?: { name: string; description: string }[];
  placeholder?: string;
  /** کامندهای سفارشی؛ `help` و `clear` داخلی‌اند */
  commands?: Record<string, TerminalCommand>;
  onCommand?: (line: string) => void;
}

export const defaults = {
  theme: 'matrix',
  variant: 'window',
  size: 'md',
  glow: true,
  user: 'guest',
  host: 'portal',
  cwd: '~',
  title: '',
  banner: 'TERMINAL',
  subtitle: 'Terminal v1.0 — web shell',
  boot: [
    { label: 'session', value: 'ready' },
    { label: 'filesystem', value: 'mounted' },
    { label: 'matrix layer', value: 'listening' },
  ],
  help: [
    { name: 'help', description: 'command list' },
    { name: 'clear', description: 'clear screen' },
  ],
  placeholder: 'help · clear',
  commands: {} as Record<string, TerminalCommand>,
} satisfies TerminalOptions;

// ---- توکن‌ها ----

const common: TerminalTokens = {
  'font-family': "ui-monospace, 'JetBrains Mono', 'Fira Code', Menlo, Consolas, monospace",
  'line-height': '1.6',
  'letter-spacing': '0em',
  'banner-size': '2.3em',
  'banner-spacing': '0.32em',
  radius: '10px',
  shadow: '0 12px 36px rgb(0 0 0 / 0.45)',
  width: '100%',
  height: '340px',
  'dot-1': '#ff5f57',
  'dot-2': '#febc2e',
  'dot-3': '#28c840',
};

export const themes: Record<TerminalThemeName, TerminalTokens> = {
  matrix: {
    ...common,
    bg: '#020402', fg: '#b6ffc8', dim: '#3fbf63', accent: '#00ff41', cursor: '#00ff41', selection: 'rgb(0 255 65 / 0.25)',
    error: '#ff4d4d', 'titlebar-bg': '#07110a', 'titlebar-fg': '#2c8f47', border: '#0f3a1c',
    glow: '0 0 1px rgb(0 255 65 / 0.35)',
    'glow-strong': '0 0 6px rgb(0 255 65 / 0.45)',
  },
  'classic-black': {
    ...common,
    bg: '#000000', fg: '#e6e6e6', dim: '#7a7a7a', accent: '#ffffff', cursor: '#ffffff', selection: 'rgb(255 255 255 / 0.2)',
    error: '#ff4d4d', 'titlebar-bg': '#111111', 'titlebar-fg': '#7a7a7a', border: '#2a2a2a',
    glow: 'none',
    'glow-strong': '0 0 6px rgb(255 255 255 / 0.25)',
  },
  amber: {
    ...common,
    bg: '#0b0700', fg: '#ffd9a0', dim: '#8a6a2a', accent: '#ffb000', cursor: '#ffb000', selection: 'rgb(255 176 0 / 0.25)',
    error: '#ff5a4d', 'titlebar-bg': '#150e02', 'titlebar-fg': '#8a6a2a', border: '#3a2a08',
    glow: '0 0 1px rgb(255 176 0 / 0.35)',
    'glow-strong': '0 0 6px rgb(255 176 0 / 0.45)',
  },
  light: {
    ...common,
    bg: '#f6faf6', fg: '#1b2a1f', dim: '#6b8a73', accent: '#0a7d2c', cursor: '#0a7d2c', selection: 'rgb(10 125 44 / 0.2)',
    error: '#c62828', 'titlebar-bg': '#e6f0e8', 'titlebar-fg': '#6b8a73', border: '#cfe3d4',
    shadow: '0 8px 24px rgb(0 0 0 / 0.12)', glow: 'none', 'glow-strong': 'none',
  },
};

export const sizes: Record<TerminalSize, TerminalTokens> = {
  sm: { 'font-size': '12px', padding: '12px' },
  md: { 'font-size': '14px', padding: '18px' },
  lg: { 'font-size': '17px', padding: '22px' },
};

export const variants: Record<TerminalVariant, TerminalTokens> = {
  window: {},
  fullscreen: { radius: '0px', width: '100vw', height: '100vh' },
  minimal: { shadow: 'none', radius: '4px' },
};

/** کلاس‌های Tailwind v4 — رشته‌ی کامل و استاتیک (تا scanner ببیند) */
export const classes = {
  root: 'relative box-border flex flex-col overflow-hidden border border-(color:--ux-terminal-border) bg-(color:--ux-terminal-bg) text-(color:--ux-terminal-accent) font-(family-name:--ux-terminal-font-family) text-(length:--ux-terminal-font-size) leading-(--ux-terminal-line-height) tracking-(--ux-terminal-letter-spacing) rounded-(--ux-terminal-radius) w-(--ux-terminal-width) [box-shadow:var(--ux-terminal-shadow)] selection:bg-(color:--ux-terminal-selection)',
  bar: 'relative flex h-10 shrink-0 items-center border-b border-(color:--ux-terminal-border) bg-(color:--ux-terminal-titlebar-bg) px-3.5',
  dots: 'flex gap-2',
  dot: ['size-3 rounded-full bg-(color:--ux-terminal-dot-1)', 'size-3 rounded-full bg-(color:--ux-terminal-dot-2)', 'size-3 rounded-full bg-(color:--ux-terminal-dot-3)'],
  title: 'pointer-events-none absolute inset-x-0 truncate px-20 text-center text-[0.9em] text-(color:--ux-terminal-titlebar-fg)',
  screen: 'h-(--ux-terminal-height) cursor-text overflow-y-auto [scrollbar-width:thin] [scrollbar-color:var(--ux-terminal-dim)_transparent] p-(--ux-terminal-padding) [text-shadow:var(--ux-terminal-glow)]',
  banner: '[text-shadow:var(--ux-terminal-glow-strong)] font-extrabold text-(length:--ux-terminal-banner-size) tracking-(--ux-terminal-banner-spacing) leading-tight',
  dim: 'text-(color:--ux-terminal-dim)',
  bright: 'text-(color:--ux-terminal-fg)',
  error: 'text-(color:--ux-terminal-error)',
  gap: 'h-3',
  line: 'whitespace-pre-wrap break-words',
  helpRow: 'flex gap-6',
  helpName: 'w-28 shrink-0 text-(color:--ux-terminal-fg)',
  row: 'flex items-center gap-2',
  prompt: 'shrink-0 whitespace-pre [text-shadow:var(--ux-terminal-glow-strong)]',
  input: 'min-w-0 flex-1 border-0 bg-transparent p-0 font-[inherit] text-[inherit] text-(color:--ux-terminal-fg) outline-none caret-(color:--ux-terminal-cursor) [text-shadow:inherit] placeholder:text-(color:--ux-terminal-dim)',
};

/** ترکیب توکن‌ها: theme ← size ← variant ← glow ← override کاربر (اگر theme آبجکت باشد) */
export function resolveTokens({ theme, size, variant, glow }: Required<Pick<TerminalOptions, 'theme' | 'size' | 'variant' | 'glow'>>): Record<string, string> {
  const named = typeof theme === 'string';
  const base = (named ? themes[theme] : undefined) ?? themes[defaults.theme];
  const tokens = { ...base, ...sizes[size], ...variants[variant], ...(glow ? {} : { glow: 'none', 'glow-strong': 'none' }), ...(named ? {} : theme) };
  return Object.fromEntries(Object.entries(tokens).map(([key, value]) => [`--ux-terminal-${key}`, value]));
}
