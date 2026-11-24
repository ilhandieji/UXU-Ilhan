// Marquee settings and types — names must match the Vanilla version.
// Styling is Tailwind-only: token values live here and are set as CSS variables `--ux-marquee-*`
// on the root, then consumed by the static Tailwind classes below.

export type MarqueeThemeName = "dark" | "light" | "neon" | "outline";
/** plain: text only · pill: items in rounded pills · card: items in raised cards */
export type MarqueeVariant = "plain" | "pill" | "card";
export type MarqueeSize = "sm" | "md" | "lg";
export type MarqueeDirection = "left" | "right" | "up" | "down";

/** Token keys without the --ux-marquee- prefix, e.g. { bg: '#000' } */
export type MarqueeTokens = Record<string, string>;

export interface MarqueeOptions {
  theme?: MarqueeThemeName | MarqueeTokens;
  variant?: MarqueeVariant;
  size?: MarqueeSize;
  /** Text items; when empty the React children / the container's existing children are used */
  items?: string[];
  /** Pixels per second */
  speed?: number;
  /** left / right scroll horizontally, up / down vertically */
  direction?: MarqueeDirection;
  pauseOnHover?: boolean;
  pauseOnFocus?: boolean;
  /** Space between items: px number or any CSS length; empty = the `gap` token of the size */
  gap?: number | string;
  /** Fade the strip edges with a mask */
  fade?: boolean;
  /** Width of each faded edge in px */
  fadeSize?: number;
  /** Minimum number of content copies (more are added automatically to fill the strip) */
  repeat?: number;
  /** Run the other way while hovered (ignored when pauseOnHover is on) */
  reverseOnHover?: boolean;
  /** Drag / swipe to scrub, with a little momentum on release */
  draggable?: boolean;
  paused?: boolean;
  /** true: with prefers-reduced-motion the strip is static and scrollable */
  respectReducedMotion?: boolean;
  /** Text shown between items (e.g. "✦"); empty = none */
  separator?: string;
  /** 1–3 rows; every other row runs the opposite way */
  rows?: number;
  /** aria-label of the region */
  label?: string;
  /** Show the pause / play button (WCAG 2.2.2) */
  controls?: boolean;
  pauseLabel?: string;
  playLabel?: string;
}

export interface MarqueeHandle {
  pause(): void;
  play(): void;
  /** Flips between paused and playing */
  toggle(): void;
  /** Changes the speed (px/s) until the `speed` option changes again */
  setSpeed(speed: number): void;
}

export const defaults = {
  theme: "dark",
  variant: "pill",
  size: "md",
  items: [] as string[],
  speed: 60,
  direction: "left",
  pauseOnHover: true,
  pauseOnFocus: true,
  gap: "",
  fade: true,
  fadeSize: 48,
  repeat: 2,
  reverseOnHover: false,
  draggable: false,
  paused: false,
  respectReducedMotion: true,
  separator: "",
  rows: 1,
  label: "Scrolling content",
  controls: true,
  pauseLabel: "Pause animation",
  playLabel: "Play animation",
} satisfies MarqueeOptions;

export const themes: Record<MarqueeThemeName, MarqueeTokens> = {
  dark: {
    bg: "#0a0a0a",
    fg: "#fafafa",
    separator: "#737373",
    border: "#262626",
    "border-width": "1px",
    "item-bg": "#171717",
    "item-border": "#2e2e2e",
    "item-shadow": "0 10px 30px -12px rgb(0 0 0 / 0.7)",
    "font-family": "ui-sans-serif, system-ui, sans-serif",
    "font-weight": "600",
    radius: "16px",
  },
  light: {
    bg: "#ffffff",
    fg: "#0a0a0a",
    separator: "#a3a3a3",
    border: "#e5e5e5",
    "border-width": "1px",
    "item-bg": "#f5f5f5",
    "item-border": "#e5e5e5",
    "item-shadow": "0 8px 24px -14px rgb(0 0 0 / 0.35)",
    "font-family": "ui-sans-serif, system-ui, sans-serif",
    "font-weight": "600",
    radius: "16px",
  },
  neon: {
    bg: "#05010d",
    fg: "#f5d0fe",
    separator: "#22d3ee",
    border: "#3b0764",
    "border-width": "1px",
    "item-bg": "#14031f",
    "item-border": "#a21caf",
    "item-shadow": "0 0 18px -4px rgb(217 70 239 / 0.6)",
    "font-family": "ui-monospace, SFMono-Regular, Menlo, monospace",
    "font-weight": "700",
    radius: "12px",
  },
  outline: {
    bg: "transparent",
    fg: "#e5e5e5",
    separator: "#525252",
    border: "#404040",
    "border-width": "1px",
    "item-bg": "transparent",
    "item-border": "#525252",
    "item-shadow": "none",
    "font-family": "ui-sans-serif, system-ui, sans-serif",
    "font-weight": "500",
    radius: "16px",
  },
};

