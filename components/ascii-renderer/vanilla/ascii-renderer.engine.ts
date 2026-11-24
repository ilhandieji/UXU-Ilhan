// AsciiRenderer engine — framework-free and identical in the React and Vanilla folders.
// Part 1: image → character grid (ramps, blocks, braille, binary, colored half-blocks) with
//         brightness/contrast/gamma, dithering and terminal color quantization.
// Part 2: canvas painter (block glyphs drawn as rectangles so they tile without seams).
// Part 3: player — loads an image or video, converts it at `fps`, fits it into its box.
// Nothing here touches window/document at module level, so it is SSR-safe to import.

/* ------------------------------------------------------------------ */
/* Grid model                                                          */
/* ------------------------------------------------------------------ */

export interface Cell {
  ch: string;
  /** Foreground color (hex); undefined = default text color */
  fg?: string;
  /** Background color (hex); undefined = transparent */
  bg?: string;
}

export interface Grid {
  width: number;
  height: number;
  /** Row-major: index = y * width + x */
  cells: Cell[];
}

export const BLANK: Cell = { ch: " " };

/** Grid → plain text (one line per row, trailing spaces trimmed) */
export function gridToText(g: Grid | null): string {
  if (!g) return "";
  const lines: string[] = [];
  for (let y = 0; y < g.height; y++) {
    let line = "";
    for (let x = 0; x < g.width; x++) line += g.cells[y * g.width + x].ch;
    lines.push(line.trimEnd());
  }
  return lines.join("\n");
}

/* ------------------------------------------------------------------ */
/* Palettes                                                            */
/* ------------------------------------------------------------------ */

export type Rgb = [number, number, number];

/** xterm default 16-color palette (normal 0–7, bright 8–15) */
export const ANSI16: Rgb[] = [
  [0, 0, 0],
  [205, 0, 0],
  [0, 205, 0],
  [205, 205, 0],
  [0, 0, 238],
  [205, 0, 205],
  [0, 205, 205],
  [229, 229, 229],
  [127, 127, 127],
  [255, 0, 0],
  [0, 255, 0],
  [255, 255, 0],
  [92, 92, 255],
  [255, 0, 255],
  [0, 255, 255],
  [255, 255, 255],
];

/** xterm 256: 16 system colors + 6×6×6 cube + 24 grays */
export const ANSI256: Rgb[] = (() => {
  const steps = [0, 95, 135, 175, 215, 255];
  const cube: Rgb[] = [];
  for (let r = 0; r < 6; r++)
    for (let g = 0; g < 6; g++)
      for (let b = 0; b < 6; b++) cube.push([steps[r], steps[g], steps[b]]);
  const grays: Rgb[] = Array.from({ length: 24 }, (_, i) => {
    const v = 8 + i * 10;
    return [v, v, v];
  });
  return [...ANSI16, ...cube, ...grays];
})();

