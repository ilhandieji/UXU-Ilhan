import {
  classes,
  hostClasses,
  resolveSettings,
  variants,
  type GlowCursorOptions,
} from "./glow-cursor.config";
import { createGlowCursorEngine, type GlowCursorEngine } from "./glow-cursor.engine";

export interface GlowCursorInstance {
  update(partial: GlowCursorOptions): void;
  /** Burst at (x, y) in px relative to the container; defaults to the center */
  burst(x?: number, y?: number): void;
  clear(): void;
  /** false when WebGL2 is unavailable (nothing is drawn) */
  readonly supported: boolean;
  destroy(): void;
}

/**
 * Adds the light as a layer inside `container`; existing children stay in place
 * (above the light in the `contained` variant, below it in `overlay`).
 */
export function createGlowCursor(
  container: HTMLElement,
  options: GlowCursorOptions = {},
): GlowCursorInstance {
  let current: GlowCursorOptions = { ...options };
  let settings = resolveSettings(current);

  // Only classes the host did not already have, so destroy() restores it exactly
  let added: string[] = [];
  function applyHost() {
    container.classList.remove(...added);
    added = hostClasses[settings.variant].filter((name) => !container.classList.contains(name));
    container.classList.add(...added);
  }

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  container.prepend(canvas);

  let hidden: HTMLElement | null = null;
  function applyCursor() {
    const target = !settings.hideCursor
      ? null
      : settings.variant === "fixed"
        ? document.documentElement
        : container;
    if (target === hidden) return;
    hidden?.classList.remove(classes.hiddenCursor);
    target?.classList.add(classes.hiddenCursor);
    hidden = target;
  }

  function render() {
    canvas.className = variants[settings.variant];
    applyHost();
    applyCursor();
  }

  render();
  const engine: GlowCursorEngine | null = createGlowCursorEngine(canvas, settings);
  if (!engine) current.onUnsupported?.();

  return {
    supported: !!engine,
    update(partial) {
      current = { ...current, ...partial };
      settings = resolveSettings(current);
      render();
      engine?.update(settings);
    },
    burst: (x, y) => engine?.burst(x, y),
    clear: () => engine?.clear(),
    destroy() {
      engine?.destroy();
      hidden?.classList.remove(classes.hiddenCursor);
      canvas.remove();
      container.classList.remove(...added);
    },
  };
}
