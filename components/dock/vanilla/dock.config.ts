// Dock settings and types — names must match the React version.
// Styling is Tailwind-only: token values live here and are set as CSS variables `--ux-dock-*` on the root.
// Per-item sizes (magnification) are written at runtime as `--ux-dock-item-size` on each item.

export type DockThemeName = "glass" | "dark" | "light" | "neon";
/** floating: glass panel with blur and shadow · flat: plain panel · outline: transparent with a border */
export type DockVariant = "floating" | "flat" | "outline";
export type DockSize = "sm" | "md" | "lg";
/** Edge of the screen the dock sits on; sets orientation, growth direction and tooltip side */
export type DockPosition = "bottom" | "top" | "left" | "right";
/** hover: tooltip on hover/focus · always: labels always visible · none: no tooltips */
export type DockLabels = "hover" | "always" | "none";

/** Token keys without the --ux-dock- prefix, e.g. { bg: '#000' } */
export type DockTokens = Record<string, string>;

export interface DockItem {
  id: string;
  /** Tooltip text and accessible name */
  label: string;
  /** Emoji or short text (use `renderIcon` for SVG / DOM icons) */
  icon: string;
  /** Renders the item as a link */
  href?: string;
  /** Shows the indicator dot (and aria-current) */
  active?: boolean;
  /** Small counter in the corner; 0 / '' hides it */
  badge?: string | number;
}

export interface DockOptions {
  items?: DockItem[];
  theme?: DockThemeName | DockTokens;
  variant?: DockVariant;
  size?: DockSize;
  position?: DockPosition;
  labels?: DockLabels;
  /** Max scale of the item under the pointer (1 = no magnification) */
  magnification?: number;
  /** Radius in px along the dock axis that the pointer influences */
  distance?: number;
  /** Item size in px at rest; overrides the `base-size` token of `size` */
  baseSize?: number;
  /** Space between items in px; overrides the `gap` token of `size` */
  gap?: number;
  /** Dot next to active items */
  indicator?: boolean;
  /** Icon bounces when the item is activated */
  bounce?: boolean;
  /** true: with prefers-reduced-motion there is no magnification or bounce, hover only highlights */
  respectReducedMotion?: boolean;
  /** aria-label of the toolbar */
  label?: string;
  /** Custom icon content (SVG element, image, …); falls back to `item.icon` when it returns null */
  renderIcon?: (item: DockItem) => Node | string | null;
  onSelect?: (item: DockItem, index: number) => void;
}

export const defaults = {
  items: [],
  theme: "glass",
  variant: "floating",
  size: "md",
  position: "bottom",
  labels: "hover",
  magnification: 1.8,
  distance: 140,
  indicator: true,
  bounce: true,
  respectReducedMotion: true,
  label: "Dock",
} satisfies DockOptions;

const base: DockTokens = {
  "font-family": "system-ui, sans-serif",
  radius: "22px",
  "item-radius": "14px",
  "tooltip-radius": "8px",
  duration: "150ms",
};

export const themes: Record<DockThemeName, DockTokens> = {
  glass: {
    ...base,
    bg: "rgba(255,255,255,0.12)",
    border: "rgba(255,255,255,0.24)",
    fg: "#ffffff",
    "tooltip-bg": "rgba(15,15,20,0.88)",
    "tooltip-fg": "#ffffff",
    indicator: "rgba(255,255,255,0.9)",
    "badge-bg": "#ff3b30",
    "badge-fg": "#ffffff",
    "item-bg": "rgba(255,255,255,0.1)",
    "item-bg-hover": "rgba(255,255,255,0.24)",
    ring: "#ffffff",
    shadow: "0 10px 40px rgba(0,0,0,0.35)",
    blur: "18px",
  },
  dark: {
    ...base,
    bg: "#16161c",
    border: "#2a2a33",
    fg: "#f4f4f5",
    "tooltip-bg": "#000000",
    "tooltip-fg": "#f4f4f5",
    indicator: "#a1a1aa",
    "badge-bg": "#ef4444",
    "badge-fg": "#ffffff",
    "item-bg": "#23232b",
    "item-bg-hover": "#33333d",
    ring: "#a78bfa",
    shadow: "0 12px 32px rgba(0,0,0,0.5)",
    blur: "0px",
  },
  light: {
    ...base,
    bg: "#f5f5f7",
    border: "#d4d4d8",
    fg: "#18181b",
    "tooltip-bg": "#18181b",
    "tooltip-fg": "#ffffff",
    indicator: "#52525b",
    "badge-bg": "#ef4444",
    "badge-fg": "#ffffff",
    "item-bg": "#ffffff",
    "item-bg-hover": "#e4e4e7",
    ring: "#2563eb",
    shadow: "0 10px 30px rgba(0,0,0,0.15)",
    blur: "0px",
  },
  neon: {
    ...base,
    bg: "#0a0418",
    border: "#ff3df2",
    fg: "#ffffff",
    "tooltip-bg": "#ff3df2",
    "tooltip-fg": "#0a0418",
    indicator: "#3cf0ff",
    "badge-bg": "#3cf0ff",
    "badge-fg": "#0a0418",
    "item-bg": "#1a0b33",
    "item-bg-hover": "#2d1259",
    ring: "#3cf0ff",
    shadow: "0 0 24px rgba(255,61,242,0.45)",
    blur: "0px",
  },
};

