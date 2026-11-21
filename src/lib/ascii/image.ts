// Image → ASCII grid: character ramps, blocks, braille ("bit" mode), binary and colored half-blocks,
// with brightness/contrast/gamma, dithering and color quantization.
import { BLANK, type Cell, type Grid } from "./grid";
import { ANSI16, ANSI256, nearestIndex, rgbToHex, type Rgb } from "./palettes";

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

function sample(source: CanvasImageSource, width: number, height: number): Pixels {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas 2D is not available");
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

function quantizeColor(rgb: Rgb, mode: ColorMode): string | undefined {
  if (mode === "mono") return undefined;
  if (mode === "ansi16") return rgbToHex(ANSI16[nearestIndex(rgb, ANSI16)]);
  if (mode === "ansi256") return rgbToHex(ANSI256[nearestIndex(rgb, ANSI256)]);
  return rgbToHex(rgb);
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
