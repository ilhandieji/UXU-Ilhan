// ASCII editor settings + their URL form (only values that differ from the defaults are written).
// The drawing itself is kept in localStorage because it is too large for a URL.
import { isCssColor } from "@/lib/color";
import { ALL_FONTS, DEFAULT_FONT, type AsciiAlign, type AsciiLayout } from "@/lib/ascii/fonts";
import { createGrid, MAX_GRID, type Grid } from "@/lib/ascii/grid";
import { QR_LEVELS, type QrLevel } from "@/lib/ascii/qr";
import {
  defaultImageOptions,
  type Charset,
  type ColorMode,
  type Dither,
  type ImageOptions,
} from "@/lib/ascii/image";

export type EditorTab = "text" | "image" | "draw" | "animate";
export type TextMode = "figlet" | "qr";

export interface EditorSettings {
  tab: EditorTab;
  /** FIGlet text or a QR code of the same text */
  textMode: TextMode;
  qrLevel: QrLevel;
  /** Draw light QR modules (scannable on a dark background) */
  qrInvert: boolean;
  text: string;
  font: string;
  layout: AsciiLayout;
  align: AsciiAlign;
  /** Wrap width in columns, 0 = no wrap */
  wrap: number;
  /** Color baked into text cells; empty = default foreground */
  textColor: string;
  image: ImageOptions;
  /** Preview font size (zoom) in px */
  zoom: number;
  foreground: string;
  background: string;
}

export const TABS = ["text", "image", "draw", "animate"] as const;
export const TEXT_MODES = ["figlet", "qr"] as const;
export const LAYOUTS = ["default", "fitted", "full", "smushed"] as const;
export const ALIGNS = ["left", "center", "right"] as const;
export const CHARSETS = [
  "standard",
  "detailed",
  "blocks",
  "braille",
  "binary",
  "halfblock",
  "custom",
] as const;
export const DITHERS = ["none", "floyd", "bayer"] as const;
export const COLOR_MODES = ["mono", "ansi16", "ansi256", "truecolor"] as const;

export const defaultSettings: EditorSettings = {
  tab: "text",
  textMode: "figlet",
  qrLevel: "M",
  qrInvert: true,
  text: "UXU-Ilhan",
  font: DEFAULT_FONT,
  layout: "default",
  align: "left",
  wrap: 0,
  textColor: "",
  image: { ...defaultImageOptions },
  zoom: 14,
  foreground: "#e6e6e6",
  background: "#0a0a0a",
};

export const DRAWING_KEY = "uxu:ascii-drawing";
export const DEFAULT_DRAWING = { width: 80, height: 24 };

/** Flat URL keys → setting paths; image options are prefixed with "i" to avoid clashes */
const STRING_KEYS = [
  "tab",
  "textMode",
  "qrLevel",
  "text",
  "font",
  "layout",
  "align",
  "textColor",
  "foreground",
  "background",
] as const;
const NUMBER_KEYS: Record<string, [min: number, max: number]> = {
  wrap: [0, 400],
  zoom: [6, 32],
};
const IMAGE_NUMBERS: Record<string, [min: number, max: number]> = {
  columns: [8, 400],
  brightness: [-1, 1],
  contrast: [0, 3],
  gamma: [0.2, 3],
  charAspect: [0.3, 1],
};

const ENUMS: Record<string, readonly string[]> = {
  tab: TABS,
  textMode: TEXT_MODES,
  qrLevel: QR_LEVELS,
  font: ALL_FONTS,
  layout: LAYOUTS,
  align: ALIGNS,
  charset: CHARSETS,
  dither: DITHERS,
  color: COLOR_MODES,
};

export function encodeSettings(s: EditorSettings): string {
  const d = defaultSettings;
  const params = new URLSearchParams();
  for (const key of STRING_KEYS) if (s[key] !== d[key]) params.set(key, s[key]);
  if (s.qrInvert !== d.qrInvert) params.set("qrInvert", s.qrInvert ? "1" : "0");
  for (const key of Object.keys(NUMBER_KEYS) as ("wrap" | "zoom")[])
    if (s[key] !== d[key]) params.set(key, String(s[key]));
  for (const [key, value] of Object.entries(s.image) as [
    keyof ImageOptions,
    ImageOptions[keyof ImageOptions],
  ][]) {
    if (value === d.image[key]) continue;
    params.set(
      `i${key[0].toUpperCase()}${key.slice(1)}`,
      typeof value === "boolean" ? (value ? "1" : "0") : String(value),
    );
  }
  return params.toString();
}

