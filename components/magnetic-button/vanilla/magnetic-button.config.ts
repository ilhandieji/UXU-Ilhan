// MagneticButton settings and types — names must match the React version.
// Styling is Tailwind-only: token values live here and are set as CSS variables
// `--ux-magnetic-button-*` on the button; the static classes below consume them.
// The magnet offsets (`-tx`, `-ty`, `-label-tx`, `-label-ty`) are written per frame by the component.

export type MagneticButtonThemeName = "dark" | "light" | "brand" | "ghost";
export type MagneticButtonVariant = "solid" | "outline" | "pill";
export type MagneticButtonSize = "sm" | "md" | "lg";
export type MagneticButtonElement = "button" | "a";

/** Token keys without the --ux-magnetic-button- prefix, e.g. { bg: '#000' } */
export type MagneticButtonTokens = Record<string, string>;

export interface MagneticButtonOptions {
  /** Preset name, or a partial token object merged over the `dark` preset */
  theme?: MagneticButtonThemeName | MagneticButtonTokens;
  variant?: MagneticButtonVariant;
  size?: MagneticButtonSize;
  /** Token overrides applied last (after theme, size and variant) */
  tokens?: MagneticButtonTokens;
  /** Rendered element: native <button> or <a> */
  as?: MagneticButtonElement;
  /** Link target when `as` is "a" */
  href?: string;
  label?: string;
  /** Accessible name, needed when the label is empty (icon-only button) */
  ariaLabel?: string;
  /** Trailing arrow icon */
  icon?: boolean;
  /** 0–1: share of the pointer offset the button follows */
  strength?: number;
  /** Activation distance in px around the button's edges */
  radius?: number;
  /** 0–1: extra offset of the inner label (parallax) */
  textStrength?: number;
  /** 0.01–1: lerp factor per frame while following (1 = sticks to the pointer) */
  ease?: number;
  /** ms the button takes to spring back after the pointer leaves */
  returnDuration?: number;
  /** Scale while hovered (1 = no scale) */
  scaleOnHover?: number;
  /** Ripple from the click point */
  ripple?: boolean;
  disabled?: boolean;
  /** true = no movement, scale or ripple when the user prefers reduced motion */
  respectReducedMotion?: boolean;
}

export const defaults = {
  theme: "dark",
  variant: "solid",
  size: "md",
  as: "button",
  href: "",
  label: "Get started",
  ariaLabel: "",
  icon: true,
  strength: 0.35,
  radius: 80,
  textStrength: 0.15,
  ease: 0.15,
  returnDuration: 600,
  scaleOnHover: 1.05,
  ripple: true,
  disabled: false,
  respectReducedMotion: true,
} satisfies MagneticButtonOptions;

const common: MagneticButtonTokens = {
  "bg-image": "none",
  "bg-image-hover": "none",
  "font-family": "ui-sans-serif, system-ui, sans-serif",
  "font-weight": "500",
  radius: "12px",
  "border-width": "1px",
  duration: "200ms",
  "ripple-duration": "600ms",
  "disabled-opacity": "0.5",
  "icon-shift": "3px",
};

export const themes: Record<MagneticButtonThemeName, MagneticButtonTokens> = {
  dark: {
    ...common,
    bg: "#18181b",
    fg: "#fafafa",
    border: "#3f3f46",
    "bg-hover": "#27272a",
    "fg-hover": "#ffffff",
    ring: "#a78bfa",
    ripple: "#ffffff40",
    shadow: "0 1px 2px #0000004d, inset 0 1px 0 #ffffff14",
  },
  light: {
    ...common,
    bg: "#ffffff",
    fg: "#18181b",
    border: "#e4e4e7",
    "bg-hover": "#f4f4f5",
    "fg-hover": "#09090b",
    ring: "#6d28d9",
    ripple: "#18181b26",
    shadow: "0 1px 2px #0000001a",
  },
  brand: {
    ...common,
    bg: "#7c3aed",
    fg: "#ffffff",
    border: "#ffffff26",
    "bg-hover": "#6d28d9",
    "fg-hover": "#ffffff",
    "bg-image": "linear-gradient(135deg, #7c3aed 0%, #db2777 100%)",
    "bg-image-hover": "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
    ring: "#f0abfc",
    ripple: "#ffffff4d",
    shadow: "0 8px 24px -8px #db277799",
  },
  ghost: {
    ...common,
    bg: "#00000000",
    fg: "#e4e4e7",
    border: "#00000000",
    "bg-hover": "#ffffff14",
    "fg-hover": "#ffffff",
    ring: "#a78bfa",
    ripple: "#ffffff26",
    shadow: "none",
  },
};

