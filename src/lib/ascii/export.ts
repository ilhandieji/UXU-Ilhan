// Grid exporters: plain text, ANSI escapes, HTML, PNG, GIF, emoji and JSON lines (Terminal `banner`).
import { toLines, type Grid } from "./grid";
import { ANSI16, ANSI256, hexToRgb, nearestIndex } from "./palettes";
import { encodeGif } from "@/lib/gif";
import { paintGrid, measureCell } from "./render";

export type AnsiDepth = "truecolor" | "256" | "16";

export const toText = (g: Grid) => toLines(g).join("\n");

export const toJson = (g: Grid) => JSON.stringify(toLines(g), null, 2);

function sgr(hex: string | undefined, background: boolean, depth: AnsiDepth): string {
  if (!hex) return background ? "49" : "39";
  const rgb = hexToRgb(hex);
  if (depth === "truecolor") return `${background ? 48 : 38};2;${rgb.join(";")}`;
  if (depth === "256") return `${background ? 48 : 38};5;${nearestIndex(rgb, ANSI256)}`;
  const i = nearestIndex(rgb, ANSI16);
  const base = i < 8 ? (background ? 40 : 30) + i : (background ? 100 : 90) + i - 8;
  return String(base);
}

/**
 * ANSI art. `escaped` writes `\e[…m` as text (for `printf '%b'` / `echo -e`);
 * otherwise real ESC characters (for .ans files and `cat`).
 */
export function toAnsi(
  g: Grid,
  { depth = "truecolor", escaped = false }: { depth?: AnsiDepth; escaped?: boolean } = {},
): string {
  const esc = escaped ? "\\e[" : "\u001b[";
  const lines: string[] = [];
  for (let y = 0; y < g.height; y++) {
    let line = "";
    let last = "";
    let lastNonBlank = -1;
    for (let x = 0; x < g.width; x++) {
      const c = g.cells[y * g.width + x];
      if (c.ch !== " " || c.bg) lastNonBlank = x;
    }
    for (let x = 0; x <= lastNonBlank; x++) {
      const c = g.cells[y * g.width + x];
      const style = `${sgr(c.fg, false, depth)};${sgr(c.bg, true, depth)}`;
      if (style !== last) {
        line += `${esc}${style}m`;
        last = style;
      }
      line += c.ch;
    }
    if (last) line += `${esc}0m`;
    lines.push(line);
  }
  while (lines.length > 1 && !lines[lines.length - 1]) lines.pop();
  return lines.join("\n");
}

/** Shell one-liner that prints the art (copy & paste into a terminal) */
export const toShell = (g: Grid, depth: AnsiDepth = "truecolor") =>
  `printf '%b\\n' '${toAnsi(g, { depth, escaped: true }).replace(/'/g, "'\\''").replace(/\n/g, "\\n")}'`;

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Self-contained `<pre>` with inline styles for each color run */
export function toHtml(g: Grid, { background = "#000000", foreground = "#e6e6e6" } = {}): string {
  const rows: string[] = [];
  for (let y = 0; y < g.height; y++) {
    let row = "";
    let run = "";
    let runKey = "";
    const flush = () => {
      if (!run) return;
      const [fg, bg] = runKey.split("|");
      const style = `${fg ? `color:${fg};` : ""}${bg ? `background:${bg};` : ""}`;
      row += style ? `<span style="${style}">${escapeHtml(run)}</span>` : escapeHtml(run);
      run = "";
    };
    for (let x = 0; x < g.width; x++) {
      const c = g.cells[y * g.width + x];
      const key = `${c.fg ?? ""}|${c.bg ?? ""}`;
      if (key !== runKey) {
        flush();
        runKey = key;
      }
      run += c.ch;
    }
    flush();
    rows.push(row.replace(/\s+$/u, ""));
  }
  return `<pre style="background:${background};color:${foreground};font-family:'JetBrains Mono',ui-monospace,monospace;line-height:1.15;padding:16px;display:inline-block">${rows.join("\n")}</pre>`;
}

export async function toPng(
  g: Grid,
  {
    fontSize = 16,
    background = "#000000",
    foreground = "#e6e6e6",
    font = "'JetBrains Mono', monospace",
  } = {},
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D is not available");
  const cell = measureCell(ctx, fontSize, font);
  const pad = Math.round(fontSize);
  canvas.width = Math.ceil(g.width * cell.width + pad * 2);
  canvas.height = Math.ceil(g.height * cell.height + pad * 2);
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.translate(pad, pad);
  paintGrid(ctx, g, { cell, fontSize, font, foreground });
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("PNG export failed"))),
      "image/png",
    ),
  );
}

/** Square emoji and their approximate colors, for "emoji art" in chats */
const EMOJI: [string, [number, number, number]][] = [
  ["⬛", [24, 24, 24]],
  ["⬜", [240, 240, 240]],
  ["🟥", [221, 46, 68]],
  ["🟧", [244, 144, 12]],
  ["🟨", [253, 203, 88]],
  ["🟩", [120, 177, 89]],
  ["🟦", [85, 172, 238]],
  ["🟪", [170, 142, 214]],
  ["🟫", [193, 105, 79]],
];

/** One emoji per cell: background color wins, then the glyph color; empty cells are ⬛ */
export function toEmoji(g: Grid, foreground = "#e6e6e6"): string {
  const palette = EMOJI.map(([, rgb]) => rgb);
  const lines: string[] = [];
  for (let y = 0; y < g.height; y++) {
    let line = "";
    for (let x = 0; x < g.width; x++) {
      const c = g.cells[y * g.width + x];
      const color = c.bg ?? (c.ch === " " ? undefined : (c.fg ?? foreground));
      line += color ? EMOJI[nearestIndex(hexToRgb(color), palette)][0] : EMOJI[0][0];
    }
    lines.push(line);
  }
  return lines.join("\n");
}

/** Animated GIF of several grids (frames are padded to the largest one) */
export function toGif(
  frames: Grid[],
  {
    fps = 8,
    fontSize = 14,
    background = "#000000",
    foreground = "#e6e6e6",
    font = "'JetBrains Mono', monospace",
  } = {},
): Blob {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas 2D is not available");
  const cell = measureCell(ctx, fontSize, font);
  const pad = Math.round(fontSize / 2);
  const cols = Math.max(...frames.map((f) => f.width));
  const rows = Math.max(...frames.map((f) => f.height));
  canvas.width = Math.ceil(cols * cell.width + pad * 2);
  canvas.height = Math.ceil(rows * cell.height + pad * 2);
  const images = frames.map((frame) => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.translate(pad, pad);
    paintGrid(ctx, frame, { cell, fontSize, font, foreground });
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return { data, width: canvas.width, height: canvas.height };
  });
  return encodeGif(images, Math.round(1000 / fps));
}

export function download(name: string, data: Blob | string, type = "text/plain;charset=utf-8") {
  const blob = typeof data === "string" ? new Blob([data], { type }) : data;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
