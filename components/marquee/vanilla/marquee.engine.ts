// Framework-free animation engine of Marquee (identical in the React and Vanilla versions).
// It animates DOM that the host renders, using this contract inside `root`:
//   [data-marquee-rows] > [data-marquee-row] (viewport) > [data-marquee-track] > [data-marquee-group]*
// Each frame writes `--ux-marquee-offset` on every track; the track's Tailwind class consumes it.

import { copiesFor, type MarqueeSettings } from "./marquee.config";

export interface MarqueeEngineCallbacks {
  /** A row needs a different number of content copies */
  onCopies(row: number, copies: number): void;
  /** Reduced motion turned the strip static (or back) */
  onStaticChange(isStatic: boolean): void;
  /** Manual pause state changed (button, pause(), play(), `paused` option) */
  onPausedChange(paused: boolean): void;
}

export interface MarqueeEngine {
  /** Re-reads rows / groups from the DOM; offsets are kept by row index */
  refresh(): void;
  update(settings: MarqueeSettings): void;
  pause(): void;
  play(): void;
  toggle(): void;
  setSpeed(speed: number): void;
  readonly paused: boolean;
  readonly isStatic: boolean;
  destroy(): void;
}

interface Row {
  el: HTMLElement;
  track: HTMLElement | null;
  group: HTMLElement | null;
  offset: number;
  vel: number;
  size: number;
  copies: number;
}

interface Drag {
  row: Row;
  id: number;
  start: number;
  startOffset: number;
  last: number;
  lastTime: number;
  fling: number;
  moved: boolean;
}

const DRAG_THRESHOLD = 4;
const MAX_FLING = 3000;
/** How fast the velocity eases toward its target (1/s) */
const EASE = 6;
const MAX_DT = 0.1;

