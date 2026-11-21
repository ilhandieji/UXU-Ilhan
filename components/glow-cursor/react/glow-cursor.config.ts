// GlowCursor settings and types — names must match the Vanilla version.
// Light values (color, linger, …) are WebGL uniforms; layer values (blend, opacity, z) are CSS variables
// `--ux-glow-cursor-*` set on the canvas and consumed by the static Tailwind classes below.

export type GlowCursorThemeName =
  | "comet"
  | "ember"
  | "aurora"
  | "smoke"
  | "ion"
  | "silk"
  | "neon"
  | "plasma"
  | "gold"
  | "toxic"
  | "ink";
/** contained: light under children · overlay: light above children · fixed: whole viewport */
export type GlowCursorVariant = "contained" | "overlay" | "fixed";
export type GlowCursorSize = "sm" | "md" | "lg";
export type GlowCursorQuality = "low" | "medium" | "high";
/** dark: additive light · light: ink-like look for light backgrounds · auto: follows prefers-color-scheme */
export type GlowCursorMode = "dark" | "light" | "auto";
export type GlowCursorColorMode = "solid" | "rainbow" | "velocity";

/** Values a theme preset controls */
export interface GlowCursorLight {
  /** Color of the light where it is freshly drawn */
  color: string;
  /** Color the light cools to; empty = a deeper shade of `color` */
  secondaryColor: string;
  intensity: number;
  /** Trail thickness in px */
  trailWidth: number;
  /** Seconds the light stays visible */
  linger: number;
  glow: number;
  /** White-hot core near the cursor */
  hotspot: number;
  /** 0 = loose spring, 1 = sticks to the cursor */
  followSpeed: number;
  grain: number;
}

export type GlowCursorTheme = GlowCursorThemeName | Partial<GlowCursorLight>;

export interface GlowCursorOptions extends Partial<GlowCursorLight> {
  theme?: GlowCursorTheme;
  variant?: GlowCursorVariant;
  size?: GlowCursorSize;
  mode?: GlowCursorMode;
  quality?: GlowCursorQuality;
  colorMode?: GlowCursorColorMode;
  /** Degrees per second (rainbow) or max hue shift factor (velocity) */
  hueSpeed?: number;
  /** How strongly the trail pushes the air around it */
  flow?: number;
  clickBurst?: boolean;
  burstJets?: number;
  burstSize?: number;
  /** Draws an automatic path while the pointer is away or still */
  idle?: boolean;
  /** Seconds of stillness before the idle path starts */
  idleDelay?: number;
  hideCursor?: boolean;
  respectReducedMotion?: boolean;
  /** false = stop drawing new light, existing light still fades */
  enabled?: boolean;
  /** true = freeze the simulation completely */
  paused?: boolean;
  /** CSS mix-blend-mode; auto = screen (dark) / normal (light) */
  blendMode?: string;
  opacity?: number;
  zIndex?: number;
  maxDevicePixelRatio?: number;
  onBurst?: (x: number, y: number) => void;
  onUnsupported?: () => void;
}

export const defaults = {
  theme: "comet",
  variant: "contained",
  size: "md",
  mode: "dark",
  quality: "high",
  colorMode: "solid",
  hueSpeed: 40,
  flow: 0.75,
  clickBurst: true,
  burstJets: 6,
  burstSize: 1,
  idle: false,
  idleDelay: 2,
  hideCursor: false,
  respectReducedMotion: true,
  enabled: true,
  paused: false,
  blendMode: "auto",
  opacity: 1,
  zIndex: 50,
  maxDevicePixelRatio: 2,
} satisfies GlowCursorOptions;

const comet: GlowCursorLight = {
  color: "#5f8bff",
  secondaryColor: "",
  intensity: 1.3,
  trailWidth: 3,
  linger: 1.4,
  glow: 1.2,
  hotspot: 0.8,
  followSpeed: 0.6,
  grain: 0,
};

