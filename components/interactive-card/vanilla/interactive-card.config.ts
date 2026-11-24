// InteractiveCard settings and types — names must match the React version.
// Styling is Tailwind-only: token values live here and are set as CSS variables on the root;
// the pointer state (--ux-interactive-card-x/-y/-rx/-ry/-s) is written per frame by the component.

export type InteractiveCardThemeName = "dark" | "glass" | "neon" | "light";
export type InteractiveCardVariant = "default" | "outline" | "elevated";
export type InteractiveCardSize = "sm" | "md" | "lg";
export type InteractiveCardEffect = "spotlight" | "tilt" | "both";

/** Token keys without the --ux-interactive-card- prefix, e.g. { bg: '#000' } */
export type InteractiveCardTokens = Record<string, string>;

export interface InteractiveCardOptions {
  theme?: InteractiveCardThemeName | InteractiveCardTokens;
  variant?: InteractiveCardVariant;
  size?: InteractiveCardSize;
  effect?: InteractiveCardEffect;
  /** Maximum rotation in degrees */
  maxTilt?: number;
  /** Perspective distance in px (smaller = stronger 3D) */
  perspective?: number;
  /** Scale while the pointer is over the card */
  scale?: number;
  /** Light reflection that follows the pointer while tilting */
  glare?: boolean;
  glareOpacity?: number;
  /** Spotlight diameter in px */
  spotlightSize?: number;
  spotlightOpacity?: number;
  /** Border lights up near the pointer */
  borderGlow?: boolean;
  /** Duration in ms of the ease back to rest when the pointer leaves */
  reset?: number;
  /** Tilt from deviceorientation on touch devices (when available) */
  gyroscope?: boolean;
  /** Makes the card itself reachable with Tab (use when it has no focusable children) */
  focusable?: boolean;
  disabled?: boolean;
  /** With prefers-reduced-motion: no tilt/scale/glare, the spotlight only fades in at the center */
  respectReducedMotion?: boolean;
}

export const defaults = {
  theme: "dark",
  variant: "default",
  size: "md",
  effect: "both",
  maxTilt: 10,
  perspective: 1000,
  scale: 1.02,
  glare: true,
  glareOpacity: 0.15,
  spotlightSize: 360,
  spotlightOpacity: 0.22,
  borderGlow: true,
  reset: 500,
  gyroscope: false,
  focusable: false,
  disabled: false,
  respectReducedMotion: true,
} satisfies InteractiveCardOptions;

const font = "ui-sans-serif, system-ui, sans-serif";

export const themes: Record<InteractiveCardThemeName, InteractiveCardTokens> = {
  dark: {
    bg: "#0f0f14",
    fg: "#e8e8ef",
    border: "#26262f",
    spotlight: "#8b9cff",
    glare: "#ffffff",
    shadow: "0 1px 2px rgb(0 0 0 / 0.4)",
    "shadow-hover": "0 24px 48px -16px rgb(0 0 0 / 0.7)",
    blur: "0px",
    "font-family": font,
  },
  glass: {
    bg: "#ffffff0f",
    fg: "#f4f4f8",
    border: "#ffffff24",
    spotlight: "#ffffff",
    glare: "#ffffff",
    shadow: "0 8px 32px -12px rgb(0 0 0 / 0.5)",
    "shadow-hover": "0 28px 56px -18px rgb(0 0 0 / 0.65)",
    blur: "16px",
    "font-family": font,
  },
  neon: {
    bg: "#08060f",
    fg: "#f5e9ff",
    border: "#3b1d5c",
    spotlight: "#ff3df2",
    glare: "#3cf0ff",
    shadow: "0 0 0 1px rgb(255 61 242 / 0.08)",
    "shadow-hover": "0 0 40px -6px rgb(255 61 242 / 0.5)",
    blur: "0px",
    "font-family": font,
  },
  light: {
    bg: "#ffffff",
    fg: "#18181b",
    border: "#e4e4e7",
    spotlight: "#6366f1",
    glare: "#ffffff",
    shadow: "0 1px 3px rgb(0 0 0 / 0.08)",
    "shadow-hover": "0 24px 48px -16px rgb(0 0 0 / 0.25)",
    blur: "0px",
    "font-family": font,
  },
};

