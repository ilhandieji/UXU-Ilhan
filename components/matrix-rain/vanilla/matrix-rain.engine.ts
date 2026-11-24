// Canvas 2D rain engine — framework free; identical in the React and Vanilla folders.
// Look values come from the `--ux-matrix-rain-*` CSS variables inherited by the canvas.
import type { MatrixRainSettings } from "./matrix-rain.config";

export interface MatrixRainEngine {
  update(settings: MatrixRainSettings): void;
  pause(): void;
  resume(): void;
  /** Speed spike that eases out over ~1s */
  burst(): void;
  /** Wipes the canvas and restarts every column from the edge */
  clear(): void;
  destroy(): void;
}

interface Column {
  /** Head position in cells along the fall direction */
  p: number;
  /** Last cell the head entered */
  cell: number;
  speedFactor: number;
  lengthFactor: number;
  active: boolean;
  glyphs: string[];
}

interface Look {
  fontSize: number;
  font: string;
  head: string;
  color: string;
  glow: number;
}

/** Cells per second at speed 1 */
const BASE_CELLS_PER_SECOND = 14;
const MIN_TRAIL = 5;
const MAX_TRAIL = 40;
/** Chance per second that a trail glyph flickers to a new one */
const MUTATE_RATE = 5;
const BURST_MS = 1000;
const BURST_BOOST = 3;
/** Pointer influence radius in columns (interactive) */
const POINTER_RADIUS = 5;
const MAX_FRAME_SECONDS = 0.1;