/** Perceptually weighted squared distance (cheap "redmean" approximation) */
function distance([r1, g1, b1]: Rgb, [r2, g2, b2]: Rgb): number {
  const rm = (r1 + r2) / 2;
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return (2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db;
}

export function nearestIndex(rgb: Rgb, palette: Rgb[]): number {
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < palette.length; i++) {
    const d = distance(rgb, palette[i]);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}

const hex2 = (n: number) => Math.round(n).toString(16).padStart(2, "0");
export const rgbToHex = ([r, g, b]: Rgb) => `#${hex2(r)}${hex2(g)}${hex2(b)}`;
export function hexToRgb(hex: string): Rgb {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.replace(/./g, (c) => c + c) : h.slice(0, 6);
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/* ------------------------------------------------------------------ */
/* Image → grid                                                        */
/* ------------------------------------------------------------------ */

export type Charset =
  "standard" | "detailed" | "blocks" | "braille" | "binary" | "halfblock" | "custom";
export type Dither = "none" | "floyd" | "bayer";
export type ColorMode = "mono" | "ansi16" | "ansi256" | "truecolor";

export interface ImageOptions {
  /** Output width in characters */
  columns: number;
  charset: Charset;
  /** Light → dense ramp used when charset is custom */
  custom: string;
  invert: boolean;
  /** -1…1 */
  brightness: number;
  /** 0…3 (1 = unchanged) */
  contrast: number;
  /** 0.2…3 (1 = unchanged) */
  gamma: number;
  dither: Dither;
  color: ColorMode;
  /** Character width / height ratio of the display font (≈0.5 for most monospace fonts) */
  charAspect: number;
}

export const defaultImageOptions: ImageOptions = {
  columns: 100,
  charset: "standard",
  custom: " .:oO@",
  invert: false,
  brightness: 0,
  contrast: 1,
  gamma: 1,
  dither: "none",
  color: "mono",
  charAspect: 0.5,
};

/** Ramps ordered light → dense (dense = bright on a dark background) */
export const RAMPS: Record<"standard" | "detailed" | "blocks", string> = {
  standard: " .:-=+*#%@",
  detailed: " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
  blocks: " ░▒▓█",
};

const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);

/** Braille dot bit for sub-pixel (dx 0–1, dy 0–3) */
const BRAILLE_BITS = [
  [0x01, 0x08],
  [0x02, 0x10],
  [0x04, 0x20],
  [0x40, 0x80],
];

const MAX_COLUMNS = 400;

type Pixels = { data: Uint8ClampedArray; width: number; height: number };

// One reusable sampling canvas: video conversion runs many times per second
let sampler: CanvasRenderingContext2D | null = null;

function sample(source: CanvasImageSource, width: number, height: number): Pixels {
  if (!sampler) {
    const canvas = document.createElement("canvas");
    sampler = canvas.getContext("2d", { willReadFrequently: true });
    if (!sampler) throw new Error("Canvas 2D is not available");
  }
  const ctx = sampler;
  ctx.canvas.width = width;
  ctx.canvas.height = height;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, width, height);
  return { data: ctx.getImageData(0, 0, width, height).data, width, height };
}

/** Per-pixel luminance (0–1) after tone adjustments; transparent pixels count as black */
function luminance(px: Pixels, o: ImageOptions): Float32Array {
  const out = new Float32Array(px.width * px.height);
  for (let i = 0; i < out.length; i++) {
    const r = px.data[i * 4];
    const g = px.data[i * 4 + 1];
    const b = px.data[i * 4 + 2];
    const a = px.data[i * 4 + 3] / 255;
    let l = ((0.2126 * r + 0.7152 * g + 0.0722 * b) / 255) * a;
    l = (l - 0.5) * o.contrast + 0.5 + o.brightness;
    l = Math.pow(Math.min(1, Math.max(0, l)), 1 / o.gamma);
    out[i] = o.invert ? 1 - l : l;
  }
  return out;
}

/** Quantizes luminance to `levels` steps with optional dithering → level index per pixel */
function quantize(
  lum: Float32Array,
  width: number,
  height: number,
  levels: number,
  dither: Dither,
): Uint16Array {
  const out = new Uint16Array(lum.length);
  const max = levels - 1;
  if (dither === "floyd") {
    const buf = Float32Array.from(lum);
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        const level = Math.min(max, Math.max(0, Math.round(buf[i] * max)));
        out[i] = level;
        const err = buf[i] - level / max;
        if (x + 1 < width) buf[i + 1] += (err * 7) / 16;
        if (y + 1 < height) {
          if (x > 0) buf[i + width - 1] += (err * 3) / 16;
          buf[i + width] += (err * 5) / 16;
          if (x + 1 < width) buf[i + width + 1] += err / 16;
        }
      }
    return out;
  }
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const t = dither === "bayer" ? BAYER4[(y % 4) * 4 + (x % 4)] - 0.5 : 0;
      out[i] = Math.min(max, Math.max(0, Math.round(lum[i] * max + t)));
    }
  return out;
}

// Nearest-palette lookups are cached per exact color; bounded so long videos cannot grow it forever
const PALETTE_CACHE_LIMIT = 65536;
const paletteCache = { ansi16: new Map<number, string>(), ansi256: new Map<number, string>() };