export const themes: Record<GlowCursorThemeName, GlowCursorLight> = {
  comet: { ...comet },
  ember: { ...comet, color: "#ffb347", secondaryColor: "#ff3b1a", linger: 1.1 },
  aurora: { ...comet, color: "#5effc4", secondaryColor: "#2a8cff", linger: 2.4, glow: 1.5 },
  smoke: {
    ...comet,
    color: "#ffffff",
    secondaryColor: "#9a9aa8",
    intensity: 0.9,
    linger: 2.6,
    glow: 0.6,
    hotspot: 0.4,
  },
  ion: {
    ...comet,
    color: "#7ff3ff",
    secondaryColor: "#3a5bff",
    intensity: 1.6,
    trailWidth: 2,
    linger: 1,
  },
  silk: { ...comet, trailWidth: 7, linger: 2, glow: 1.6, hotspot: 0.4 },
  neon: { ...comet, color: "#ff3df2", secondaryColor: "#7a2bff", intensity: 1.5, glow: 1.6 },
  plasma: {
    ...comet,
    color: "#ff6ad5",
    secondaryColor: "#3cf0ff",
    trailWidth: 4,
    linger: 1.8,
    glow: 1.4,
  },
  gold: { ...comet, color: "#ffd36b", secondaryColor: "#b8641a", linger: 1.6, hotspot: 1.1 },
  toxic: {
    ...comet,
    color: "#b6ff3d",
    secondaryColor: "#1fbf5a",
    linger: 1.2,
    grain: 0.15,
    followSpeed: 0.4,
  },
  ink: {
    ...comet,
    color: "#1b1b2f",
    secondaryColor: "#4a3aff",
    intensity: 1.2,
    trailWidth: 4,
    linger: 2,
    hotspot: 0.3,
  },
};

/** Multiplier for trail width and burst size */
export const sizes: Record<GlowCursorSize, { scale: number }> = {
  sm: { scale: 0.7 },
  md: { scale: 1 },
  lg: { scale: 1.6 },
};

/** Tailwind v4 classes — complete, static strings (so the scanner can see them) */
const layer =
  "pointer-events-none block h-full w-full select-none opacity-(--ux-glow-cursor-opacity) [mix-blend-mode:var(--ux-glow-cursor-blend)]";

export const variants: Record<GlowCursorVariant, string> = {
  contained: `${layer} absolute inset-0 -z-1`,
  overlay: `${layer} absolute inset-0 z-(--ux-glow-cursor-z)`,
  fixed: `${layer} fixed inset-0 z-(--ux-glow-cursor-z)`,
};

/** React root per variant; `isolate` keeps the contained light (-z-1) behind children but above the page */
export const roots: Record<GlowCursorVariant, string> = {
  contained: "relative isolate h-full w-full overflow-hidden",
  overlay: "relative isolate h-full w-full overflow-hidden",
  fixed: "relative h-full w-full",
};

/** Classes a Vanilla host element gets per variant (removed again on destroy) */
export const hostClasses: Record<GlowCursorVariant, string[]> = {
  contained: ["relative", "isolate"],
  overlay: ["relative", "isolate"],
  fixed: [],
};

export const classes = {
  content: "relative z-1 h-full w-full",
  hiddenCursor: "cursor-none",
};

/** Everything the engine needs, validated and merged */
export type GlowCursorSettings = GlowCursorLight &
  Required<
    Omit<GlowCursorOptions, keyof GlowCursorLight | "theme" | "size" | "onBurst" | "onUnsupported">
  > & {
    scale: number;
    onBurst?: (x: number, y: number) => void;
  };

