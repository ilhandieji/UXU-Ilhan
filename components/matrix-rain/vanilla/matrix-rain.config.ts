// MatrixRain settings and types — names must match the React version.
// Look values (colors, font, glow, opacity, z-index) are design tokens `--ux-matrix-rain-*`:
// set as CSS variables on the root and read back by the canvas engine, so any CSS color works.
// Behaviour values (speed, density, …) are validated settings passed to the engine.

export type MatrixRainThemeName = "matrix" | "cyan" | "amber" | "blood" | "mono";
/** contained: fills its container, under children · fullscreen: fixed over the viewport, click-through */
export type MatrixRainVariant = "contained" | "fullscreen";
export type MatrixRainSize = "sm" | "md" | "lg";
export type MatrixRainCharset = "katakana" | "binary" | "hex" | "latin" | "symbols" | "custom";
export type MatrixRainDirection = "down" | "up";

/** Token keys without the --ux-matrix-rain- prefix, e.g. { bg: '#000', head: '#fff' } */
export type MatrixRainTokens = Record<string, string>;

export interface MatrixRainOptions {
  theme?: MatrixRainThemeName | MatrixRainTokens;
  variant?: MatrixRainVariant;
  size?: MatrixRainSize;
  charset?: MatrixRainCharset;
  /** Characters used when charset is 'custom' */
  customChars?: string;
  /** Cell size in px (overrides the size / theme token) */
  fontSize?: number;
  /** Fall speed multiplier */
  speed?: number;
  /** 0–1 fraction of columns that rain */
  density?: number;
  /** 0–1: higher = shorter trails */
  fade?: number;
  /** Color of the leading character (any CSS color) */
  headColor?: string;
  /** Color of the trail (any CSS color) */
  color?: string;
  /** Background behind the rain (any CSS color, may be transparent) */
  bg?: string;
  /** Glow (shadow blur) of the leading character in px */
  glow?: number;
  /** 0–1 per-column speed variance */
  randomSpeed?: number;
  direction?: MatrixRainDirection;
  /** Opacity of the whole layer (0–1) */
  opacity?: number;
  /** z-index of the fullscreen layer */
  zIndex?: number;
  paused?: boolean;
  /** true = draw one static frame when the user prefers reduced motion */
  respectReducedMotion?: boolean;
  /** Columns near the pointer brighten and speed up */
  interactive?: boolean;
  maxDevicePixelRatio?: number;
}

export const defaults = {
  theme: "matrix",
  variant: "contained",
  size: "md",
  charset: "katakana",
  customChars: "",
  speed: 1,
  density: 0.85,
  fade: 0.35,
  randomSpeed: 0.5,
  direction: "down",
  paused: false,
  respectReducedMotion: true,
  interactive: false,
  maxDevicePixelRatio: 2,
} satisfies MatrixRainOptions;

const MONO = 'ui-monospace, "SFMono-Regular", Menlo, Consolas, "MS Gothic", monospace';

export const themes: Record<MatrixRainThemeName, MatrixRainTokens> = {
  matrix: {
    bg: "#020604",
    color: "#1fd65f",
    head: "#d8ffe4",
    glow: "8px",
    "font-family": MONO,
    opacity: "1",
    "z-index": "50",
  },
  cyan: {
    bg: "#01070a",
    color: "#22d3ee",
    head: "#e0fbff",
    glow: "8px",
    "font-family": MONO,
    opacity: "1",
    "z-index": "50",
  },
  amber: {
    bg: "#0a0600",
    color: "#f59e0b",
    head: "#fff3d6",
    glow: "8px",
    "font-family": MONO,
    opacity: "1",
    "z-index": "50",
  },
  blood: {
    bg: "#0a0102",
    color: "#e11d2e",
    head: "#ffd6da",
    glow: "10px",
    "font-family": MONO,
    opacity: "1",
    "z-index": "50",
  },
  mono: {
    bg: "#050505",
    color: "#a3a3a3",
    head: "#ffffff",
    glow: "4px",
    "font-family": MONO,
    opacity: "1",
    "z-index": "50",
  },
};

export const sizes: Record<MatrixRainSize, MatrixRainTokens> = {
  sm: { "font-size": "12px" },
  md: { "font-size": "16px" },
  lg: { "font-size": "22px" },
};

export const variants: Record<MatrixRainVariant, MatrixRainTokens> = {
  contained: {},
  fullscreen: {},
};

/** Built-in character sets (half-width katakana keeps every cell the same width) */
export const charsets: Record<Exclude<MatrixRainCharset, "custom">, string> = {
  katakana: "ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789",
  binary: "01",
  hex: "0123456789ABCDEF",
  latin: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  symbols: "+-*/=<>!?#$%&@^~:;|[]{}()",
};

/** Tailwind v4 classes — complete, static strings (so the scanner can see them) */
const layer =
  "pointer-events-none block h-full w-full select-none bg-(color:--ux-matrix-rain-bg) opacity-(--ux-matrix-rain-opacity)";

/** Canvas classes per variant */
export const layers: Record<MatrixRainVariant, string> = {
  contained: `${layer} absolute inset-0 -z-1`,
  fullscreen: `${layer} fixed inset-0 z-(--ux-matrix-rain-z-index)`,
};