export const sizes: Record<InteractiveCardSize, InteractiveCardTokens> = {
  sm: { "font-size": "13px", padding: "16px", radius: "12px" },
  md: { "font-size": "15px", padding: "24px", radius: "16px" },
  lg: { "font-size": "17px", padding: "32px", radius: "24px" },
};

export const variants: Record<InteractiveCardVariant, InteractiveCardTokens> = {
  default: { "border-width": "1px" },
  outline: { "border-width": "1px", bg: "transparent", shadow: "none", "shadow-hover": "none" },
  elevated: {
    "border-width": "0px",
    shadow: "0 12px 32px -12px rgb(0 0 0 / 0.6)",
    "shadow-hover": "0 36px 64px -20px rgb(0 0 0 / 0.75)",
  },
};

/** Ease used while following the pointer (the leave ease uses `reset`) */
export const FOLLOW_MS = 120;

/** Tailwind v4 classes — complete, static strings (so the scanner can see them) */
const layer = "pointer-events-none absolute inset-0 rounded-[inherit]";
const fade = "transition-opacity duration-(--ux-interactive-card-duration) ease-out";
/** Keeps only the border ring (padding = border width) of a layer */
const ring =
  "p-(--ux-interactive-card-border-width) [mask:linear-gradient(black,black)_content-box_exclude,linear-gradient(black,black)]";

export const classes = {
  /** Untransformed wrapper: receives the pointer, so its rect stays stable while the card tilts */
  root: "group/ux-ic relative block rounded-(--ux-interactive-card-radius) focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-4 focus-visible:outline-(color:--ux-interactive-card-spotlight)",
  card: "relative isolate h-full w-full overflow-hidden rounded-(--ux-interactive-card-radius) bg-(color:--ux-interactive-card-bg) text-(color:--ux-interactive-card-fg) font-(family-name:--ux-interactive-card-font-family) text-(length:--ux-interactive-card-font-size) backdrop-blur-(--ux-interactive-card-blur) [box-shadow:var(--ux-interactive-card-shadow)] group-data-[active=true]/ux-ic:[box-shadow:var(--ux-interactive-card-shadow-hover)] [transform:perspective(var(--ux-interactive-card-perspective))_rotateX(var(--ux-interactive-card-rx))_rotateY(var(--ux-interactive-card-ry))_scale(var(--ux-interactive-card-s))] transition-[transform,box-shadow] duration-(--ux-interactive-card-duration) ease-out will-change-transform",
  spotlight: `${layer} ${fade} z-0 opacity-0 group-data-[active=true]/ux-ic:opacity-(--ux-interactive-card-spotlight-opacity) [background-image:radial-gradient(var(--ux-interactive-card-spotlight-size)_circle_at_var(--ux-interactive-card-x)_var(--ux-interactive-card-y),var(--ux-interactive-card-spotlight),transparent_70%)]`,
  content: "relative z-1 h-full p-(--ux-interactive-card-padding)",
  glare: `${layer} ${fade} z-2 opacity-0 group-data-[active=true]/ux-ic:opacity-(--ux-interactive-card-glare-opacity) [background-image:radial-gradient(farthest-corner_circle_at_var(--ux-interactive-card-x)_var(--ux-interactive-card-y),var(--ux-interactive-card-glare),transparent_65%)]`,
  border: `${layer} ${ring} z-3 bg-(color:--ux-interactive-card-border)`,
  borderGlow: `${layer} ${ring} ${fade} z-3 opacity-0 group-data-[active=true]/ux-ic:opacity-100 [background-image:radial-gradient(calc(var(--ux-interactive-card-spotlight-size)*0.6)_circle_at_var(--ux-interactive-card-x)_var(--ux-interactive-card-y),var(--ux-interactive-card-spotlight),transparent_70%)]`,
};

/** Validated, merged options */
export type InteractiveCardSettings = Required<Omit<InteractiveCardOptions, "theme">> & {
  theme: InteractiveCardOptions["theme"];
};

