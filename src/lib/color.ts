// Color helpers for the playground (client-side; they use the browser's CSS color parser).

let probe: CanvasRenderingContext2D | null | undefined;

function context(): CanvasRenderingContext2D | null {
  if (probe !== undefined) return probe;
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  probe = canvas.getContext("2d", { willReadFrequently: true });
  return probe;
}

/** True for any value the browser accepts as a CSS color (hex, rgb(), hsl(), names, …) */
export function isCssColor(value: string): boolean {
  if (!value.trim()) return false;
  if (typeof CSS !== "undefined" && CSS.supports) return CSS.supports("color", value);
  return /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value);
}

const hex2 = (n: number) => Math.round(n).toString(16).padStart(2, "0");

/** Any CSS color → `#rrggbb` or `#rrggbbaa` (alpha only when not opaque); invalid → fallback */
export function toHex(value: string, fallback = "#000000"): string {
  if (/^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(value)) return value.toLowerCase();
  const ctx = context();
  if (!ctx || !isCssColor(value)) return fallback;
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = "#000000";
  ctx.fillStyle = value;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
  return `#${hex2(r)}${hex2(g)}${hex2(b)}${a < 255 ? hex2(a) : ""}`;
}

/** `#rrggbb[aa]` → [r, g, b, a(0–1)] */
export function hexToRgba(hex: string): [number, number, number, number] {
  const h = toHex(hex).slice(1);
  const n = (i: number) => parseInt(h.slice(i, i + 2), 16);
  return [n(0), n(2), n(4), h.length === 8 ? n(6) / 255 : 1];
}

export function rgbaToHex(r: number, g: number, b: number, a = 1): string {
  return `#${hex2(r)}${hex2(g)}${hex2(b)}${a < 1 ? hex2(a * 255) : ""}`;
}