function nearestHex(rgb: Rgb, mode: "ansi16" | "ansi256"): string {
  const cache = paletteCache[mode];
  const key = (Math.round(rgb[0]) << 16) | (Math.round(rgb[1]) << 8) | Math.round(rgb[2]);
  const hit = cache.get(key);
  if (hit) return hit;
  const palette = mode === "ansi16" ? ANSI16 : ANSI256;
  const hex = rgbToHex(palette[nearestIndex(rgb, palette)]);
  if (cache.size >= PALETTE_CACHE_LIMIT) cache.clear();
  cache.set(key, hex);
  return hex;
}

function quantizeColor(rgb: Rgb, mode: ColorMode): string | undefined {
  if (mode === "mono") return undefined;
  if (mode === "truecolor") return rgbToHex(rgb);
  return nearestHex(rgb, mode);
}

const rgbAt = (px: Pixels, x: number, y: number): Rgb => {
  const i = (y * px.width + x) * 4;
  return [px.data[i], px.data[i + 1], px.data[i + 2]];
};

function average(colors: Rgb[]): Rgb {
  if (!colors.length) return [0, 0, 0];
  const sum = colors.reduce((s, c) => [s[0] + c[0], s[1] + c[1], s[2] + c[2]], [0, 0, 0]);
  return [sum[0] / colors.length, sum[1] / colors.length, sum[2] / colors.length];
}

function rampGrid(
  source: CanvasImageSource,
  cols: number,
  rows: number,
  ramp: string[],
  o: ImageOptions,
): Cell[] {
  const px = sample(source, cols, rows);
  const levels = quantize(luminance(px, o), cols, rows, ramp.length, o.dither);
  return Array.from(levels, (level, i) => {
    const ch = ramp[level];
    if (ch === " ") return BLANK;
    const fg = quantizeColor(rgbAt(px, i % cols, Math.floor(i / cols)), o.color);
    return fg ? { ch, fg } : { ch };
  });
}

/** Lit pixels become 0/1 digits (pattern-stable), unlit ones stay empty */
function binaryGrid(
  source: CanvasImageSource,
  cols: number,
  rows: number,
  o: ImageOptions,
): Cell[] {
  const px = sample(source, cols, rows);
  const bits = quantize(luminance(px, o), cols, rows, 2, o.dither);
  return Array.from(bits, (bit, i) => {
    if (!bit) return BLANK;
    const x = i % cols;
    const y = Math.floor(i / cols);
    const ch = (x * 7 + y * 13) % 3 === 0 ? "0" : "1";
    const fg = quantizeColor(rgbAt(px, x, y), o.color);
    return fg ? { ch, fg } : { ch };
  });
}

/** 2×4 sub-pixels per character */
function brailleGrid(
  source: CanvasImageSource,
  cols: number,
  rows: number,
  o: ImageOptions,
): Cell[] {
  const px = sample(source, cols * 2, rows * 4);
  const bits = quantize(luminance(px, o), px.width, px.height, 2, o.dither);
  const cells: Cell[] = [];
  for (let cy = 0; cy < rows; cy++)
    for (let cx = 0; cx < cols; cx++) {
      let code = 0;
      const lit: Rgb[] = [];
      for (let dy = 0; dy < 4; dy++)
        for (let dx = 0; dx < 2; dx++) {
          const x = cx * 2 + dx;
          const y = cy * 4 + dy;
          if (bits[y * px.width + x]) {
            code |= BRAILLE_BITS[dy][dx];
            lit.push(rgbAt(px, x, y));
          }
        }
      if (!code) {
        cells.push(BLANK);
        continue;
      }
      const fg = quantizeColor(average(lit), o.color);
      const ch = String.fromCharCode(0x2800 + code);
      cells.push(fg ? { ch, fg } : { ch });
    }
  return cells;
}

