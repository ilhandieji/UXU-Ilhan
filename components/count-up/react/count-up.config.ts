// CountUp settings and types — names must match the Vanilla version.
// Styling is Tailwind-only: token values live here and are set as CSS variables `--ux-count-up-*`
// on the root, then consumed by the static Tailwind classes below.

export type CountUpThemeName = "plain" | "neon" | "gold" | "mono";
export type CountUpSize = "sm" | "md" | "lg" | "xl";
export type CountUpEasing = "linear" | "easeOut" | "easeInOut" | "spring" | "expo";
/** mount: start when mounted · inView: start when scrolled into view · manual: wait for start() */
export type CountUpTrigger = "mount" | "inView" | "manual";
export type CountUpNotation = "standard" | "compact";
export type CountUpTag =
  | "span"
  | "div"
  | "p"
  | "strong"
  | "b"
  | "em"
  | "data"
  | "output"
  | "dd"
  | "dt"
  | "li"
  | "td"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6";

/** Token keys without the --ux-count-up- prefix, e.g. { fg: '#fff' } */
export type CountUpTokens = Record<string, string>;

export interface CountUpOptions {
  /** Preset name or a partial token object (merged over the default preset) */
  theme?: CountUpThemeName | CountUpTokens;
  size?: CountUpSize;
  /** Start value */
  from?: number;
  /** End value */
  to?: number;
  /** Animation length in seconds */
  duration?: number;
  /** Seconds to wait before the first animation starts */
  delay?: number;
  easing?: CountUpEasing;
  /** Fixed number of fraction digits */
  decimals?: number;
  /** BCP 47 locale for Intl.NumberFormat, e.g. "en-US", "fa-IR" (Persian digits), "de-DE" */
  locale?: string;
  /** Use locale grouping separators (12,480) */
  separator?: boolean;
  notation?: CountUpNotation;
  /** ISO 4217 code (e.g. "USD"); empty = plain number */
  currency?: string;
  prefix?: string;
  suffix?: string;
  trigger?: CountUpTrigger;
  /** inView only: false = run again every time the number enters the viewport */
  once?: boolean;
  /** inView only: visible fraction (0–1) needed to start */
  threshold?: number;
  /** Root element tag */
  as?: CountUpTag;
  /** true = show the final value without animating when the user prefers reduced motion */
  respectReducedMotion?: boolean;
  /** true = screen readers announce the final value (aria-live="polite") after each run */
  ariaLive?: boolean;
  /** Called with the final value when an animation finishes */
  onComplete?: (value: number) => void;
}

export const defaults = {
  theme: "plain",
  size: "md",
  from: 0,
  to: 1000,
  duration: 2,
  delay: 0,
  easing: "easeOut",
  decimals: 0,
  locale: "en-US",
  separator: true,
  notation: "standard",
  currency: "",
  prefix: "",
  suffix: "",
  trigger: "inView",
  once: true,
  threshold: 0.3,
  as: "span",
  respectReducedMotion: true,
  ariaLive: false,
} satisfies CountUpOptions;

export const themes: Record<CountUpThemeName, CountUpTokens> = {
  plain: {
    fg: "currentColor",
    "prefix-color": "currentColor",
    "font-family": "inherit",
    "font-weight": "700",
    "letter-spacing": "-0.02em",
    glow: "none",
  },
  neon: {
    fg: "#7df9ff",
    "prefix-color": "#ff4fd8",
    "font-family": "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    "font-weight": "700",
    "letter-spacing": "0em",
    glow: "0 0 6px currentColor, 0 0 24px currentColor",
  },
  gold: {
    fg: "#f5c451",
    "prefix-color": "#fff1c2",
    "font-family": "Georgia, 'Times New Roman', serif",
    "font-weight": "700",
    "letter-spacing": "0em",
    glow: "0 0 18px rgb(245 196 81 / 0.45)",
  },
  mono: {
    fg: "#e5e5e5",
    "prefix-color": "#8a8a8a",
    "font-family": "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    "font-weight": "500",
    "letter-spacing": "-0.04em",
    glow: "none",
  },
};

export const sizes: Record<CountUpSize, CountUpTokens> = {
  sm: { "font-size": "24px" },
  md: { "font-size": "36px" },
  lg: { "font-size": "48px" },
  xl: { "font-size": "72px" },
};

/** Tailwind v4 classes — complete, static strings (so the scanner can see them) */
export const classes = {
  root: "inline-block whitespace-nowrap leading-none tabular-nums text-(color:--ux-count-up-fg) font-(family-name:--ux-count-up-font-family) text-(length:--ux-count-up-font-size) font-(weight:--ux-count-up-font-weight) tracking-(--ux-count-up-letter-spacing) text-shadow-(--ux-count-up-glow)",
  /** Animated digits; hidden from screen readers (they read `srOnly` instead) */
  display: "inline-block",
  affix: "text-(color:--ux-count-up-prefix-color)",
  srOnly: "sr-only",
};

export const easings: Record<CountUpEasing, (t: number) => number> = {
  linear: (t) => t,
  easeOut: (t) => 1 - (1 - t) ** 3,
  easeInOut: (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2),
  // Damped oscillation: overshoots the target slightly, then settles
  spring: (t) => (t >= 1 ? 1 : 1 - Math.exp(-6 * t) * Math.cos(t * Math.PI * 2.5)),
  expo: (t) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t)),
};

const TAGS: readonly CountUpTag[] = [
  "span",
  "div",
  "p",
  "strong",
  "b",
  "em",
  "data",
  "output",
  "dd",
  "dt",
  "li",
  "td",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
];

