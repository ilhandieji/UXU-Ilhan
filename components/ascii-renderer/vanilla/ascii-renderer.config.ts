// AsciiRenderer settings and types — names must match the React version.
// Styling is Tailwind-only: token values live here and are set as CSS variables on the root.
import type {
  Charset,
  ColorMode,
  Dither,
  PlayerSettings,
  ReadyInfo,
} from "./ascii-renderer.engine";

export type { Charset, ColorMode, Dither, ReadyInfo };

export type AsciiRendererThemeName = "terminal" | "paper" | "mono" | "amber";
export type AsciiRendererVariant = "default" | "outline";
export type AsciiRendererSize = "sm" | "md" | "lg";
export type AsciiRendererType = "auto" | "image" | "video";
/** canvas: fast, supports color · text: a <pre>, mono only, selectable/copyable */
export type AsciiRendererOutput = "canvas" | "text";
/** contain: fit inside the box · cover: fill the box (cropped) · none: natural size from font-size */
export type AsciiRendererFit = "contain" | "cover" | "none";
export type AsciiRendererCrossOrigin = "anonymous" | "use-credentials" | "none";

/** Token keys without the --ux-ascii-renderer- prefix, e.g. { bg: '#000' } */
export type AsciiRendererTokens = Record<string, string>;

export interface AsciiRendererOptions {
  theme?: AsciiRendererThemeName | AsciiRendererTokens;
  variant?: AsciiRendererVariant;
  size?: AsciiRendererSize;
  /** Image or video URL (needs CORS headers when cross-origin) */
  src?: string;
  /** auto = video when the URL ends in .mp4/.webm/.ogv/.mov/.m4v/.mkv (or is a data:video URL) */
  type?: AsciiRendererType;
  /** Accessible label (role="img" + aria-label on the root) */
  alt?: string;
  /** Output width in characters (4–400) */
  columns?: number;
  charset?: Charset;
  /** Light → dense ramp used when charset is "custom" */
  customChars?: string;
  color?: ColorMode;
  dither?: Dither;
  invert?: boolean;
  /** -1…1 */
  brightness?: number;
  /** 0…3 (1 = unchanged) */
  contrast?: number;
  /** 0.2…3 (1 = unchanged) */
  gamma?: number;
  /** Character width / height ratio; 0 = measured from the font */
  charAspect?: number;
  output?: AsciiRendererOutput;
  fit?: AsciiRendererFit;
  /** Video conversions per second (1–60) */
  fps?: number;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  crossOrigin?: AsciiRendererCrossOrigin;
  /** Font size in px; 0 = use the font-size token of `size` */
  fontSize?: number;
  /** With reduced motion only the first video frame is shown until play() is called */
  respectReducedMotion?: boolean;
  maxDevicePixelRatio?: number;
  onReady?: (info: ReadyInfo) => void;
  onError?: (error: Error) => void;
}

export const defaults = {
  theme: "terminal",
  variant: "default",
  size: "md",
  src: "",
  type: "auto",
  alt: "ASCII art",
  columns: 80,
  charset: "standard",
  customChars: " .:oO@",
  color: "mono",
  dither: "none",
  invert: false,
  brightness: 0,
  contrast: 1,
  gamma: 1,
  charAspect: 0,
  output: "canvas",
  fit: "contain",
  fps: 24,
  autoplay: true,
  loop: true,
  muted: true,
  crossOrigin: "anonymous",
  fontSize: 0,
  respectReducedMotion: true,
  maxDevicePixelRatio: 2,
} satisfies AsciiRendererOptions;

const base: AsciiRendererTokens = {
  "font-family": "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  "line-height": "1.2",
  radius: "8px",
};

export const themes: Record<AsciiRendererThemeName, AsciiRendererTokens> = {
  terminal: { ...base, bg: "#050a05", fg: "#33ff66", border: "#1f4d2a" },
  paper: { ...base, bg: "#f4efe1", fg: "#1a1a1a", border: "#d8cfb8" },
  mono: { ...base, bg: "#000000", fg: "#ffffff", border: "#333333" },
  amber: { ...base, bg: "#0d0800", fg: "#ffb000", border: "#4d3500" },
};

export const sizes: Record<AsciiRendererSize, AsciiRendererTokens> = {
  sm: { "font-size": "8px", padding: "8px" },
  md: { "font-size": "10px", padding: "12px" },
  lg: { "font-size": "14px", padding: "16px" },
};

export const variants: Record<AsciiRendererVariant, AsciiRendererTokens> = {
  default: { "border-width": "0px" },
  outline: { "border-width": "1px" },
};

