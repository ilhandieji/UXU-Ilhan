// Character grid model shared by the ASCII editor (text, image and drawing all produce a Grid).
// Every operation returns a new Grid so undo/redo can keep snapshots cheaply.

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
export const MAX_GRID = 400;

const clampSize = (n: number) => Math.max(1, Math.min(MAX_GRID, Math.round(n)));

export function createGrid(width: number, height: number): Grid {
  const w = clampSize(width);
  const h = clampSize(height);
  return { width: w, height: h, cells: Array.from({ length: w * h }, () => BLANK) };
}

export const inBounds = (g: Grid, x: number, y: number) =>
  x >= 0 && y >= 0 && x < g.width && y < g.height;

export function cellAt(g: Grid, x: number, y: number): Cell {
  return inBounds(g, x, y) ? g.cells[y * g.width + x] : BLANK;
}

const sameCell = (a: Cell, b: Cell) => a.ch === b.ch && a.fg === b.fg && a.bg === b.bg;

/** Plain text lines → grid (width = longest line) */
export function fromLines(lines: string[], fg?: string): Grid {
  const rows = lines.length ? lines : [""];
  const chars = rows.map((line) => Array.from(line));
  const g = createGrid(Math.max(1, ...chars.map((c) => c.length)), rows.length);
  const cells = g.cells.slice();
  chars.forEach((row, y) =>
    row.forEach((ch, x) => {
      if (ch !== " ") cells[y * g.width + x] = fg ? { ch, fg } : { ch };
    }),
  );
  return { ...g, cells };
}

/** Grid → text lines (trailing spaces trimmed, trailing empty lines removed) */
export function toLines(g: Grid): string[] {
  const lines: string[] = [];
  for (let y = 0; y < g.height; y++) {
    let line = "";
    for (let x = 0; x < g.width; x++) line += g.cells[y * g.width + x].ch || " ";
    lines.push(line.replace(/\s+$/u, ""));
  }
  while (lines.length > 1 && !lines[lines.length - 1]) lines.pop();
  return lines;
}

export function resizeGrid(g: Grid, width: number, height: number): Grid {
  const next = createGrid(width, height);
  const cells = next.cells.slice();
  for (let y = 0; y < Math.min(g.height, next.height); y++)
    for (let x = 0; x < Math.min(g.width, next.width); x++)
      cells[y * next.width + x] = g.cells[y * g.width + x];
  return { ...next, cells };
}

export function setCells(g: Grid, points: [number, number][], cell: Cell): Grid {
  let cells: Cell[] | null = null;
  for (const [x, y] of points) {
    if (!inBounds(g, x, y)) continue;
    const i = y * g.width + x;
    if (sameCell(g.cells[i], cell)) continue;
    cells ??= g.cells.slice();
    cells[i] = cell;
  }
  return cells ? { ...g, cells } : g;
}

/** Bresenham line */
export function linePoints(x0: number, y0: number, x1: number, y1: number): [number, number][] {
  const points: [number, number][] = [];
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let [x, y] = [x0, y0];
  for (;;) {
    points.push([x, y]);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
  return points;
}

export function rectPoints(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  filled: boolean,
): [number, number][] {
  const [left, right] = [Math.min(x0, x1), Math.max(x0, x1)];
  const [top, bottom] = [Math.min(y0, y1), Math.max(y0, y1)];
  const points: [number, number][] = [];
  for (let y = top; y <= bottom; y++)
    for (let x = left; x <= right; x++)
      if (filled || y === top || y === bottom || x === left || x === right) points.push([x, y]);
  return points;
}

/** 4-way flood fill of the region that matches the clicked cell */
export function floodFill(g: Grid, x: number, y: number, cell: Cell): Grid {
  if (!inBounds(g, x, y)) return g;
  const target = cellAt(g, x, y);
  if (sameCell(target, cell)) return g;
  const cells = g.cells.slice();
  const stack: [number, number][] = [[x, y]];
  while (stack.length) {
    const [cx, cy] = stack.pop() as [number, number];
    if (!inBounds(g, cx, cy)) continue;
    const i = cy * g.width + cx;
    if (!sameCell(cells[i], target)) continue;
    cells[i] = cell;
    stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
  }
  return { ...g, cells };
}

/** Writes text starting at (x, y), keeping the given colors */
export function writeText(
  g: Grid,
  x: number,
  y: number,
  text: string,
  style: Omit<Cell, "ch">,
): Grid {
  let next = g;
  Array.from(text).forEach((ch, i) => {
    next = setCells(next, [[x + i, y]], ch === " " && !style.bg ? BLANK : { ch, ...style });
  });
  return next;
}

/** Pastes `src` into `dst` at (x, y); spaces without background stay transparent */
export function stamp(dst: Grid, src: Grid, x: number, y: number): Grid {
  const cells = dst.cells.slice();
  for (let sy = 0; sy < src.height; sy++)
    for (let sx = 0; sx < src.width; sx++) {
      const c = src.cells[sy * src.width + sx];
      if (c.ch === " " && !c.bg) continue;
      const tx = x + sx;
      const ty = y + sy;
      if (inBounds(dst, tx, ty)) cells[ty * dst.width + tx] = c;
    }
  return { ...dst, cells };
}

// ---------- Undo / redo ----------

export interface History {
  past: Grid[];
  present: Grid;
  future: Grid[];
}

const HISTORY_LIMIT = 100;

export const historyOf = (present: Grid): History => ({ past: [], present, future: [] });

export function commit(h: History, next: Grid): History {
  if (next === h.present) return h;
  return { past: [...h.past, h.present].slice(-HISTORY_LIMIT), present: next, future: [] };
}

export function undo(h: History): History {
  const prev = h.past[h.past.length - 1];
  return prev ? { past: h.past.slice(0, -1), present: prev, future: [h.present, ...h.future] } : h;
}

export function redo(h: History): History {
  const [next, ...rest] = h.future;
  return next ? { past: [...h.past, h.present], present: next, future: rest } : h;
}