const warned = new Set<string>();
function warn(message: string) {
  if (warned.has(message)) return;
  warned.add(message);
  console.warn(`[GlowCursor] ${message}`);
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

/** Merge order: theme preset ← theme object ← top-level light options; then size scale */
export function resolveSettings(options: GlowCursorOptions = {}): GlowCursorSettings {
  const o = { ...defaults, ...options };
  const named = typeof o.theme === "string";
  if (named && !((o.theme as string) in themes))
    warn(`unknown theme: ${String(o.theme)}, using ${defaults.theme}`);
  const base =
    (named ? themes[o.theme as GlowCursorThemeName] : undefined) ?? themes[defaults.theme];
  const pick = <K extends keyof GlowCursorLight>(key: K): GlowCursorLight[K] | undefined =>
    options[key] ?? (named ? undefined : (o.theme as Partial<GlowCursorLight>)[key]);
  const size = oneOf(o.size, ["sm", "md", "lg"] as const, defaults.size, "size");

  return {
    color: str(pick("color"), base.color) || base.color,
    secondaryColor: str(pick("secondaryColor"), base.secondaryColor),
    intensity: num(pick("intensity"), base.intensity, 0, 10, "intensity"),
    trailWidth: num(pick("trailWidth"), base.trailWidth, 0.5, 64, "trailWidth"),
    linger: num(pick("linger"), base.linger, 0.1, 10, "linger"),
    glow: num(pick("glow"), base.glow, 0, 5, "glow"),
    hotspot: num(pick("hotspot"), base.hotspot, 0, 5, "hotspot"),
    followSpeed: num(pick("followSpeed"), base.followSpeed, 0, 1, "followSpeed"),
    grain: num(pick("grain"), base.grain, 0, 2, "grain"),
    scale: sizes[size].scale,
    variant: oneOf(
      o.variant,
      ["contained", "overlay", "fixed"] as const,
      defaults.variant,
      "variant",
    ),
    mode: oneOf(o.mode, ["dark", "light", "auto"] as const, defaults.mode, "mode"),
    quality: oneOf(o.quality, ["low", "medium", "high"] as const, defaults.quality, "quality"),
    colorMode: oneOf(
      o.colorMode,
      ["solid", "rainbow", "velocity"] as const,
      defaults.colorMode,
      "colorMode",
    ),
    hueSpeed: num(o.hueSpeed, defaults.hueSpeed, 0, 720, "hueSpeed"),
    flow: num(o.flow, defaults.flow, 0, 3, "flow"),
    clickBurst: bool(o.clickBurst, defaults.clickBurst),
    burstJets: Math.round(num(o.burstJets, defaults.burstJets, 1, 24, "burstJets")),
    burstSize: num(o.burstSize, defaults.burstSize, 0.1, 5, "burstSize"),
    idle: bool(o.idle, defaults.idle),
    idleDelay: num(o.idleDelay, defaults.idleDelay, 0, 60, "idleDelay"),
    hideCursor: bool(o.hideCursor, defaults.hideCursor),
    respectReducedMotion: bool(o.respectReducedMotion, defaults.respectReducedMotion),
    enabled: bool(o.enabled, defaults.enabled),
    paused: bool(o.paused, defaults.paused),
    blendMode: str(o.blendMode, defaults.blendMode) || defaults.blendMode,
    opacity: num(o.opacity, defaults.opacity, 0, 1, "opacity"),
    zIndex: Math.round(num(o.zIndex, defaults.zIndex, -1000, 2147483647, "zIndex")),
    maxDevicePixelRatio: num(
      o.maxDevicePixelRatio,
      defaults.maxDevicePixelRatio,
      0.5,
      4,
      "maxDevicePixelRatio",
    ),
    onBurst: options.onBurst,
  };
}

/** CSS variables for the canvas layer (`light` = the resolved mode is light) */
export function resolveTokens(
  settings: GlowCursorSettings,
  light: boolean,
): Record<string, string> {
  const blend = settings.blendMode === "auto" ? (light ? "normal" : "screen") : settings.blendMode;
  return {
    "--ux-glow-cursor-blend": blend,
    "--ux-glow-cursor-opacity": String(settings.opacity),
    "--ux-glow-cursor-z": String(settings.zIndex),
  };
}