/** ▀ with fg = top pixel and bg = bottom pixel: two square color pixels per character */
function halfBlockGrid(
  source: CanvasImageSource,
  cols: number,
  rows: number,
  o: ImageOptions,
): Cell[] {
  const px = sample(source, cols, rows * 2);
  const lum = luminance(px, o);
  const mode = o.color === "mono" ? "truecolor" : o.color;
  // Apply the tone adjustments to color by scaling with the adjusted luminance ratio
  const tone = (x: number, y: number): string => {
    const rgb = rgbAt(px, x, y);
    const base = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;
    const target = lum[y * px.width + x];
    const k = base > 0.001 ? target / base : 0;
    const adjusted: Rgb =
      o.color === "mono"
        ? [target * 255, target * 255, target * 255]
        : [Math.min(255, rgb[0] * k), Math.min(255, rgb[1] * k), Math.min(255, rgb[2] * k)];
    return quantizeColor(adjusted, mode) ?? "#000000";
  };
  const cells: Cell[] = [];
  for (let cy = 0; cy < rows; cy++)
    for (let cx = 0; cx < cols; cx++)
      cells.push({ ch: "▀", fg: tone(cx, cy * 2), bg: tone(cx, cy * 2 + 1) });
  return cells;
}

export function convertImage(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  options: Partial<ImageOptions> = {},
): Grid {
  const o = { ...defaultImageOptions, ...options };
  const cols = Math.max(4, Math.min(MAX_COLUMNS, Math.round(o.columns)));
  const ratio = sourceHeight / Math.max(1, sourceWidth);
  const rows = Math.max(1, Math.min(MAX_COLUMNS, Math.round(cols * ratio * o.charAspect)));

  let cells: Cell[];
  switch (o.charset) {
    case "braille":
      cells = brailleGrid(source, cols, rows, o);
      break;
    case "halfblock":
      cells = halfBlockGrid(source, cols, rows, o);
      break;
    case "binary":
      cells = binaryGrid(source, cols, rows, o);
      break;
    case "custom": {
      const ramp = Array.from(o.custom || RAMPS.standard);
      cells = rampGrid(source, cols, rows, ramp.length > 1 ? ramp : Array.from(RAMPS.standard), o);
      break;
    }
    default:
      cells = rampGrid(source, cols, rows, Array.from(RAMPS[o.charset]), o);
  }
  return { width: cols, height: rows, cells };
}

/* ------------------------------------------------------------------ */
/* Canvas painter                                                      */
/* ------------------------------------------------------------------ */

export interface CellSize {
  width: number;
  height: number;
}

export const LINE_HEIGHT = 1.2;

export function measureCell(
  ctx: CanvasRenderingContext2D,
  fontSize: number,
  font: string,
  lineHeight = LINE_HEIGHT,
): CellSize {
  ctx.font = `${fontSize}px ${font}`;
  return { width: ctx.measureText("M").width, height: fontSize * lineHeight };
}

/** Fraction rectangles [x, y, w, h] (0–1 of the cell) for block glyphs */
const BLOCKS: Record<string, [number, number, number, number]> = {
  "█": [0, 0, 1, 1],
  "▀": [0, 0, 1, 0.5],
  "▄": [0, 0.5, 1, 0.5],
  "▌": [0, 0, 0.5, 1],
  "▐": [0.5, 0, 0.5, 1],
};
const SHADES: Record<string, number> = { "░": 0.25, "▒": 0.5, "▓": 0.75 };

export interface PaintOptions {
  cell: CellSize;
  fontSize: number;
  font: string;
  /** Color for cells without fg */
  foreground: string;
}

export function paintGrid(
  ctx: CanvasRenderingContext2D,
  g: Grid,
  { cell, fontSize, font, foreground }: PaintOptions,
) {
  const { width: cw, height: ch } = cell;
  ctx.font = `${fontSize}px ${font}`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  for (let y = 0; y < g.height; y++)
    for (let x = 0; x < g.width; x++) {
      const c = g.cells[y * g.width + x];
      const px = x * cw;
      const py = y * ch;
      if (c.bg) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = c.bg;
        // +0.5 px overlap hides anti-aliasing seams between neighbouring backgrounds
        ctx.fillRect(px, py, cw + 0.5, ch + 0.5);
      }
      if (c.ch === " ") continue;
      ctx.fillStyle = c.fg ?? foreground;
      const block = BLOCKS[c.ch];
      if (block) {
        ctx.globalAlpha = 1;
        ctx.fillRect(
          px + block[0] * cw,
          py + block[1] * ch,
          block[2] * cw + 0.5,
          block[3] * ch + 0.5,
        );
        continue;
      }
      const shade = SHADES[c.ch];
      if (shade) {
        ctx.globalAlpha = shade;
        ctx.fillRect(px, py, cw + 0.5, ch + 0.5);
        ctx.globalAlpha = 1;
        continue;
      }
      ctx.globalAlpha = 1;
      ctx.fillText(c.ch, px, py + ch / 2);
    }
  ctx.globalAlpha = 1;
}