export const sizes: Record<MagneticButtonSize, MagneticButtonTokens> = {
  sm: {
    "padding-x": "14px",
    "padding-y": "8px",
    "font-size": "13px",
    gap: "6px",
    "icon-size": "14px",
  },
  md: {
    "padding-x": "20px",
    "padding-y": "12px",
    "font-size": "15px",
    gap: "8px",
    "icon-size": "16px",
  },
  lg: {
    "padding-x": "28px",
    "padding-y": "16px",
    "font-size": "17px",
    gap: "10px",
    "icon-size": "18px",
  },
};

export const variants: Record<MagneticButtonVariant, MagneticButtonTokens> = {
  solid: {},
  outline: { bg: "#00000000", "bg-image": "none", shadow: "none" },
  pill: { radius: "9999px" },
};

/** Tailwind v4 classes — complete, static strings (so the scanner can see them) */
export const classes = {
  root: "group relative isolate inline-flex shrink-0 cursor-pointer touch-manipulation select-none items-center justify-center overflow-hidden whitespace-nowrap border-solid no-underline leading-none border-(length:--ux-magnetic-button-border-width) border-(color:--ux-magnetic-button-border) bg-(color:--ux-magnetic-button-bg) bg-(image:--ux-magnetic-button-bg-image) text-(color:--ux-magnetic-button-fg) px-(--ux-magnetic-button-padding-x) py-(--ux-magnetic-button-padding-y) rounded-(--ux-magnetic-button-radius) font-(family-name:--ux-magnetic-button-font-family) text-(length:--ux-magnetic-button-font-size) [font-weight:var(--ux-magnetic-button-font-weight)] [box-shadow:var(--ux-magnetic-button-shadow)] translate-x-[var(--ux-magnetic-button-tx,0px)] translate-y-[var(--ux-magnetic-button-ty,0px)] transition-[background-color,color,border-color,scale] duration-(--ux-magnetic-button-duration) ease-out hover:bg-(color:--ux-magnetic-button-bg-hover) hover:bg-(image:--ux-magnetic-button-bg-image-hover) hover:text-(color:--ux-magnetic-button-fg-hover) hover:scale-(--ux-magnetic-button-scale) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(color:--ux-magnetic-button-ring) disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-(--ux-magnetic-button-disabled-opacity) aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed aria-disabled:opacity-(--ux-magnetic-button-disabled-opacity)",
  label:
    "pointer-events-none relative z-1 inline-flex items-center gap-(--ux-magnetic-button-gap) translate-x-[var(--ux-magnetic-button-label-tx,0px)] translate-y-[var(--ux-magnetic-button-label-ty,0px)]",
  text: "inline-block",
  icon: "size-(--ux-magnetic-button-icon-size) shrink-0 transition-[translate] duration-(--ux-magnetic-button-duration) ease-out group-hover:translate-x-(--ux-magnetic-button-icon-shift)",
  rippleLayer: "pointer-events-none absolute inset-0 -z-1 overflow-hidden rounded-[inherit]",
  ripple:
    "absolute top-(--ux-magnetic-button-ripple-y) left-(--ux-magnetic-button-ripple-x) size-(--ux-magnetic-button-ripple-size) -translate-1/2 rounded-full bg-(color:--ux-magnetic-button-ripple)",
};