/** React root per variant; `isolate` keeps the contained canvas (-z-1) behind children */
export const roots: Record<MatrixRainVariant, string> = {
  contained: "relative isolate h-full w-full overflow-hidden",
  fullscreen: "contents",
};

/** Classes a Vanilla host element gets per variant (removed again on destroy) */
export const hostClasses: Record<MatrixRainVariant, string[]> = {
  contained: ["relative", "isolate"],
  fullscreen: [],
};

export const classes = {
  content: "relative z-1 h-full w-full",
};

/** Everything the engine needs besides the tokens, validated */
export interface MatrixRainSettings {
  variant: MatrixRainVariant;
  glyphs: string[];
  speed: number;
  density: number;
  fade: number;
  randomSpeed: number;
  direction: MatrixRainDirection;
  paused: boolean;
  respectReducedMotion: boolean;
  interactive: boolean;
  maxDevicePixelRatio: number;
}

const warned = new Set<string>();
function warn(message: string) {
  if (warned.has(message)) return;
  warned.add(message);
  console.warn(`[MatrixRain] ${message}`);
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

const VARIANTS = ["contained", "fullscreen"] as const;
const SIZES = ["sm", "md", "lg"] as const;
const CHARSETS = ["katakana", "binary", "hex", "latin", "symbols", "custom"] as const;

function glyphsOf(charset: MatrixRainCharset, custom: unknown): string[] {
  if (charset !== "custom") return Array.from(charsets[charset]);
  const chars = typeof custom === "string" ? Array.from(new Set(Array.from(custom))) : [];
  const visible = chars.filter((char) => char.trim() !== "");
  if (visible.length) return visible;
  warn("charset 'custom' needs customChars, using katakana");
  return Array.from(charsets.katakana);
}

export function resolveSettings(options: MatrixRainOptions = {}): MatrixRainSettings {
  const o = options;
  const charset = oneOf(o.charset, CHARSETS, defaults.charset, "charset");
  return {
    variant: oneOf(o.variant, VARIANTS, defaults.variant, "variant"),
    glyphs: glyphsOf(charset, o.customChars),
    speed: num(o.speed, defaults.speed, 0.05, 10, "speed"),
    density: num(o.density, defaults.density, 0, 1, "density"),
    fade: num(o.fade, defaults.fade, 0, 1, "fade"),
    randomSpeed: num(o.randomSpeed, defaults.randomSpeed, 0, 1, "randomSpeed"),
    direction: oneOf(o.direction, ["down", "up"] as const, defaults.direction, "direction"),
    paused: bool(o.paused, defaults.paused, "paused"),
    respectReducedMotion: bool(
      o.respectReducedMotion,
      defaults.respectReducedMotion,
      "respectReducedMotion",
    ),
    interactive: bool(o.interactive, defaults.interactive, "interactive"),
    maxDevicePixelRatio: num(
      o.maxDevicePixelRatio,
      defaults.maxDevicePixelRatio,
      0.5,
      4,
      "maxDevicePixelRatio",
    ),
  };
}

const color = (value: unknown, name: string): string | undefined => {
  if (value === undefined) return undefined;
  if (typeof value === "string" && value.trim()) return value;
  warn(`invalid ${name}: ${String(value)}, using the theme value`);
  return undefined;
};

const px = (value: unknown, min: number, max: number, name: string): string | undefined => {
  if (value === undefined) return undefined;
  if (typeof value === "number" && Number.isFinite(value))
    return `${Math.min(max, Math.max(min, value))}px`;
  warn(`invalid ${name}: ${String(value)}, using the theme value`);
  return undefined;
};

/** Token merge order: theme ← size ← variant ← theme object ← direct options (bg, color, …) */
export function resolveTokens(options: MatrixRainOptions = {}): Record<string, string> {
  const theme = options.theme ?? defaults.theme;
  const named = typeof theme === "string";
  if (named && !(theme in themes)) warn(`unknown theme: ${theme}, using ${defaults.theme}`);
  const base = (named ? themes[theme as MatrixRainThemeName] : undefined) ?? themes[defaults.theme];
  const size = oneOf(options.size, SIZES, defaults.size, "size");
  const variant = oneOf(options.variant, VARIANTS, defaults.variant, "variant");
  const direct: Record<string, string | undefined> = {
    bg: color(options.bg, "bg"),
    color: color(options.color, "color"),
    head: color(options.headColor, "headColor"),
    glow: px(options.glow, 0, 100, "glow"),
    "font-size": px(options.fontSize, 6, 96, "fontSize"),
    opacity:
      options.opacity === undefined ? undefined : String(num(options.opacity, 1, 0, 1, "opacity")),
    "z-index":
      options.zIndex === undefined
        ? undefined
        : String(Math.round(num(options.zIndex, 50, -9999, 2147483647, "zIndex"))),
  };
  const tokens: MatrixRainTokens = {
    ...base,
    ...sizes[size],
    ...variants[variant],
    ...(named ? {} : (theme as MatrixRainTokens)),
  };
  for (const [key, value] of Object.entries(direct)) if (value !== undefined) tokens[key] = value;
  return Object.fromEntries(
    Object.entries(tokens).map(([key, value]) => [`--ux-matrix-rain-${key}`, value]),
  );
}
