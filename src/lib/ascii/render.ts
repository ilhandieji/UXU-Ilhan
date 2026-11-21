// Canvas painter for grids. Block characters are drawn as rectangles so they tile without gaps
// (fonts leave seams between █ and ▀ rows); everything else is drawn as text.
import type { Grid } from "./grid";

export interface CellSize {
  width: number;
  height: number;
}

export const LINE_HEIGHT = 1.2;

export function measureCell(
  ctx: CanvasRenderingContext2D,
  fontSize: number,
  font: string,
): CellSize {
  ctx.font = `${fontSize}px ${font}`;
  return { width: ctx.measureText("M").width, height: Math.round(fontSize * LINE_HEIGHT) };
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