/** Trailing arrow (24×24 viewBox, stroked with currentColor) */
export const ICON_PATH = "M5 12h14M13 6l6 6-6 6";

/** CSS variables the magnet writes each frame */
export const motionVars = {
  tx: "--ux-magnetic-button-tx",
  ty: "--ux-magnetic-button-ty",
  labelTx: "--ux-magnetic-button-label-tx",
  labelTy: "--ux-magnetic-button-label-ty",
} as const;

export type MagneticButtonSettings = Required<Omit<MagneticButtonOptions, "theme" | "tokens">> & {
  theme: MagneticButtonOptions["theme"];
  tokens: MagneticButtonTokens;
};

const warned = new Set<string>();
function warn(message: string) {
  if (warned.has(message)) return;
  warned.add(message);
  console.warn(`[MagneticButton] ${message}`);
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
const isTokens = (value: unknown): value is MagneticButtonTokens =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Validates every option; invalid values fall back to `defaults` with a warning */
export function resolveSettings(options: MagneticButtonOptions = {}): MagneticButtonSettings {
  const o = options;
  let theme: MagneticButtonOptions["theme"] = defaults.theme;
  if (typeof o.theme === "string") {
    if (o.theme in themes) theme = o.theme;
    else warn(`unknown theme: ${o.theme}, using ${defaults.theme}`);
  } else if (isTokens(o.theme)) theme = o.theme;

  return {
    theme,
    tokens: isTokens(o.tokens) ? o.tokens : {},
    variant: oneOf(o.variant, ["solid", "outline", "pill"] as const, defaults.variant, "variant"),
    size: oneOf(o.size, ["sm", "md", "lg"] as const, defaults.size, "size"),
    as: oneOf(o.as, ["button", "a"] as const, defaults.as, "as"),
    href: str(o.href, defaults.href),
    label: str(o.label, defaults.label),
    ariaLabel: str(o.ariaLabel, defaults.ariaLabel),
    icon: bool(o.icon, defaults.icon),
    strength: num(o.strength, defaults.strength, 0, 1, "strength"),
    radius: num(o.radius, defaults.radius, 0, 1000, "radius"),
    textStrength: num(o.textStrength, defaults.textStrength, 0, 1, "textStrength"),
    ease: num(o.ease, defaults.ease, 0.01, 1, "ease"),
    returnDuration: num(o.returnDuration, defaults.returnDuration, 0, 5000, "returnDuration"),
    scaleOnHover: num(o.scaleOnHover, defaults.scaleOnHover, 0.5, 2, "scaleOnHover"),
    ripple: bool(o.ripple, defaults.ripple),
    disabled: bool(o.disabled, defaults.disabled),
    respectReducedMotion: bool(o.respectReducedMotion, defaults.respectReducedMotion),
  };
}

/**
 * Token merge order: theme ← size ← variant ← `tokens`.
 * `still` = movement is off (reduced motion / disabled): hover scale and icon shift are neutralised.
 */
export function resolveTokens(
  settings: MagneticButtonSettings,
  still = false,
): Record<string, string> {
  const named = typeof settings.theme === "string";
  const base = named
    ? themes[settings.theme as MagneticButtonThemeName]
    : { ...themes[defaults.theme], ...(settings.theme as MagneticButtonTokens) };
  const tokens: MagneticButtonTokens = {
    ...base,
    ...sizes[settings.size],
    ...variants[settings.variant],
    ...settings.tokens,
    scale: String(still ? 1 : settings.scaleOnHover),
  };
  if (still) tokens["icon-shift"] = "0px";
  return Object.fromEntries(
    Object.entries(tokens).map(([key, value]) => [`--ux-magnetic-button-${key}`, value]),
  );
}

/** Parses a CSS time token ("600ms" / "0.6s") into ms */
export function toMs(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const n = Number.parseFloat(value);
  if (!Number.isFinite(n)) return fallback;
  return value.trim().endsWith("ms") ? n : value.trim().endsWith("s") ? n * 1000 : n;
}