/* ------------------------------------------------------------------ */
/* Player                                                              */
/* ------------------------------------------------------------------ */

export type MediaType = "image" | "video";

export interface ReadyInfo {
  type: MediaType;
  /** Natural size of the loaded media in px */
  sourceWidth: number;
  sourceHeight: number;
  columns: number;
  rows: number;
}

/** Validated settings the player needs (the config file produces them) */
export interface PlayerSettings {
  src: string;
  type: "auto" | MediaType;
  columns: number;
  charset: Charset;
  customChars: string;
  color: ColorMode;
  dither: Dither;
  invert: boolean;
  brightness: number;
  contrast: number;
  gamma: number;
  /** 0 = measured from the font */
  charAspect: number;
  output: "canvas" | "text";
  fit: "contain" | "cover" | "none";
  fps: number;
  autoplay: boolean;
  loop: boolean;
  muted: boolean;
  crossOrigin: "anonymous" | "use-credentials" | "none";
  respectReducedMotion: boolean;
  maxDevicePixelRatio: number;
  onReady?: (info: ReadyInfo) => void;
  onError?: (error: Error) => void;
}

export interface PlayerElements {
  /** Sized box; font, color and line-height are read from its computed style */
  root: HTMLElement;
  /** Inner box (with padding) the output is fitted into */
  layer: HTMLElement;
  canvas: HTMLCanvasElement;
  text: HTMLElement;
}

export interface PlayerClasses {
  /** Classes of the hidden <video> element the player creates */
  video: string;
}

export interface AsciiPlayer {
  update(settings: PlayerSettings): void;
  play(): void;
  pause(): void;
  /** Converts the current frame again right now */
  render(): void;
  toText(): string;
  destroy(): void;
}