export const sizes: Record<MarqueeSize, MarqueeTokens> = {
  sm: {
    "font-size": "13px",
    padding: "8px",
    gap: "12px",
    height: "14rem",
    "control-size": "26px",
  },
  md: {
    "font-size": "16px",
    padding: "12px",
    gap: "16px",
    height: "18rem",
    "control-size": "30px",
  },
  lg: {
    "font-size": "22px",
    padding: "16px",
    gap: "24px",
    height: "22rem",
    "control-size": "34px",
  },
};

/** Item padding is in em so it follows the size's font-size */
export const variants: Record<MarqueeVariant, MarqueeTokens> = {
  plain: { "item-padding": "0px", "item-radius": "0px" },
  pill: { "item-padding": "0.4em 1em", "item-radius": "9999px" },
  card: { "item-padding": "1em 1.4em", "item-radius": "calc(var(--ux-marquee-radius) * 0.75)" },
};

/** Tailwind v4 classes — complete, static strings (so the scanner can see them) */
export const classes = {
  root: "relative block overflow-hidden border-solid bg-(color:--ux-marquee-bg) text-(color:--ux-marquee-fg) border-(color:--ux-marquee-border) border-(length:--ux-marquee-border-width) rounded-(--ux-marquee-radius) p-(--ux-marquee-padding) font-(family-name:--ux-marquee-font-family) text-(length:--ux-marquee-font-size) [font-weight:var(--ux-marquee-font-weight)]",
  rows: {
    horizontal: "flex flex-col gap-(--ux-marquee-gap)",
    vertical: "flex flex-row gap-(--ux-marquee-gap) h-(--ux-marquee-height)",
  },
  viewport: {
    horizontal: "relative min-w-0 overflow-hidden",
    vertical: "relative h-full min-w-0 flex-1 overflow-hidden",
  },
  /** Reduced motion: no animation, the strip scrolls natively instead */
  staticViewport: {
    horizontal: "relative min-w-0 overflow-x-auto",
    vertical: "relative h-full min-w-0 flex-1 overflow-y-auto",
  },
  // The mask colors are alpha stops only (black = visible), not visible colors
  fade: {
    horizontal:
      "[mask-image:linear-gradient(to_right,transparent,black_var(--ux-marquee-fade-size),black_calc(100%_-_var(--ux-marquee-fade-size)),transparent)]",
    vertical:
      "[mask-image:linear-gradient(to_bottom,transparent,black_var(--ux-marquee-fade-size),black_calc(100%_-_var(--ux-marquee-fade-size)),transparent)]",
  },
  drag: {
    horizontal: "cursor-grab select-none touch-pan-y active:cursor-grabbing",
    vertical: "cursor-grab select-none touch-pan-x active:cursor-grabbing",
  },
  track: {
    horizontal: "flex w-max translate-x-(--ux-marquee-offset) will-change-transform",
    vertical: "flex h-max flex-col translate-y-(--ux-marquee-offset) will-change-transform",
  },
  group: {
    horizontal: "flex shrink-0 items-center gap-(--ux-marquee-gap) pe-(--ux-marquee-gap)",
    vertical: "flex shrink-0 flex-col items-center gap-(--ux-marquee-gap) pb-(--ux-marquee-gap)",
  },
  item: {
    plain: "shrink-0 whitespace-nowrap",
    pill: "shrink-0 whitespace-nowrap border border-solid bg-(color:--ux-marquee-item-bg) border-(color:--ux-marquee-item-border) rounded-(--ux-marquee-item-radius) p-(--ux-marquee-item-padding)",
    card: "shrink-0 whitespace-nowrap border border-solid bg-(color:--ux-marquee-item-bg) border-(color:--ux-marquee-item-border) rounded-(--ux-marquee-item-radius) p-(--ux-marquee-item-padding) [box-shadow:var(--ux-marquee-item-shadow)]",
  } satisfies Record<MarqueeVariant, string>,
  separator: "shrink-0 select-none text-(color:--ux-marquee-separator)",
  control:
    "absolute z-10 inline-flex cursor-pointer items-center justify-center rounded-full border border-solid opacity-70 transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 top-(--ux-marquee-padding) end-(--ux-marquee-padding) size-(--ux-marquee-control-size) bg-(color:--ux-marquee-item-bg) text-(color:--ux-marquee-fg) border-(color:--ux-marquee-item-border) focus-visible:outline-(color:--ux-marquee-fg)",
  controlIcon: "size-1/2 fill-current",
};