export const sizes: Record<DockSize, DockTokens> = {
  sm: {
    "base-size": "36px",
    gap: "6px",
    padding: "6px",
    "font-size": "12px",
    "badge-size": "15px",
    "indicator-size": "4px",
  },
  md: {
    "base-size": "48px",
    gap: "8px",
    padding: "8px",
    "font-size": "13px",
    "badge-size": "18px",
    "indicator-size": "4px",
  },
  lg: {
    "base-size": "64px",
    gap: "10px",
    padding: "10px",
    "font-size": "14px",
    "badge-size": "20px",
    "indicator-size": "5px",
  },
};

export const variants: Record<DockVariant, DockTokens> = {
  floating: { "border-width": "1px" },
  flat: { "border-width": "0px", shadow: "none", blur: "0px" },
  outline: { "border-width": "1px", bg: "transparent", shadow: "none", blur: "0px" },
};

/** Animation constants (not visual tokens) */
export const motion = {
  /** Fraction of the remaining size covered per 60 fps frame */
  lerp: 0.22,
  /** Size difference in px below which an item counts as settled */
  settle: 0.1,
  bounceMs: 620,
};

/** Bounce away from the screen edge (keyframes for the Web Animations API) */
export const bounceFrames: Record<DockPosition, Keyframe[]> = {
  bottom: frames("translateY", -1),
  top: frames("translateY", 1),
  left: frames("translateX", 1),
  right: frames("translateX", -1),
};

function frames(axis: string, sign: number): Keyframe[] {
  const at = (pct: number) => ({ transform: `${axis}(${sign * pct}%)` });
  return [at(0), at(45), at(0), at(18), at(0)];
}

/** Tailwind v4 classes — complete, static strings (so the scanner can see them) */
const panel =
  "relative inline-flex box-border gap-(--ux-dock-gap) p-(--ux-dock-padding) rounded-(--ux-dock-radius) bg-(color:--ux-dock-bg) text-(color:--ux-dock-fg) border-solid border-(length:--ux-dock-border-width) border-(color:--ux-dock-border) [box-shadow:var(--ux-dock-shadow)] backdrop-blur-(--ux-dock-blur) font-(family-name:--ux-dock-font-family) text-(length:--ux-dock-font-size)";

/** Root per position: the cross-axis size stays at rest size, magnified items overflow outward */
export const roots: Record<DockPosition, string> = {
  bottom: `${panel} flex-row items-end h-[calc(var(--ux-dock-base-size)_+_2*var(--ux-dock-padding)_+_2*var(--ux-dock-border-width))]`,
  top: `${panel} flex-row items-start h-[calc(var(--ux-dock-base-size)_+_2*var(--ux-dock-padding)_+_2*var(--ux-dock-border-width))]`,
  left: `${panel} flex-col items-start w-[calc(var(--ux-dock-base-size)_+_2*var(--ux-dock-padding)_+_2*var(--ux-dock-border-width))]`,
  right: `${panel} flex-col items-end w-[calc(var(--ux-dock-base-size)_+_2*var(--ux-dock-padding)_+_2*var(--ux-dock-border-width))]`,
};