const VIDEO_EXT = /\.(mp4|webm|ogv|ogg|mov|m4v|mkv)(?:[?#]|$)/i;
/** Keeps the canvas backing store within a safe size on huge containers */
const MAX_CANVAS_PIXELS = 16_000_000;
/** CSS variables the player writes (geometry, not theme tokens) */
const VAR_ASPECT = "--ux-ascii-renderer-aspect";
const VAR_OUT_W = "--ux-ascii-renderer-out-w";
const VAR_OUT_H = "--ux-ascii-renderer-out-h";
const VAR_OUT_FONT = "--ux-ascii-renderer-out-font-size";

export function resolveMediaType(src: string, type: PlayerSettings["type"]): MediaType {
  if (type !== "auto") return type;
  if (/^data:video\//i.test(src)) return "video";
  return VIDEO_EXT.test(src) ? "video" : "image";
}

type Source = {
  el: HTMLImageElement | HTMLVideoElement;
  width: number;
  height: number;
  type: MediaType;
};
type Metrics = {
  fontSize: number;
  lineHeight: number;
  font: string;
  color: string;
  cw: number;
  ch: number;
};

const conversionKey = (s: PlayerSettings) =>
  [
    s.columns,
    s.charset,
    s.customChars,
    s.color,
    s.dither,
    s.invert,
    s.brightness,
    s.contrast,
    s.gamma,
    s.charAspect,
    s.output,
    s.fit,
    s.maxDevicePixelRatio,
  ].join("|");

export function createAsciiPlayer(
  els: PlayerElements,
  initial: PlayerSettings,
  classes: PlayerClasses,
): AsciiPlayer {
  const { root, layer, canvas, text } = els;
  let s = initial;
  let destroyed = false;
  let source: Source | null = null;
  let grid: Grid | null = null;
  let loadId = 0;
  let image: HTMLImageElement | null = null;
  let video: HTMLVideoElement | null = null;
  let wantPlay = false;
  let inView = true;
  let raf = 0;
  let lastFrame = 0;
  let resizeRaf = 0;
  let metrics: Metrics | null = null;
  let renderedKey = "";
  const measureCtx = document.createElement("canvas").getContext("2d");
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");

  root.style.setProperty(VAR_ASPECT, "16 / 9");

  function fail(error: Error) {
    if (destroyed) return;
    s.onError?.(error);
    if (!s.onError) console.warn(`[AsciiRenderer] ${error.message}`);
  }

  function measure(): Metrics {
    const cs = getComputedStyle(root);
    const fontSize = Number.parseFloat(cs.fontSize) || 10;
    const lh = Number.parseFloat(cs.lineHeight);
    const lineHeight = Number.isFinite(lh) && lh > 0 ? lh / fontSize : LINE_HEIGHT;
    const font = cs.fontFamily || "monospace";
    const cell = measureCtx
      ? measureCell(measureCtx, fontSize, font, lineHeight)
      : { width: fontSize * 0.6, height: fontSize * lineHeight };
    return {
      fontSize,
      lineHeight,
      font,
      color: cs.color,
      cw: cell.width || fontSize * 0.6,
      ch: cell.height,
    };
  }

  const metricsKey = (m: Metrics) => `${m.fontSize}|${m.lineHeight}|${m.font}|${m.color}|${m.cw}`;

  /** Sizes the output box (and the root's aspect ratio) for the current grid */
  function layout(): number {
    if (!grid || !metrics) return 1;
    const w = grid.width * metrics.cw;
    const h = grid.height * metrics.ch;
    root.style.setProperty(VAR_ASPECT, `${w} / ${h}`);
    const cs = getComputedStyle(layer);
    const aw =
      layer.clientWidth - Number.parseFloat(cs.paddingLeft) - Number.parseFloat(cs.paddingRight);
    const ah =
      layer.clientHeight - Number.parseFloat(cs.paddingTop) - Number.parseFloat(cs.paddingBottom);
    let scale = 1;
    if (s.fit !== "none" && aw > 0) {
      const sx = aw / w;
      const sy = ah > 0 ? ah / h : sx;
      scale = s.fit === "contain" ? Math.min(sx, sy) : Math.max(sx, sy);
    }
    if (!Number.isFinite(scale) || scale <= 0) scale = 1;
    if (s.output === "text") {
      text.style.setProperty(VAR_OUT_FONT, `${metrics.fontSize * scale}px`);
      return scale;
    }
    const cssW = w * scale;
    const cssH = h * scale;
    let dpr = Math.min(window.devicePixelRatio || 1, s.maxDevicePixelRatio);
    const pixels = cssW * cssH * dpr * dpr;
    if (pixels > MAX_CANVAS_PIXELS) dpr *= Math.sqrt(MAX_CANVAS_PIXELS / pixels);
    canvas.style.setProperty(VAR_OUT_W, `${cssW}px`);
    canvas.style.setProperty(VAR_OUT_H, `${cssH}px`);
    const bw = Math.max(1, Math.round(cssW * dpr));
    const bh = Math.max(1, Math.round(cssH * dpr));
    if (canvas.width !== bw) canvas.width = bw;
    if (canvas.height !== bh) canvas.height = bh;
    return scale;
  }

  function paint() {
    if (!grid || !metrics) return;
    if (s.output === "text") {
      text.textContent = gridToText(grid);
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const k = canvas.width / Math.max(1, grid.width * metrics.cw);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(k, 0, 0, k, 0, 0);
    paintGrid(ctx, grid, {
      cell: { width: metrics.cw, height: metrics.ch },
      fontSize: metrics.fontSize,
      font: metrics.font,
      foreground: metrics.color,
    });
  }

  function showOutput() {
    canvas.hidden = s.output !== "canvas";
    text.hidden = s.output !== "text";
    if (s.output === "canvas") text.textContent = "";
  }

  /** Converts the current frame and paints it; returns false on failure */
  function convertNow(): boolean {
    if (!source || destroyed) return false;
    if (source.type === "video" && (video?.readyState ?? 0) < 2) return false;
    metrics ??= measure();
    try {
      const prevW = grid?.width;
      const prevH = grid?.height;
      grid = convertImage(source.el, source.width, source.height, {
        columns: s.columns,
        charset: s.charset,
        custom: s.customChars,
        invert: s.invert,
        brightness: s.brightness,
        contrast: s.contrast,
        gamma: s.gamma,
        dither: s.dither,
        color: s.output === "text" ? "mono" : s.color,
        charAspect: s.charAspect > 0 ? s.charAspect : metrics.cw / metrics.ch,
      });
      if (grid.width !== prevW || grid.height !== prevH || renderedKey === "") layout();
    } catch (e) {
      const cors = e instanceof DOMException && e.name === "SecurityError";
      fail(
        new Error(
          cors
            ? `Cannot read pixels of "${s.src}" (cross-origin). The server must send CORS headers.`
            : e instanceof Error
              ? e.message
              : String(e),
        ),
      );
      return false;
    }
    paint();
    return true;
  }

  /** Full re-render: re-measure fonts, convert, lay out and paint */
  function refresh() {
    metrics = measure();
    showOutput();
    if (!convertNow()) return;
    layout();
    paint();
    renderedKey = conversionKey(s) + metricsKey(metrics);
  }

  /* ---------------- video playback ---------------- */

  const shouldAutoplay = () =>
    s.autoplay && !(s.respectReducedMotion && reducedMotion?.matches === true);

  function applyPlayback() {
    if (!video || source?.type !== "video") return;
    const run = wantPlay && inView && !document.hidden;
    if (run && video.paused) {
      video.play().catch((e: unknown) => {
        // Autoplay with sound is commonly blocked until a user gesture
        if (e instanceof DOMException && e.name === "NotAllowedError") return;
        if (e instanceof DOMException && e.name === "AbortError") return;
        fail(e instanceof Error ? e : new Error(String(e)));
      });
    } else if (!run && !video.paused) video.pause();
  }

  function tick(t: number) {
    raf = requestAnimationFrame(tick);
    if (t - lastFrame < 1000 / s.fps) return;
    lastFrame = t;
    convertNow();
  }
  function startLoop() {
    if (raf) return;
    lastFrame = 0;
    raf = requestAnimationFrame(tick);
  }
  function stopLoop() {
    cancelAnimationFrame(raf);
    raf = 0;
  }

  const onVideoReady = () => {
    if (!video) return;
    const id = loadId;
    source = { el: video, width: video.videoWidth, height: video.videoHeight, type: "video" };
    refresh();
    if (id !== loadId || !grid) return;
    s.onReady?.({
      type: "video",
      sourceWidth: video.videoWidth,
      sourceHeight: video.videoHeight,
      columns: grid.width,
      rows: grid.height,
    });
    applyPlayback();
  };
  const onVideoPlay = () => startLoop();
  const onVideoPause = () => {
    stopLoop();
    convertNow();
  };
  const onVideoEnded = () => {
    wantPlay = false;
    onVideoPause();
  };
  const onVideoSeeked = () => {
    if (video?.paused) convertNow();
  };
  const onVideoError = () => fail(new Error(`Failed to load video: ${s.src}`));

  function ensureVideo(): HTMLVideoElement {
    if (video) return video;
    const v = document.createElement("video");
    v.className = classes.video;
    v.setAttribute("aria-hidden", "true");
    v.playsInline = true;
    v.preload = "auto";
    v.addEventListener("loadeddata", onVideoReady);
    v.addEventListener("play", onVideoPlay);
    v.addEventListener("pause", onVideoPause);
    v.addEventListener("ended", onVideoEnded);
    v.addEventListener("seeked", onVideoSeeked);
    v.addEventListener("error", onVideoError);
    // Kept inside the visible root: browsers may pause muted videos that are not in the page
    root.append(v);
    video = v;
    return v;
  }

  function releaseMedia() {
    stopLoop();
    if (image) {
      image.onload = null;
      image.onerror = null;
      image = null;
    }
    if (video && video.getAttribute("src")) {
      video.pause();
      video.removeAttribute("src");
      video.load();
    }
  }

  /* ---------------- loading ---------------- */

  function load() {
    const id = ++loadId;
    releaseMedia();
    source = null;
    grid = null;
    renderedKey = "";
    text.textContent = "";
    canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    if (!s.src) return;
    const type = resolveMediaType(s.src, s.type);
    const cross = s.crossOrigin === "none" ? null : s.crossOrigin;

    if (type === "video") {
      const v = ensureVideo();
      if (cross) v.crossOrigin = cross;
      else v.removeAttribute("crossorigin");
      v.muted = s.muted;
      v.loop = s.loop;
      wantPlay = shouldAutoplay();
      v.src = s.src;
      return;
    }

    const img = new Image();
    if (cross) img.crossOrigin = cross;
    img.decoding = "async";
    img.onload = () => {
      if (id !== loadId) return;
      source = { el: img, width: img.naturalWidth, height: img.naturalHeight, type: "image" };
      refresh();
      if (!grid) return;
      s.onReady?.({
        type: "image",
        sourceWidth: img.naturalWidth,
        sourceHeight: img.naturalHeight,
        columns: grid.width,
        rows: grid.height,
      });
    };
    img.onerror = () => {
      if (id === loadId) fail(new Error(`Failed to load image: ${s.src}`));
    };
    image = img;
    img.src = s.src;
  }

  /* ---------------- observers ---------------- */

  const resizeObserver =
    typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(() => {
          cancelAnimationFrame(resizeRaf);
          resizeRaf = requestAnimationFrame(() => {
            if (!grid) return;
            layout();
            paint();
          });
        });
  resizeObserver?.observe(layer);

  const intersectionObserver =
    typeof IntersectionObserver === "undefined"
      ? null
      : new IntersectionObserver((entries) => {
          inView = entries[entries.length - 1]?.isIntersecting ?? true;
          applyPlayback();
        });
  intersectionObserver?.observe(root);

  const onVisibility = () => applyPlayback();
  document.addEventListener("visibilitychange", onVisibility);

  const onMotionChange = () => {
    if (!s.respectReducedMotion || !reducedMotion?.matches) return;
    wantPlay = false;
    applyPlayback();
  };
  reducedMotion?.addEventListener?.("change", onMotionChange);

  // Web fonts change glyph metrics once they arrive
  document.fonts?.ready.then(() => {
    if (!destroyed && source) refresh();
  });

  showOutput();
  load();

  return {
    update(next) {
      const prev = s;
      s = next;
      if (
        prev.src !== next.src ||
        prev.type !== next.type ||
        prev.crossOrigin !== next.crossOrigin
      ) {
        showOutput();
        load();
        return;
      }
      if (video) {
        video.muted = next.muted;
        video.loop = next.loop;
      }
      if (
        prev.autoplay !== next.autoplay ||
        prev.respectReducedMotion !== next.respectReducedMotion
      ) {
        wantPlay = shouldAutoplay();
        applyPlayback();
      }
      if (!source) {
        showOutput();
        return;
      }
      const m = measure();
      if (conversionKey(next) + metricsKey(m) !== renderedKey) refresh();
    },
    play() {
      wantPlay = true;
      applyPlayback();
    },
    pause() {
      wantPlay = false;
      applyPlayback();
    },
    render: () => refresh(),
    toText: () => gridToText(grid),
    destroy() {
      destroyed = true;
      loadId++;
      releaseMedia();
      cancelAnimationFrame(resizeRaf);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      reducedMotion?.removeEventListener?.("change", onMotionChange);
      if (video) {
        video.removeEventListener("loadeddata", onVideoReady);
        video.removeEventListener("play", onVideoPlay);
        video.removeEventListener("pause", onVideoPause);
        video.removeEventListener("ended", onVideoEnded);
        video.removeEventListener("seeked", onVideoSeeked);
        video.removeEventListener("error", onVideoError);
        video.remove();
        video = null;
      }
      text.textContent = "";
      root.style.removeProperty(VAR_ASPECT);
    },
  };
}