const clampNum = (raw: string, [min, max]: [number, number]) => {
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : undefined;
};

/** Invalid or unknown values are ignored */
export function decodeSettings(params: URLSearchParams): EditorSettings {
  const s: EditorSettings = { ...defaultSettings, image: { ...defaultSettings.image } };
  for (const key of STRING_KEYS) {
    const raw = params.get(key);
    if (raw === null || raw.length > 2000) continue;
    if (ENUMS[key] && !ENUMS[key].includes(raw)) continue;
    if (
      (key === "textColor" || key === "foreground" || key === "background") &&
      raw &&
      !isCssColor(raw)
    )
      continue;
    (s as unknown as Record<string, string>)[key] = raw;
  }
  const invert = params.get("qrInvert");
  if (invert === "1" || invert === "0") s.qrInvert = invert === "1";
  for (const [key, range] of Object.entries(NUMBER_KEYS)) {
    const raw = params.get(key);
    const n = raw === null ? undefined : clampNum(raw, range);
    if (n !== undefined) (s as unknown as Record<string, number>)[key] = Math.round(n);
  }
  const img = s.image as unknown as Record<string, string | number | boolean>;
  for (const key of Object.keys(defaultImageOptions)) {
    const raw = params.get(`i${key[0].toUpperCase()}${key.slice(1)}`);
    if (raw === null) continue;
    if (key in IMAGE_NUMBERS) {
      const n = clampNum(raw, IMAGE_NUMBERS[key]);
      if (n !== undefined) img[key] = key === "columns" ? Math.round(n) : n;
    } else if (key === "invert") img[key] = raw === "1";
    else if (key === "custom") img[key] = raw.slice(0, 200);
    else if (ENUMS[key]?.includes(raw)) img[key] = raw as Charset | Dither | ColorMode;
  }
  return s;
}

function isGrid(g: unknown): g is Grid {
  const v = g as Grid;
  return (
    !!v &&
    Number.isInteger(v.width) &&
    Number.isInteger(v.height) &&
    v.width > 0 &&
    v.height > 0 &&
    v.width <= MAX_GRID &&
    v.height <= MAX_GRID &&
    Array.isArray(v.cells) &&
    v.cells.length === v.width * v.height
  );
}

// ---------- Animation (frames are kept in localStorage like the drawing) ----------

export const ANIMATION_KEY = "uxu:ascii-animation";
export const MAX_FRAMES = 60;

export interface Animation {
  frames: Grid[];
  fps: number;
}

export function defaultAnimation(): Animation {
  return { frames: [createGrid(40, 12)], fps: 8 };
}

export function loadAnimation(): Animation {
  try {
    const parsed = JSON.parse(localStorage.getItem(ANIMATION_KEY) ?? "null") as Animation | null;
    if (!parsed || !Array.isArray(parsed.frames)) return defaultAnimation();
    const frames = parsed.frames.filter(isGrid).slice(0, MAX_FRAMES);
    const fps = Number.isFinite(parsed.fps) ? Math.min(30, Math.max(1, parsed.fps)) : 8;
    return frames.length ? { frames, fps } : defaultAnimation();
  } catch {
    return defaultAnimation();
  }
}

export function saveAnimation(animation: Animation) {
  try {
    localStorage.setItem(ANIMATION_KEY, JSON.stringify(animation));
  } catch {
    // Quota or private mode: frames just won't survive a reload
  }
}

export function loadDrawing(): Grid {
  try {
    const raw = localStorage.getItem(DRAWING_KEY);
    if (!raw) return createGrid(DEFAULT_DRAWING.width, DEFAULT_DRAWING.height);
    const g = JSON.parse(raw) as Grid;
    const valid =
      Number.isInteger(g.width) &&
      Number.isInteger(g.height) &&
      g.width > 0 &&
      g.height > 0 &&
      g.width <= MAX_GRID &&
      g.height <= MAX_GRID &&
      Array.isArray(g.cells) &&
      g.cells.length === g.width * g.height;
    return valid ? g : createGrid(DEFAULT_DRAWING.width, DEFAULT_DRAWING.height);
  } catch {
    return createGrid(DEFAULT_DRAWING.width, DEFAULT_DRAWING.height);
  }
}

export function saveDrawing(g: Grid) {
  try {
    localStorage.setItem(DRAWING_KEY, JSON.stringify(g));
  } catch {
    // Quota or private mode: the drawing just won't survive a reload
  }
}