export const classes = {
  item: "group relative flex shrink-0 items-center justify-center w-[var(--ux-dock-item-size,var(--ux-dock-base-size))] h-[var(--ux-dock-item-size,var(--ux-dock-base-size))] rounded-(--ux-dock-item-radius) bg-(color:--ux-dock-item-bg) hover:bg-(color:--ux-dock-item-bg-hover) focus-visible:bg-(color:--ux-dock-item-bg-hover) text-(color:--ux-dock-fg) no-underline cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-(color:--ux-dock-ring) transition-colors duration-(--ux-dock-duration) [-webkit-tap-highlight-color:transparent]",
  icon: "pointer-events-none flex size-full items-center justify-center leading-none text-[length:calc(var(--ux-dock-item-size,var(--ux-dock-base-size))*0.55)] [&_img]:size-[62%] [&_svg]:size-[62%]",
  badge:
    "pointer-events-none absolute top-0 right-0 translate-x-1/3 -translate-y-1/3 box-border min-w-(--ux-dock-badge-size) h-(--ux-dock-badge-size) px-[calc(var(--ux-dock-badge-size)*0.28)] rounded-full bg-(color:--ux-dock-badge-bg) text-(color:--ux-dock-badge-fg) text-[length:calc(var(--ux-dock-badge-size)*0.62)] leading-(--ux-dock-badge-size) font-semibold text-center tabular-nums",
  tooltip:
    "pointer-events-none absolute z-10 whitespace-nowrap rounded-(--ux-dock-tooltip-radius) bg-(color:--ux-dock-tooltip-bg) text-(color:--ux-dock-tooltip-fg) px-[calc(var(--ux-dock-font-size)*0.65)] py-[calc(var(--ux-dock-font-size)*0.3)] text-(length:--ux-dock-font-size) leading-tight transition-opacity duration-(--ux-dock-duration)",
  indicator:
    "pointer-events-none absolute size-(--ux-dock-indicator-size) rounded-full bg-(color:--ux-dock-indicator)",
};

/** Tooltip side: opposite the screen edge */
export const tooltipSide: Record<DockPosition, string> = {
  bottom: "bottom-[calc(100%_+_var(--ux-dock-padding))] left-1/2 -translate-x-1/2",
  top: "top-[calc(100%_+_var(--ux-dock-padding))] left-1/2 -translate-x-1/2",
  left: "left-[calc(100%_+_var(--ux-dock-padding))] top-1/2 -translate-y-1/2",
  right: "right-[calc(100%_+_var(--ux-dock-padding))] top-1/2 -translate-y-1/2",
};

export const tooltipVisibility: Record<Exclude<DockLabels, "none">, string> = {
  hover: "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100",
  always: "opacity-100",
};

/** Indicator dot: centered in the padding between the item and the screen edge */
export const indicatorSide: Record<DockPosition, string> = {
  bottom:
    "left-1/2 -translate-x-1/2 top-[calc(100%_+_var(--ux-dock-padding)/2_-_var(--ux-dock-indicator-size)/2)]",
  top: "left-1/2 -translate-x-1/2 bottom-[calc(100%_+_var(--ux-dock-padding)/2_-_var(--ux-dock-indicator-size)/2)]",
  left: "top-1/2 -translate-y-1/2 right-[calc(100%_+_var(--ux-dock-padding)/2_-_var(--ux-dock-indicator-size)/2)]",
  right:
    "top-1/2 -translate-y-1/2 left-[calc(100%_+_var(--ux-dock-padding)/2_-_var(--ux-dock-indicator-size)/2)]",
};

export interface DockSettings {
  theme: DockThemeName | DockTokens;
  variant: DockVariant;
  size: DockSize;
  position: DockPosition;
  labels: DockLabels;
  magnification: number;
  distance: number;
  /** Resolved rest size in px (from `baseSize` or the `base-size` token) */
  baseSize: number;
  /** Resolved gap in px */
  gap: number;
  indicator: boolean;
  bounce: boolean;
  respectReducedMotion: boolean;
  label: string;
  /** CSS variables for the root */
  tokens: Record<string, string>;
}