/** Tailwind v4 classes — complete, static strings (so the scanner can see them) */
export const classes = {
  /** Height comes from the parent when it has one, otherwise from the output's aspect ratio */
  root: "relative block h-full w-full overflow-hidden aspect-(--ux-ascii-renderer-aspect) border-solid bg-(color:--ux-ascii-renderer-bg) text-(color:--ux-ascii-renderer-fg) border-(color:--ux-ascii-renderer-border) border-(length:--ux-ascii-renderer-border-width) rounded-(--ux-ascii-renderer-radius) font-(family-name:--ux-ascii-renderer-font-family) text-(length:--ux-ascii-renderer-font-size) leading-(--ux-ascii-renderer-line-height)",
  layer:
    "absolute inset-0 flex items-center justify-center overflow-hidden p-(--ux-ascii-renderer-padding)",
  canvas: "block shrink-0 w-(--ux-ascii-renderer-out-w) h-(--ux-ascii-renderer-out-h)",
  text: "m-0 block shrink-0 whitespace-pre select-text bg-transparent font-(family-name:--ux-ascii-renderer-font-family) text-(length:--ux-ascii-renderer-out-font-size) leading-(--ux-ascii-renderer-line-height) text-(color:--ux-ascii-renderer-fg)",
  video: "pointer-events-none absolute top-0 left-0 h-px w-px opacity-0",
};

/** Everything the player needs, validated */
export type AsciiRendererSettings = PlayerSettings & { alt: string };

const warned = new Set<string>();
function warn(message: string) {
  if (warned.has(message)) return;
  warned.add(message);
  console.warn(`[AsciiRenderer] ${message}`);
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

function str(value: unknown, fallback: string, name: string): string {
  if (value === undefined) return fallback;
  if (typeof value === "string") return value;
  warn(`invalid ${name}: ${String(value)}, using "${fallback}"`);
  return fallback;
}

export const CHARSETS = [
  "standard",
  "detailed",
  "blocks",
  "braille",
  "binary",
  "halfblock",
  "custom",
] as const;
export const COLOR_MODES = ["mono", "ansi16", "ansi256", "truecolor"] as const;
export const DITHERS = ["none", "floyd", "bayer"] as const;

export function resolveSettings(o: AsciiRendererOptions = {}): AsciiRendererSettings {
  const d = defaults;
  return {
    src: str(o.src, d.src, "src").trim(),
    type: oneOf(o.type, ["auto", "image", "video"] as const, d.type, "type"),
    alt: str(o.alt, d.alt, "alt") || d.alt,
    columns: Math.round(num(o.columns, d.columns, 4, 400, "columns")),
    charset: oneOf(o.charset, CHARSETS, d.charset, "charset"),
    customChars: str(o.customChars, d.customChars, "customChars"),
    color: oneOf(o.color, COLOR_MODES, d.color, "color"),
    dither: oneOf(o.dither, DITHERS, d.dither, "dither"),
    invert: bool(o.invert, d.invert, "invert"),
    brightness: num(o.brightness, d.brightness, -1, 1, "brightness"),
    contrast: num(o.contrast, d.contrast, 0, 3, "contrast"),
    gamma: num(o.gamma, d.gamma, 0.2, 3, "gamma"),
    charAspect: num(o.charAspect, d.charAspect, 0, 2, "charAspect"),
    output: oneOf(o.output, ["canvas", "text"] as const, d.output, "output"),
    fit: oneOf(o.fit, ["contain", "cover", "none"] as const, d.fit, "fit"),
    fps: num(o.fps, d.fps, 1, 60, "fps"),
    autoplay: bool(o.autoplay, d.autoplay, "autoplay"),
    loop: bool(o.loop, d.loop, "loop"),
    muted: bool(o.muted, d.muted, "muted"),
    crossOrigin: oneOf(
      o.crossOrigin,
      ["anonymous", "use-credentials", "none"] as const,
      d.crossOrigin,
      "crossOrigin",
    ),
    respectReducedMotion: bool(
      o.respectReducedMotion,
      d.respectReducedMotion,
      "respectReducedMotion",
    ),
    maxDevicePixelRatio: num(
      o.maxDevicePixelRatio,
      d.maxDevicePixelRatio,
      0.5,
      4,
      "maxDevicePixelRatio",
    ),
    onReady: o.onReady,
    onError: o.onError,
  };
}

/** Token merge order: theme ← size ← variant ← user override (theme object) ← fontSize */
export function resolveTokens(o: AsciiRendererOptions = {}): Record<string, string> {
  const theme = o.theme ?? defaults.theme;
  const named = typeof theme === "string";
  if (named && !(theme in themes)) warn(`unknown theme: ${theme}, using ${defaults.theme}`);
  const size = oneOf(o.size, ["sm", "md", "lg"] as const, defaults.size, "size");
  const variant = oneOf(o.variant, ["default", "outline"] as const, defaults.variant, "variant");
  const preset =
    (named ? themes[theme as AsciiRendererThemeName] : undefined) ?? themes[defaults.theme];
  const tokens: AsciiRendererTokens = {
    ...preset,
    ...sizes[size],
    ...variants[variant],
    ...(named ? {} : theme),
  };
  const fontSize = num(o.fontSize, defaults.fontSize, 0, 200, "fontSize");
  if (fontSize > 0) tokens["font-size"] = `${fontSize}px`;
  return Object.fromEntries(
    Object.entries(tokens).map(([key, value]) => [`--ux-ascii-renderer-${key}`, value]),
  );
}
