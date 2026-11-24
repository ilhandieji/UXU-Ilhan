import {
  hostClasses,
  layers,
  resolveSettings,
  resolveTokens,
  type MatrixRainOptions,
} from "./matrix-rain.config";
import { createMatrixRainEngine } from "./matrix-rain.engine";

export interface MatrixRainInstance {
  update(partial: MatrixRainOptions): void;
  pause(): void;
  resume(): void;
  /** Speed spike that eases out over ~1s */
  burst(): void;
  /** Wipes the canvas and restarts the rain from the edge */
  clear(): void;
  destroy(): void;
}

/**
 * Adds the rain as a canvas layer inside `container`; existing children stay above it
 * (contained) or the canvas covers the viewport (fullscreen). Tokens are set on `container`.
 */
export function createMatrixRain(
  container: HTMLElement,
  options: MatrixRainOptions = {},
): MatrixRainInstance {
  let current: MatrixRainOptions = { ...options };
  let settings = resolveSettings(current);

  // Only classes the host did not already have, so destroy() restores it exactly
  let added: string[] = [];
  function applyHost() {
    container.classList.remove(...added);
    added = hostClasses[settings.variant].filter((name) => !container.classList.contains(name));
    container.classList.add(...added);
  }

  // Remember the host's own inline values of our variables to restore them on destroy
  const original = new Map<string, string>();
  let tokenNames: string[] = [];
  function applyTokens() {
    const tokens = resolveTokens(current);
    for (const name of tokenNames) if (!(name in tokens)) restore(name);
    for (const [name, value] of Object.entries(tokens)) {
      if (!original.has(name)) original.set(name, container.style.getPropertyValue(name));
      container.style.setProperty(name, value);
    }
    tokenNames = Object.keys(tokens);
  }
  function restore(name: string) {
    const previous = original.get(name);
    if (previous) container.style.setProperty(name, previous);
    else container.style.removeProperty(name);
  }

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  container.prepend(canvas);

  function render() {
    canvas.className = layers[settings.variant];
    applyHost();
    applyTokens();
  }

  render();
  const engine = createMatrixRainEngine(canvas, settings);
  let destroyed = false;

  return {
    update(partial) {
      if (destroyed) return;
      current = { ...current, ...partial };
      settings = resolveSettings(current);
      render();
      engine.update(settings);
    },
    pause: () => engine.pause(),
    resume: () => engine.resume(),
    burst: () => engine.burst(),
    clear: () => engine.clear(),
    destroy() {
      if (destroyed) return;
      destroyed = true;
      engine.destroy();
      canvas.remove();
      container.classList.remove(...added);
      for (const name of original.keys()) restore(name);
    },
  };
}
