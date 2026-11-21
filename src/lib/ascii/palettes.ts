// Terminal color palettes and nearest-color lookup.

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
