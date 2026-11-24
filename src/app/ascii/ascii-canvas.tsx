"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import type { Grid } from "@/lib/ascii/grid";
import { measureCell, paintGrid, type CellSize } from "@/lib/ascii/render";

export const CANVAS_FONT = "'JetBrains Mono', ui-monospace, monospace";

type Props = {
  grid: Grid;
  fontSize: number;
  foreground: string;
  background: string;
  /** Draw a caret at this cell (text tool) */
  caret?: { x: number; y: number } | null;
  /** Show cell grid lines (drawing mode) */
  showGrid?: boolean;
  /** Faded grid painted underneath (onion skin of the previous animation frame) */
  onion?: Grid | null;
  onCellDown?: (x: number, y: number, e: PointerEvent<HTMLCanvasElement>) => void;
  onCellMove?: (x: number, y: number, e: PointerEvent<HTMLCanvasElement>) => void;
  onCellUp?: (x: number, y: number) => void;
  label: string;
};

/** Paints a grid on a HiDPI canvas and reports pointer positions in cell coordinates */
export function AsciiCanvas({
  grid,
  fontSize,
  foreground,
  background,
  caret,
  showGrid,
  onion,
  onCellDown,
  onCellMove,
  onCellUp,
  label,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const cell = useRef<CellSize>({ width: fontSize * 0.6, height: fontSize * 1.2 });
  const [fontReady, setFontReady] = useState(false);

  // Canvas text needs the web font loaded first, otherwise the first paint uses a fallback width
  useEffect(() => {
    let alive = true;
    document.fonts
      .load(`${fontSize}px 'JetBrains Mono'`)
      .finally(() => alive && setFontReady(true));
    return () => {
      alive = false;
    };
  }, [fontSize]);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const size = measureCell(ctx, fontSize, CANVAS_FONT);
    cell.current = size;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.ceil(grid.width * size.width);
    const h = Math.ceil(grid.height * size.height);
    canvas.width = Math.ceil(w * dpr);
    canvas.height = Math.ceil(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, w, h);
    if (onion) {
      paintGrid(ctx, onion, { cell: size, fontSize, font: CANVAS_FONT, foreground });
      // Wash the onion skin out with the background so it reads as a hint
      ctx.globalAlpha = 0.78;
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;
    }
    paintGrid(ctx, grid, { cell: size, fontSize, font: CANVAS_FONT, foreground });
    if (showGrid) {
      ctx.strokeStyle = "rgb(255 255 255 / 0.06)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 1; x < grid.width; x++) {
        ctx.moveTo(Math.round(x * size.width) + 0.5, 0);
        ctx.lineTo(Math.round(x * size.width) + 0.5, h);
      }
      for (let y = 1; y < grid.height; y++) {
        ctx.moveTo(0, y * size.height + 0.5);
        ctx.lineTo(w, y * size.height + 0.5);
      }
      ctx.stroke();
    }
    if (caret) {
      ctx.fillStyle = "rgb(56 189 248 / 0.8)";
      ctx.fillRect(caret.x * size.width, caret.y * size.height + size.height - 2, size.width, 2);
    }
  }, [grid, fontSize, foreground, background, caret, showGrid, onion, fontReady]);

  const toCell = (e: PointerEvent<HTMLCanvasElement>): [number, number] => {
    const rect = e.currentTarget.getBoundingClientRect();
    return [
      Math.max(
        0,
        Math.min(grid.width - 1, Math.floor((e.clientX - rect.left) / cell.current.width)),
      ),
      Math.max(
        0,
        Math.min(grid.height - 1, Math.floor((e.clientY - rect.top) / cell.current.height)),
      ),
    ];
  };

  const interactive = !!onCellDown;

  return (
    <canvas
      ref={ref}
      role="img"
      aria-label={label}
      className={interactive ? "block touch-none cursor-crosshair" : "block"}
      onPointerDown={
        interactive
          ? (e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              onCellDown?.(...toCell(e), e);
            }
          : undefined
      }
      onPointerMove={interactive ? (e) => e.buttons && onCellMove?.(...toCell(e), e) : undefined}
      onPointerUp={interactive ? (e) => onCellUp?.(...toCell(e)) : undefined}
    />
  );
}