const warned = new Set<string>();
function warn(message: string) {
  if (warned.has(message)) return;
  warned.add(message);
  console.warn(`[InteractiveCard] ${message}`);
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

function bool(value: unknown, fallback: boolean, name: string): boolean {
  if (value === undefined) return fallback;
  if (typeof value === "boolean") return value;
  warn(`invalid ${name}: ${String(value)}, using ${fallback}`);
  return fallback;
}

export function resolveSettings(options: InteractiveCardOptions = {}): InteractiveCardSettings {
  const o = options;
  let theme = o.theme ?? defaults.theme;
  if (typeof theme === "string" && !(theme in themes)) {
    warn(`unknown theme: ${theme}, using ${defaults.theme}`);
    theme = defaults.theme;
  }
  return {
    theme,
    variant: oneOf(
      o.variant,
      ["default", "outline", "elevated"] as const,
      defaults.variant,
      "variant",
    ),
    size: oneOf(o.size, ["sm", "md", "lg"] as const, defaults.size, "size"),
    effect: oneOf(o.effect, ["spotlight", "tilt", "both"] as const, defaults.effect, "effect"),
    maxTilt: num(o.maxTilt, defaults.maxTilt, 0, 45, "maxTilt"),
    perspective: num(o.perspective, defaults.perspective, 100, 5000, "perspective"),
    scale: num(o.scale, defaults.scale, 0.5, 2, "scale"),
    glare: bool(o.glare, defaults.glare, "glare"),
    glareOpacity: num(o.glareOpacity, defaults.glareOpacity, 0, 1, "glareOpacity"),
    spotlightSize: num(o.spotlightSize, defaults.spotlightSize, 20, 2000, "spotlightSize"),
    spotlightOpacity: num(o.spotlightOpacity, defaults.spotlightOpacity, 0, 1, "spotlightOpacity"),
    borderGlow: bool(o.borderGlow, defaults.borderGlow, "borderGlow"),
    reset: num(o.reset, defaults.reset, 0, 5000, "reset"),
    gyroscope: bool(o.gyroscope, defaults.gyroscope, "gyroscope"),
    focusable: bool(o.focusable, defaults.focusable, "focusable"),
    disabled: bool(o.disabled, defaults.disabled, "disabled"),
    respectReducedMotion: bool(
      o.respectReducedMotion,
      defaults.respectReducedMotion,
      "respectReducedMotion",
    ),
  };
}

/** Token merge order: theme ← size ← variant ← user override (when theme is an object); plus option-driven vars */
export function resolveTokens(s: InteractiveCardSettings): Record<string, string> {
  const named = typeof s.theme === "string";
  const base = (named ? themes[s.theme as InteractiveCardThemeName] : undefined) ?? themes.dark;
  const tokens: InteractiveCardTokens = {
    ...base,
    ...sizes[s.size],
    ...variants[s.variant],
    ...(named ? {} : (s.theme as InteractiveCardTokens)),
    perspective: `${s.perspective}px`,
    "spotlight-size": `${s.spotlightSize}px`,
    "spotlight-opacity": String(s.spotlightOpacity),
    "glare-opacity": String(s.glareOpacity),
  };
  return Object.fromEntries(
    Object.entries(tokens).map(([key, value]) => [`--ux-interactive-card-${key}`, value]),
  );
}

/** Pointer state → CSS variables. `px`/`py` are 0..1 inside the card. */
export function pointerVars(
  s: InteractiveCardSettings,
  p: { px: number; py: number; active: boolean; tilt: boolean },
): Record<string, string> {
  const tilt = p.active && p.tilt;
  const rx = tilt ? (0.5 - p.py) * 2 * s.maxTilt : 0;
  const ry = tilt ? (p.px - 0.5) * 2 * s.maxTilt : 0;
  return {
    "--ux-interactive-card-x": `${(p.px * 100).toFixed(2)}%`,
    "--ux-interactive-card-y": `${(p.py * 100).toFixed(2)}%`,
    "--ux-interactive-card-rx": `${rx.toFixed(3)}deg`,
    "--ux-interactive-card-ry": `${ry.toFixed(3)}deg`,
    "--ux-interactive-card-s": String(tilt ? s.scale : 1),
    "--ux-interactive-card-duration": `${p.active ? FOLLOW_MS : s.reset}ms`,
  };
}

/** Maps deviceorientation angles (phone held at ~45°) to a 0..1 pointer position */
export function orientationToPointer(beta: number, gamma: number): { px: number; py: number } {
  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  return { px: clamp(0.5 + gamma / 90), py: clamp(0.5 + (beta - 45) / 90) };
}