/** SVG paths for the control button (24×24 viewBox) */
export const icons = {
  pause: "M7 5h3.5v14H7zM13.5 5H17v14h-3.5z",
  play: "M8 5.5v13l10.5-6.5z",
};

/** Everything the component needs, validated and merged */
export type MarqueeSettings = Required<Omit<MarqueeOptions, "theme" | "gap">> & {
  theme: MarqueeThemeName | MarqueeTokens;
  gap: string;
  vertical: boolean;
};

const warned = new Set<string>();
function warn(message: string) {
  if (warned.has(message)) return;
  warned.add(message);
  console.warn(`[Marquee] ${message}`);
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

function gapValue(value: unknown): string {
  if (value === undefined || value === "") return "";
  if (typeof value === "number" && Number.isFinite(value)) return `${Math.max(0, value)}px`;
  if (typeof value === "string") return value;
  warn(`invalid gap: ${String(value)}, using the size token`);
  return "";
}

function itemList(value: unknown): string[] {
  if (value === undefined) return [];
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string" && !!v);
  warn(`invalid items: ${String(value)}, using []`);
  return [];
}

export function resolveSettings(options: MarqueeOptions = {}): MarqueeSettings {
  const o = { ...defaults, ...options };
  let theme: MarqueeSettings["theme"] = defaults.theme;
  if (typeof o.theme === "string" && o.theme in themes) theme = o.theme;
  else if (o.theme && typeof o.theme === "object") theme = o.theme;
  else warn(`unknown theme: ${String(o.theme)}, using ${defaults.theme}`);
  const direction = oneOf(
    o.direction,
    ["left", "right", "up", "down"] as const,
    defaults.direction,
    "direction",
  );

  return {
    theme,
    variant: oneOf(o.variant, ["plain", "pill", "card"] as const, defaults.variant, "variant"),
    size: oneOf(o.size, ["sm", "md", "lg"] as const, defaults.size, "size"),
    items: itemList(options.items),
    speed: num(o.speed, defaults.speed, 0, 5000, "speed"),
    direction,
    vertical: direction === "up" || direction === "down",
    pauseOnHover: bool(o.pauseOnHover, defaults.pauseOnHover),
    pauseOnFocus: bool(o.pauseOnFocus, defaults.pauseOnFocus),
    gap: gapValue(options.gap),
    fade: bool(o.fade, defaults.fade),
    fadeSize: num(o.fadeSize, defaults.fadeSize, 0, 1000, "fadeSize"),
    repeat: Math.round(num(o.repeat, defaults.repeat, 2, 50, "repeat")),
    reverseOnHover: bool(o.reverseOnHover, defaults.reverseOnHover),
    draggable: bool(o.draggable, defaults.draggable),
    paused: bool(o.paused, defaults.paused),
    respectReducedMotion: bool(o.respectReducedMotion, defaults.respectReducedMotion),
    separator: str(o.separator, defaults.separator),
    rows: Math.round(num(o.rows, defaults.rows, 1, 3, "rows")),
    label: str(o.label, defaults.label) || defaults.label,
    controls: bool(o.controls, defaults.controls),
    pauseLabel: str(o.pauseLabel, defaults.pauseLabel) || defaults.pauseLabel,
    playLabel: str(o.playLabel, defaults.playLabel) || defaults.playLabel,
  };
}

/** Token merge order: theme ← size ← variant ← user override (theme object) ← gap / fadeSize options */
export function resolveTokens(settings: MarqueeSettings): Record<string, string> {
  const { theme, size, variant } = settings;
  const named = typeof theme === "string";
  const base = (named ? themes[theme] : undefined) ?? themes[defaults.theme];
  const tokens: MarqueeTokens = {
    ...base,
    ...sizes[size],
    ...variants[variant],
    ...(named ? {} : theme),
    "fade-size": `${settings.fadeSize}px`,
  };
  if (settings.gap) tokens.gap = settings.gap;
  return Object.fromEntries(
    Object.entries(tokens).map(([key, value]) => [`--ux-marquee-${key}`, value]),
  );
}

export const axis = (settings: MarqueeSettings) =>
  settings.vertical ? ("vertical" as const) : ("horizontal" as const);

/** Row `row` starts at a different item so stacked rows do not look identical */
export function rotate<T>(list: T[], row: number, rows: number): T[] {
  if (row === 0 || list.length < 2) return list;
  const k = Math.floor((row * list.length) / rows) % list.length;
  return [...list.slice(k), ...list.slice(0, k)];
}

/** Copies needed so the strip is always covered while one copy scrolls out */
export function copiesFor(viewSize: number, groupSize: number, repeat: number): number {
  if (groupSize <= 0) return repeat;
  return Math.min(100, Math.max(repeat, Math.ceil(viewSize / groupSize) + 1));
}
