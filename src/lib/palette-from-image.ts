// Palette from an image: k-means on a downscaled copy, then the clusters are assigned by role
// (darkest = background, lightest = text, most saturated = accent, the rest = muted).
import { rgbToHex, type Rgb } from "@/lib/ascii/palettes";
import type { SitePalette } from "@/registry/types";

const SAMPLE = 64;
const K = 6;
const ITERATIONS = 10;

const lum = ([r, g, b]: Rgb) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
const saturation = ([r, g, b]: Rgb) => {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
};
const dist = (a: Rgb, b: Rgb) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;

function pixels(source: CanvasImageSource): Rgb[] {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = SAMPLE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];
  ctx.drawImage(source, 0, 0, SAMPLE, SAMPLE);
  const data = ctx.getImageData(0, 0, SAMPLE, SAMPLE).data;
  const out: Rgb[] = [];
  for (let i = 0; i < data.length; i += 4)
    if (data[i + 3] > 128) out.push([data[i], data[i + 1], data[i + 2]]);
  return out;
}

function kmeans(points: Rgb[]): Rgb[] {
  // Deterministic start: centroids spread over the luminance-sorted points
  const sorted = [...points].sort((a, b) => lum(a) - lum(b));
  let centroids = Array.from(
    { length: K },
    (_, i) => sorted[Math.floor(((i + 0.5) / K) * sorted.length)],
  );
  for (let it = 0; it < ITERATIONS; it++) {
    const sums = centroids.map(() => [0, 0, 0, 0]);
    for (const p of points) {
      let best = 0;
      for (let c = 1; c < K; c++) if (dist(p, centroids[c]) < dist(p, centroids[best])) best = c;
      sums[best][0] += p[0];
      sums[best][1] += p[1];
      sums[best][2] += p[2];
      sums[best][3]++;
    }
    centroids = sums.map((s, i) => (s[3] ? [s[0] / s[3], s[1] / s[3], s[2] / s[3]] : centroids[i]));
  }
  return centroids;
}

export function paletteFromImage(
  source: CanvasImageSource,
  name = "From image",
): SitePalette | null {
  const points = pixels(source);
  if (points.length < K) return null;
  const clusters = kmeans(points).sort((a, b) => lum(a) - lum(b));
  const bg = clusters[0];
  const fg = clusters[clusters.length - 1];
  const middle = clusters.slice(1, -1);
  const accent = [...middle].sort(
    (a, b) => saturation(b) * (0.5 + lum(b)) - saturation(a) * (0.5 + lum(a)),
  )[0];
  const muted = middle.find((c) => c !== accent) ?? accent;
  return {
    name,
    bg: rgbToHex(bg),
    fg: rgbToHex(fg),
    accent: rgbToHex(accent),
    muted: rgbToHex(muted),
  };
}

/** Loads a user-chosen image file and extracts its palette */
export function paletteFromFile(file: File): Promise<SitePalette | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve(paletteFromImage(img, file.name));
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve(null);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}