const warned = new Set<string>();
function warn(message: string) {
  if (warned.has(message)) return;
  warned.add(message);
  console.warn(`[Dock] ${message}`);
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
const px = (value: string | undefined, fallback: number) => {
  const n = Number.parseFloat(value ?? "");
  return Number.isFinite(n) ? n : fallback;
};

/** Token merge order: theme ← size ← variant ← user override (when theme is an object) */
export function resolveTokens({
  theme,
  size,
  variant,
}: Pick<DockSettings, "theme" | "size" | "variant">): DockTokens {
  const named = typeof theme === "string";
  if (named && !(theme in themes)) warn(`unknown theme: ${theme}, using ${defaults.theme}`);
  const preset = (named ? themes[theme as DockThemeName] : undefined) ?? themes[defaults.theme];
  return { ...preset, ...sizes[size], ...variants[variant], ...(named ? {} : theme) };
}

export function resolveSettings(options: DockOptions = {}): DockSettings {
  const o = { ...defaults, ...options };
  const theme =
    typeof o.theme === "string" || (o.theme && typeof o.theme === "object")
      ? o.theme
      : defaults.theme;
  const size = oneOf(o.size, ["sm", "md", "lg"] as const, defaults.size, "size");
  const variant = oneOf(
    o.variant,
    ["floating", "flat", "outline"] as const,
    defaults.variant,
    "variant",
  );
  const tokens = resolveTokens({ theme, size, variant });
  const baseSize = num(options.baseSize, px(tokens["base-size"], 48), 16, 160, "baseSize");
  const gap = num(options.gap, px(tokens.gap, 8), 0, 64, "gap");
  tokens["base-size"] = `${baseSize}px`;
  tokens.gap = `${gap}px`;

  return {
    theme,
    size,
    variant,
    position: oneOf(
      o.position,
      ["bottom", "top", "left", "right"] as const,
      defaults.position,
      "position",
    ),
    labels: oneOf(o.labels, ["hover", "always", "none"] as const, defaults.labels, "labels"),
    magnification: num(o.magnification, defaults.magnification, 1, 4, "magnification"),
    distance: num(o.distance, defaults.distance, 1, 1000, "distance"),
    baseSize,
    gap,
    indicator: bool(o.indicator, defaults.indicator),
    bounce: bool(o.bounce, defaults.bounce),
    respectReducedMotion: bool(o.respectReducedMotion, defaults.respectReducedMotion),
    label: typeof o.label === "string" && o.label ? o.label : defaults.label,
    tokens: Object.fromEntries(
      Object.entries(tokens).map(([key, value]) => [`--ux-dock-${key}`, value]),
    ),
  };
}

/** Drops invalid items (missing id/label) and duplicate ids, with a warning */
export function sanitizeItems(items: unknown): DockItem[] {
  if (items === undefined) return [];
  if (!Array.isArray(items)) {
    warn("items must be an array");
    return [];
  }
  const seen = new Set<string>();
  return items.filter((item): item is DockItem => {
    const ok =
      !!item &&
      typeof item === "object" &&
      typeof item.id === "string" &&
      typeof item.label === "string";
    if (!ok) warn("skipping item without a string id and label");
    else if (seen.has(item.id)) warn(`duplicate item id: ${item.id}`);
    else {
      seen.add(item.id);
      return true;
    }
    return false;
  });
}

/** Badge text, or null when there is nothing to show */
export function badgeText(badge: DockItem["badge"]): string | null {
  if (badge === undefined || badge === null || badge === "" || badge === 0) return null;
  return typeof badge === "number" && badge > 99 ? "99+" : String(badge);
}

/**
 * Target size in px of an item whose center is `offset` px from the pointer along the axis
 * (smooth cosine falloff: full magnification at 0, none at `distance`).
 */
export function magnifiedSize(
  offset: number,
  s: Pick<DockSettings, "baseSize" | "magnification" | "distance">,
): number {
  const d = Math.abs(offset);
  if (d >= s.distance) return s.baseSize;
  const t = (1 + Math.cos((Math.PI * d) / s.distance)) / 2;
  return s.baseSize * (1 + (s.magnification - 1) * t);
}

/** Next focus index for a roving-tabindex key, or null when the key is not handled */
export function nextIndex(
  key: string,
  index: number,
  count: number,
  vertical: boolean,
): number | null {
  if (count === 0) return null;
  const prev = vertical ? "ArrowUp" : "ArrowLeft";
  const next = vertical ? "ArrowDown" : "ArrowRight";
  if (key === prev) return (index - 1 + count) % count;
  if (key === next) return (index + 1) % count;
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  return null;
}