export function createMatrixRainEngine(
  canvas: HTMLCanvasElement,
  initial: MatrixRainSettings,
): MatrixRainEngine {
  const ctx = canvas.getContext("2d");
  let settings = initial;
  let look = readLook();
  let width = 0;
  let height = 0;
  let dpr = 1;
  let rows = 0;
  let columns: Column[] = [];
  let glyphKey = settings.glyphs.join("");
  let raf = 0;
  let last = 0;
  let manualPaused = false;
  let hidden = document.hidden;
  let onScreen = true;
  let burstStart = -Infinity;
  let pointerX: number | null = null;
  let destroyed = false;
  const motionQuery =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : null;

  const reduced = () => settings.respectReducedMotion && (motionQuery?.matches ?? false);
  const glyph = () => settings.glyphs[Math.floor(Math.random() * settings.glyphs.length)];
  const trailLength = (col: Column) =>
    Math.max(
      3,
      Math.round((MIN_TRAIL + (1 - settings.fade) * (MAX_TRAIL - MIN_TRAIL)) * col.lengthFactor),
    );

  /** Validates a CSS color through the context; invalid values keep the fallback */
  function toColor(value: string, fallback: string): string {
    if (!ctx || !value) return fallback;
    ctx.fillStyle = fallback;
    ctx.fillStyle = value;
    return String(ctx.fillStyle);
  }

  function toPx(value: string, fallback: number): number {
    const n = Number.parseFloat(value);
    if (!Number.isFinite(n)) return fallback;
    return /r?em$/.test(value) ? n * 16 : n;
  }

  function readLook(): Look {
    const style = getComputedStyle(canvas);
    const token = (name: string) => style.getPropertyValue(`--ux-matrix-rain-${name}`).trim();
    const fontSize = Math.min(96, Math.max(6, toPx(token("font-size"), 16)));
    const family = token("font-family") || "monospace";
    return {
      fontSize,
      font: `${fontSize}px ${family}`,
      head: toColor(token("head"), "#ffffff"),
      color: toColor(token("color"), "#22c55e"),
      glow: Math.min(100, Math.max(0, toPx(token("glow"), 0))),
    };
  }

  function spawn(col: Column, scatter: boolean) {
    col.active = Math.random() < settings.density;
    col.speedFactor = Math.max(0.25, 1 + (Math.random() * 2 - 1) * settings.randomSpeed * 0.65);
    col.lengthFactor = 0.7 + Math.random() * 0.6;
    const length = trailLength(col);
    // Scatter fills the screen at once (start / static frame); otherwise enter from the edge
    col.p = scatter
      ? reduced()
        ? Math.random() * (rows + length)
        : Math.random() * (rows + length) - rows * 0.5
      : -Math.random() * rows * 0.6;
    col.cell = Math.floor(col.p);
    if (scatter) for (let i = 0; i < rows; i++) col.glyphs[i] = glyph();
  }

  function newColumn(): Column {
    const col: Column = {
      p: 0,
      cell: 0,
      speedFactor: 1,
      lengthFactor: 1,
      active: false,
      glyphs: new Array<string>(rows),
    };
    spawn(col, true);
    return col;
  }

  /** Keeps existing columns when only the size changed; rebuilds all when `reset` */
  function layout(reset: boolean) {
    const nextRows = Math.ceil(height / look.fontSize) + 1;
    const count = Math.max(0, Math.ceil(width / look.fontSize));
    if (reset || nextRows !== rows) {
      rows = nextRows;
      columns = [];
    }
    if (columns.length > count) columns.length = count;
    while (columns.length < count) columns.push(newColumn());
  }

  function resize() {
    if (!ctx) return;
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    dpr = Math.min(window.devicePixelRatio || 1, settings.maxDevicePixelRatio);
    const w = Math.max(1, Math.round(width * dpr));
    const h = Math.max(1, Math.round(height * dpr));
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
    layout(false);
    draw();
    sync();
  }

  const proximity = (index: number) => {
    if (!settings.interactive || pointerX === null) return 0;
    const center = (index + 0.5) * look.fontSize;
    return Math.max(0, 1 - Math.abs(pointerX - center) / (look.fontSize * POINTER_RADIUS));
  };

  function boost(now: number) {
    const t = (now - burstStart) / BURST_MS;
    if (t >= 1 || t < 0) return 1;
    return 1 + BURST_BOOST * (1 - t) * (1 - t);
  }

  function step(dt: number, now: number) {
    const base = BASE_CELLS_PER_SECOND * settings.speed * boost(now);
    columns.forEach((col, index) => {
      const near = proximity(index);
      if (near > 0.5) col.active = true;
      col.p += base * col.speedFactor * (1 + near * 1.5) * dt;
      const cell = Math.floor(col.p);
      while (col.cell < cell) {
        col.cell++;
        if (col.cell >= 0 && col.cell < rows) col.glyphs[col.cell] = glyph();
      }
      const length = trailLength(col);
      if (col.p - length > rows) {
        spawn(col, false);
        return;
      }
      if (col.active && Math.random() < MUTATE_RATE * dt) {
        const target = cell - 1 - Math.floor(Math.random() * length);
        if (target >= 0 && target < rows) col.glyphs[target] = glyph();
      }
    });
  }

  const rowY = (cell: number) =>
    (settings.direction === "down" ? cell : rows - 1 - cell) * look.fontSize;

  function draw() {
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    if (!columns.length) return;
    ctx.font = look.font;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const size = look.fontSize;

    // Pass 1: trails (no shadow, cheap)
    ctx.shadowBlur = 0;
    ctx.fillStyle = look.color;
    columns.forEach((col, index) => {
      if (!col.active) return;
      const near = proximity(index);
      const length = trailLength(col);
      const x = (index + 0.5) * size;
      for (let k = length - 1; k >= 1; k--) {
        const cell = col.cell - k;
        if (cell < 0 || cell >= rows) continue;
        const char = col.glyphs[cell];
        if (!char) continue;
        ctx.globalAlpha = Math.min(1, (1 - k / length) ** 1.6 * (0.8 + 0.4 * near));
        ctx.fillText(char, x, rowY(cell));
      }
    });

    // Pass 2: heads with glow
    ctx.fillStyle = look.head;
    ctx.shadowColor = look.head;
    columns.forEach((col, index) => {
      if (!col.active || col.cell < 0 || col.cell >= rows) return;
      const char = col.glyphs[col.cell];
      if (!char) return;
      const near = proximity(index);
      ctx.globalAlpha = Math.min(1, 0.85 + near);
      ctx.shadowBlur = look.glow * (1 + near);
      ctx.fillText(char, (index + 0.5) * size, rowY(col.cell));
    });
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(MAX_FRAME_SECONDS, Math.max(0, (now - last) / 1000));
    last = now;
    step(dt, now);
    draw();
  }

  const canAnimate = () =>
    !destroyed &&
    !!ctx &&
    !settings.paused &&
    !manualPaused &&
    !hidden &&
    onScreen &&
    !reduced() &&
    width > 0 &&
    height > 0;

  function sync() {
    const should = canAnimate();
    if (should && !raf) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    } else if (!should && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }

  const resizeObserver = new ResizeObserver(() => resize());
  resizeObserver.observe(canvas);
  const intersectionObserver =
    typeof IntersectionObserver === "function"
      ? new IntersectionObserver((entries) => {
          onScreen = entries[entries.length - 1]?.isIntersecting ?? true;
          sync();
        })
      : null;
  intersectionObserver?.observe(canvas);

  const onVisibility = () => {
    hidden = document.hidden;
    sync();
  };
  const onMotion = () => {
    if (reduced()) {
      columns.forEach((col) => spawn(col, true));
      draw();
    }
    sync();
  };
  const onPointerMove = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    const inside =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;
    pointerX = inside ? event.clientX - rect.left : null;
  };
  const onPointerOut = (event: PointerEvent) => {
    if (!event.relatedTarget) pointerX = null;
  };

  let listening = false;
  function listenPointer() {
    if (settings.interactive === listening) return;
    listening = settings.interactive;
    if (listening) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      document.addEventListener("pointerout", onPointerOut);
    } else {
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerout", onPointerOut);
      pointerX = null;
    }
  }

  document.addEventListener("visibilitychange", onVisibility);
  motionQuery?.addEventListener("change", onMotion);
  listenPointer();
  resize();

  return {
    update(next) {
      if (destroyed) return;
      const prev = settings;
      settings = next;
      const nextLook = readLook();
      const fontChanged = nextLook.fontSize !== look.fontSize;
      look = nextLook;
      const nextKey = settings.glyphs.join("");
      const glyphsChanged = nextKey !== glyphKey;
      glyphKey = nextKey;
      if (fontChanged) layout(true);
      else if (glyphsChanged) columns.forEach((col) => spawn(col, true));
      if (prev.maxDevicePixelRatio !== settings.maxDevicePixelRatio) resize();
      if (prev.respectReducedMotion !== settings.respectReducedMotion && reduced())
        columns.forEach((col) => spawn(col, true));
      listenPointer();
      if (!raf) draw();
      sync();
    },
    pause() {
      manualPaused = true;
      sync();
    },
    resume() {
      manualPaused = false;
      sync();
    },
    burst() {
      burstStart = performance.now();
      columns.forEach((col) => {
        if (Math.random() < settings.density) col.active = true;
      });
    },
    clear() {
      columns.forEach((col) => {
        spawn(col, false);
        col.glyphs = new Array<string>(rows);
      });
      draw();
    },
    destroy() {
      destroyed = true;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      resizeObserver.disconnect();
      intersectionObserver?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      motionQuery?.removeEventListener("change", onMotion);
      settings = { ...settings, interactive: false };
      listenPointer();
      ctx?.setTransform(1, 0, 0, 1, 0, 0);
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      columns = [];
    },
  };
}
