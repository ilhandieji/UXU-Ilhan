// ScrambleText engine — framework-free timeline (identical in React and Vanilla).
// Drives a requestAnimationFrame loop and reports the visible characters per tick;
// rendering and triggers stay in each version.
import type { ScrambleTextSettings } from "./scramble-text.config";

export interface ScrambleCell {
  char: string;
  /** true while the character is still a random one */
  scrambled: boolean;
}

export interface ScrambleEngine {
  /** Scrambles the current text in from scratch; no-op while running */
  play(): void;
  /** Restarts the scramble-in from scratch */
  replay(): void;
  /** Jumps to the final text and cancels a pending loop */
  stop(): void;
  /** Changes the target text; animate = scramble from what is shown now (split-flap) */
  setText(text: string, animate: boolean): void;
  update(settings: ScrambleTextSettings): void;
  readonly playing: boolean;
  readonly text: string;
  destroy(): void;
}

export interface ScrambleEngineCallbacks {
  onFrame(cells: ScrambleCell[]): void;
  onComplete(): void;
}

type Slot = {
  from: string;
  to: string;
  /** Scramble from the start instead of showing `from` until its turn */
  fromScrambled: boolean;
  animated: boolean;
  start: number;
  end: number;
  random: string;
};

const WHITESPACE = /^\s$/;

/** Splits into code points so emoji and surrogate pairs stay whole */
export const toChars = (text: string) => Array.from(text);

export const finalCells = (text: string): ScrambleCell[] =>
  toChars(text).map((char) => ({ char, scrambled: false }));

function shuffle<T>(list: T[]): T[] {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

/** Order in which the animated slots start */
function order(indices: number[], total: number, direction: ScrambleTextSettings["direction"]) {
  if (direction === "end") return [...indices].reverse();
  if (direction === "random") return shuffle([...indices]);
  if (direction === "center") {
    const mid = (total - 1) / 2;
    return [...indices].sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid) || a - b);
  }
  return indices;
}

export function createScrambleEngine(
  initialText: string,
  initial: ScrambleTextSettings,
  callbacks: ScrambleEngineCallbacks,
): ScrambleEngine {
  let settings = initial;
  let target = initialText;
  let cells = finalCells(initialText);
  let slots: Slot[] = [];
  let duration = 0;
  let startedAt = 0;
  let lastTick = -Infinity;
  let raf = 0;
  let loopTimer: ReturnType<typeof setTimeout> | undefined;
  let alive = true;

  const reducedQuery =
    typeof window !== "undefined"
      ? window.matchMedia?.("(prefers-reduced-motion: reduce)")
      : undefined;
  const reduced = () => settings.respectReducedMotion && (reducedQuery?.matches ?? false);

  const randomChar = () => {
    const chars = toChars(settings.chars);
    return chars[Math.floor(Math.random() * chars.length)] ?? "";
  };

  const keepsShape = (char: string) =>
    char === "\n" || (settings.preserveSpaces && WHITESPACE.test(char));

  const emit = (next: ScrambleCell[]) => {
    cells = next;
    callbacks.onFrame(next);
  };

  const clearLoop = () => {
    if (loopTimer !== undefined) clearTimeout(loopTimer);
    loopTimer = undefined;
  };

  const halt = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    slots = [];
  };

  const finish = () => {
    halt();
    emit(finalCells(target));
    callbacks.onComplete();
    if (alive && settings.trigger === "loop" && !reduced())
      loopTimer = setTimeout(() => {
        loopTimer = undefined;
        start(null);
      }, settings.loopDelay);
  };

  const cellAt = (slot: Slot, elapsed: number): ScrambleCell => {
    if (!slot.animated || elapsed >= slot.end) return { char: slot.to, scrambled: false };
    const begun = elapsed >= slot.start;
    if (keepsShape(slot.to) && (begun || slot.fromScrambled))
      return { char: slot.to, scrambled: false };
    if (!begun && !slot.fromScrambled) return { char: slot.from, scrambled: false };
    if (!begun && keepsShape(slot.from)) return { char: slot.from, scrambled: false };
    return { char: slot.random, scrambled: true };
  };

  const frame = (now: number) => {
    raf = 0;
    if (!alive) return;
    const elapsed = now - startedAt;
    if (elapsed >= duration) {
      finish();
      return;
    }
    if (now - lastTick >= settings.speed) {
      lastTick = now;
      for (const slot of slots) slot.random = randomChar();
      emit(slots.map((slot) => cellAt(slot, elapsed)));
    }
    raf = requestAnimationFrame(frame);
  };

  /** from = null: scramble in from scratch; otherwise transition from the given cells */
  function start(from: ScrambleCell[] | null) {
    halt();
    clearLoop();
    if (reduced()) {
      finish();
      return;
    }
    const to = toChars(target);
    const total = Math.max(to.length, from?.length ?? 0);
    slots = Array.from({ length: total }, (_, i) => {
      const source = from?.[i];
      const next = to[i] ?? "";
      const unchanged = !!source && !source.scrambled && source.char === next;
      const blank = !from && keepsShape(next);
      return {
        from: source?.char ?? "",
        to: next,
        fromScrambled: !from || !!source?.scrambled,
        animated: !unchanged && !blank,
        start: 0,
        end: 0,
        random: "",
      };
    });
    const animated = slots.flatMap((slot, i) => (slot.animated ? [i] : []));
    order(animated, total, settings.direction).forEach((index, rank) => {
      const slot = slots[index];
      slot.start = rank * settings.stagger;
      slot.end = slot.start + settings.scrambleDuration;
    });
    duration = animated.length
      ? (animated.length - 1) * settings.stagger + settings.scrambleDuration
      : 0;
    if (!animated.length || typeof requestAnimationFrame === "undefined") {
      finish();
      return;
    }
    startedAt = performance.now();
    lastTick = -Infinity;
    raf = requestAnimationFrame(frame);
  }

  return {
    play() {
      if (!raf) start(null);
    },
    replay() {
      start(null);
    },
    stop() {
      clearLoop();
      if (!raf) return;
      halt();
      emit(finalCells(target));
    },
    setText(text, animate) {
      if (text === target) return;
      target = text;
      if (animate) start(cells);
      else {
        halt();
        emit(finalCells(text));
      }
    },
    update(next) {
      const loopOff = settings.trigger === "loop" && next.trigger !== "loop";
      settings = next;
      if (loopOff) clearLoop();
    },
    get playing() {
      return raf !== 0;
    },
    get text() {
      return target;
    },
    destroy() {
      alive = false;
      halt();
      clearLoop();
    },
  };
}