export function createMarqueeEngine(
  root: HTMLElement,
  initial: MarqueeSettings,
  callbacks: MarqueeEngineCallbacks,
): MarqueeEngine {
  let settings = initial;
  let speed = initial.speed;
  let manualPaused = initial.paused;
  let rows: Row[] = [];
  let rowsEl: HTMLElement | null = null;
  let hovered = false;
  let focused = false;
  let inView = true;
  let drag: Drag | null = null;
  let frame = 0;
  let lastTime: number | null = null;

  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let isStatic = settings.respectReducedMotion && motion.matches;

  const pos = (e: PointerEvent) => (settings.vertical ? e.clientY : e.clientX);
  const dirSign = () => (settings.direction === "left" || settings.direction === "up" ? -1 : 1);

  function wrap(row: Row) {
    if (row.size <= 0) return;
    row.offset %= row.size;
    if (row.offset > 0) row.offset -= row.size;
  }

  function write(row: Row) {
    row.track?.style.setProperty("--ux-marquee-offset", `${row.offset.toFixed(2)}px`);
  }

  function target(row: Row, index: number): number {
    const holding =
      manualPaused ||
      drag?.row === row ||
      (hovered && settings.pauseOnHover) ||
      (focused && settings.pauseOnFocus);
    if (holding) return 0;
    const reverse = hovered && settings.reverseOnHover ? -1 : 1;
    const alternate = index % 2 === 1 ? -1 : 1;
    return speed * dirSign() * alternate * reverse;
  }

  function tick(time: number) {
    frame = 0;
    const dt = lastTime === null ? 0 : Math.min(MAX_DT, (time - lastTime) / 1000);
    lastTime = time;
    const ease = 1 - Math.exp(-dt * EASE);
    let moving = false;
    rows.forEach((row, index) => {
      if (drag?.row === row) return;
      const goal = target(row, index);
      row.vel += (goal - row.vel) * ease;
      if (Math.abs(row.vel - goal) < 0.01) row.vel = goal;
      if (row.vel !== 0) {
        row.offset += row.vel * dt;
        wrap(row);
        write(row);
      }
      if (row.vel !== 0 || goal !== 0) moving = true;
    });
    if (moving) frame = requestAnimationFrame(tick);
    else lastTime = null;
  }

  /** Starts the loop when it can run (it stops itself once everything is at rest) */
  function kick() {
    if (frame || isStatic || !inView || document.hidden) return;
    lastTime = null;
    frame = requestAnimationFrame(tick);
  }

  function stop() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    lastTime = null;
  }

  function measure() {
    rows.forEach((row, index) => {
      if (!row.group) return;
      const rect = row.group.getBoundingClientRect();
      const view = row.el.getBoundingClientRect();
      row.size = settings.vertical ? rect.height : rect.width;
      wrap(row);
      write(row);
      const copies = isStatic
        ? 1
        : copiesFor(settings.vertical ? view.height : view.width, row.size, settings.repeat);
      if (copies !== row.copies) {
        row.copies = copies;
        callbacks.onCopies(index, copies);
      }
    });
  }

  const resizer = new ResizeObserver(measure);
  const visibility = new IntersectionObserver((entries) => {
    inView = entries.some((entry) => entry.isIntersecting);
    if (inView) kick();
    else stop();
  });
  visibility.observe(root);

  function refresh() {
    rowsEl = root.querySelector<HTMLElement>("[data-marquee-rows]");
    const els = rowsEl ? [...rowsEl.querySelectorAll<HTMLElement>("[data-marquee-row]")] : [];
    rows = els.map((el, index) => {
      const prev = rows[index];
      const track = el.querySelector<HTMLElement>("[data-marquee-track]");
      return {
        el,
        track,
        group: track?.querySelector<HTMLElement>("[data-marquee-group]") ?? null,
        offset: isStatic ? 0 : (prev?.offset ?? 0),
        vel: prev?.vel ?? 0,
        size: prev?.size ?? 0,
        copies: prev?.copies ?? track?.querySelectorAll("[data-marquee-group]").length ?? 0,
      };
    });
    bindRowsEl();
    resizer.disconnect();
    for (const row of rows) {
      resizer.observe(row.el);
      if (row.group) resizer.observe(row.group);
      write(row);
    }
    kick();
  }

  // --- hover / focus / drag (delegated on the rows container) ---

  const onEnter = () => {
    hovered = true;
    kick();
  };
  const onLeave = () => {
    hovered = false;
    kick();
  };
  const onFocusIn = () => {
    focused = true;
    kick();
  };
  const onFocusOut = (e: FocusEvent) => {
    if (rowsEl && e.relatedTarget instanceof Node && rowsEl.contains(e.relatedTarget)) return;
    focused = false;
    kick();
  };

  const suppressClick = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
  };

  function onPointerDown(e: PointerEvent) {
    if (!settings.draggable || isStatic || e.button !== 0) return;
    const el = (e.target as Element | null)?.closest<HTMLElement>("[data-marquee-row]");
    const row = rows.find((r) => r.el === el);
    if (!row) return;
    drag = {
      row,
      id: e.pointerId,
      start: pos(e),
      startOffset: row.offset,
      last: pos(e),
      lastTime: e.timeStamp,
      fling: 0,
      moved: false,
    };
    row.vel = 0;
  }

  function onPointerMove(e: PointerEvent) {
    if (!drag || e.pointerId !== drag.id) return;
    const p = pos(e);
    if (!drag.moved && Math.abs(p - drag.start) > DRAG_THRESHOLD) {
      drag.moved = true;
      drag.row.el.setPointerCapture(e.pointerId);
    }
    if (!drag.moved) return;
    const dt = (e.timeStamp - drag.lastTime) / 1000;
    if (dt > 0) drag.fling = (p - drag.last) / dt;
    drag.last = p;
    drag.lastTime = e.timeStamp;
    drag.row.offset = drag.startOffset + (p - drag.start);
    wrap(drag.row);
    write(drag.row);
  }

  function onPointerUp(e: PointerEvent) {
    if (!drag || e.pointerId !== drag.id) return;
    const { row, moved, fling } = drag;
    drag = null;
    if (row.el.hasPointerCapture(e.pointerId)) row.el.releasePointerCapture(e.pointerId);
    if (moved) {
      // A drag is not a click on whatever is under the pointer
      row.el.addEventListener("click", suppressClick, { capture: true, once: true });
      setTimeout(() => row.el.removeEventListener("click", suppressClick, true), 0);
      row.vel = Math.max(-MAX_FLING, Math.min(MAX_FLING, fling));
    }
    kick();
  }

  const onDragStart = (e: Event) => {
    if (settings.draggable) e.preventDefault();
  };

  let bound: HTMLElement | null = null;
  function bindRowsEl() {
    if (bound === rowsEl) return;
    unbindRowsEl();
    bound = rowsEl;
    if (!bound) return;
    bound.addEventListener("pointerenter", onEnter);
    bound.addEventListener("pointerleave", onLeave);
    bound.addEventListener("focusin", onFocusIn);
    bound.addEventListener("focusout", onFocusOut);
    bound.addEventListener("pointerdown", onPointerDown);
    bound.addEventListener("pointermove", onPointerMove);
    bound.addEventListener("pointerup", onPointerUp);
    bound.addEventListener("pointercancel", onPointerUp);
    bound.addEventListener("dragstart", onDragStart);
  }
  function unbindRowsEl() {
    if (!bound) return;
    bound.removeEventListener("pointerenter", onEnter);
    bound.removeEventListener("pointerleave", onLeave);
    bound.removeEventListener("focusin", onFocusIn);
    bound.removeEventListener("focusout", onFocusOut);
    bound.removeEventListener("pointerdown", onPointerDown);
    bound.removeEventListener("pointermove", onPointerMove);
    bound.removeEventListener("pointerup", onPointerUp);
    bound.removeEventListener("pointercancel", onPointerUp);
    bound.removeEventListener("dragstart", onDragStart);
    bound = null;
  }

  // --- reduced motion / page visibility ---

  function syncStatic() {
    const next = settings.respectReducedMotion && motion.matches;
    if (next === isStatic) return;
    isStatic = next;
    if (isStatic) {
      stop();
      for (const row of rows) {
        row.offset = 0;
        row.vel = 0;
        write(row);
      }
    }
    callbacks.onStaticChange(isStatic);
    measure();
    kick();
  }
  motion.addEventListener("change", syncStatic);

  const onVisibility = () => (document.hidden ? stop() : kick());
  document.addEventListener("visibilitychange", onVisibility);

  function setPaused(next: boolean) {
    if (next === manualPaused) return;
    manualPaused = next;
    callbacks.onPausedChange(next);
    kick();
  }

  return {
    refresh,
    update(next) {
      const axisChanged = next.vertical !== settings.vertical;
      if (next.speed !== settings.speed) speed = next.speed;
      if (next.paused !== settings.paused) setPaused(next.paused);
      settings = next;
      if (axisChanged) for (const row of rows) row.offset = 0;
      syncStatic();
      measure();
      kick();
    },
    pause: () => setPaused(true),
    play: () => setPaused(false),
    toggle: () => setPaused(!manualPaused),
    setSpeed(value) {
      if (!Number.isFinite(value)) return;
      speed = Math.max(0, value);
      kick();
    },
    get paused() {
      return manualPaused;
    },
    get isStatic() {
      return isStatic;
    },
    destroy() {
      stop();
      resizer.disconnect();
      visibility.disconnect();
      unbindRowsEl();
      motion.removeEventListener("change", syncStatic);
      document.removeEventListener("visibilitychange", onVisibility);
      rows = [];
    },
  };
}