/** Everything the component needs, validated */
export type CountUpSettings = Required<Omit<CountUpOptions, "theme" | "size" | "onComplete">> & {
  onComplete?: (value: number) => void;
};

const warned = new Set<string>();
function warn(message: string) {
  if (warned.has(message)) return;
  warned.add(message);
  console.warn(`[CountUp] ${message}`);
}

function num(value: unknown, fallback: number, min: number, max: number, name: string): number {
  if (value === undefined) return fallback;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    warn(`invalid ${name}: ${String(value)}, using ${fallback}`);
    return fallback;
  }
  return Math.min(max, Math.max(min, value));
}

function oneOf<T extends string>(value: unknown, list: readonly T[], fallback: T, name: string): T {
  if (value === undefined) return fallback;
  if (list.includes(value as T)) return value as T;
  warn(`invalid ${name}: ${String(value)}, using ${fallback}`);
  return fallback;
}

const bool = (value: unknown, fallback: boolean) => (typeof value === "boolean" ? value : fallback);
const str = (value: unknown, fallback: string) => (typeof value === "string" ? value : fallback);

function validLocale(value: unknown): string {
  const locale = str(value, defaults.locale).trim() || defaults.locale;
  try {
    Intl.NumberFormat.supportedLocalesOf(locale);
    return locale;
  } catch {
    warn(`invalid locale: ${locale}, using ${defaults.locale}`);
    return defaults.locale;
  }
}

function validCurrency(value: unknown): string {
  const code = str(value, defaults.currency).trim().toUpperCase();
  if (!code || /^[A-Z]{3}$/.test(code)) return code;
  warn(`invalid currency: ${code}, using none`);
  return "";
}

export function resolveSettings(options: CountUpOptions = {}): CountUpSettings {
  const o = { ...defaults, ...options };
  return {
    from: num(o.from, defaults.from, -Number.MAX_VALUE, Number.MAX_VALUE, "from"),
    to: num(o.to, defaults.to, -Number.MAX_VALUE, Number.MAX_VALUE, "to"),
    duration: num(o.duration, defaults.duration, 0, 60, "duration"),
    delay: num(o.delay, defaults.delay, 0, 60, "delay"),
    easing: oneOf(o.easing, Object.keys(easings) as CountUpEasing[], defaults.easing, "easing"),
    decimals: Math.round(num(o.decimals, defaults.decimals, 0, 20, "decimals")),
    locale: validLocale(o.locale),
    separator: bool(o.separator, defaults.separator),
    notation: oneOf(o.notation, ["standard", "compact"] as const, defaults.notation, "notation"),
    currency: validCurrency(o.currency),
    prefix: str(o.prefix, defaults.prefix),
    suffix: str(o.suffix, defaults.suffix),
    trigger: oneOf(o.trigger, ["mount", "inView", "manual"] as const, defaults.trigger, "trigger"),
    once: bool(o.once, defaults.once),
    threshold: num(o.threshold, defaults.threshold, 0, 1, "threshold"),
    as: oneOf(o.as, TAGS, defaults.as, "as"),
    respectReducedMotion: bool(o.respectReducedMotion, defaults.respectReducedMotion),
    ariaLive: bool(o.ariaLive, defaults.ariaLive),
    onComplete: o.onComplete,
  };
}

type FormatSettings = Pick<
  CountUpSettings,
  "locale" | "decimals" | "separator" | "notation" | "currency"
>;

// One Intl.NumberFormat per locale/options combination (creating one per frame is slow)
const formatters = new Map<string, Intl.NumberFormat>();

export function getFormatter(s: FormatSettings): Intl.NumberFormat {
  const key = `${s.locale}|${s.decimals}|${s.separator}|${s.notation}|${s.currency}`;
  let formatter = formatters.get(key);
  if (formatter) return formatter;
  const config: Intl.NumberFormatOptions = {
    minimumFractionDigits: s.decimals,
    maximumFractionDigits: s.decimals,
    useGrouping: s.separator,
    notation: s.notation,
  };
  if (s.currency) Object.assign(config, { style: "currency", currency: s.currency });
  try {
    formatter = new Intl.NumberFormat(s.locale, config);
  } catch {
    warn(`unsupported format (${key}), using ${defaults.locale} without currency`);
    formatter = new Intl.NumberFormat(defaults.locale, { ...config, style: "decimal" });
  }
  formatters.set(key, formatter);
  return formatter;
}

/** Number part only (without prefix/suffix) */
export const formatNumber = (value: number, s: FormatSettings) => getFormatter(s).format(value);

/** Full text for screen readers */
export const formatText = (value: number, s: CountUpSettings) =>
  `${s.prefix}${formatNumber(value, s)}${s.suffix}`;

/** Token merge order: theme ← size ← user override (when theme is an object) */
export function resolveTokens({
  theme = defaults.theme,
  size = defaults.size,
}: Pick<CountUpOptions, "theme" | "size">): Record<string, string> {
  const named = typeof theme === "string";
  if (named && !(theme in themes)) warn(`unknown theme: ${theme}, using ${defaults.theme}`);
  if (!(size in sizes)) warn(`invalid size: ${String(size)}, using ${defaults.size}`);
  const base = (named ? themes[theme as CountUpThemeName] : undefined) ?? themes[defaults.theme];
  const sized = sizes[size as CountUpSize] ?? sizes[defaults.size];
  const tokens = { ...base, ...sized, ...(named ? {} : theme) };
  return Object.fromEntries(
    Object.entries(tokens).map(([key, value]) => [`--ux-count-up-${key}`, value]),
  );
}
