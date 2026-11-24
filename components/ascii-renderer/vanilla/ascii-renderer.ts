import {
  classes,
  resolveSettings,
  resolveTokens,
  type AsciiRendererOptions,
} from "./ascii-renderer.config";
import { createAsciiPlayer } from "./ascii-renderer.engine";

export interface AsciiRendererInstance {
  update(partial: AsciiRendererOptions): void;
  /** Starts video playback (also overrides reduced motion) */
  play(): void;
  pause(): void;
  /** Converts the current frame again right now */
  render(): void;
  /** Current ASCII as plain text lines joined by \n */
  toText(): string;
  destroy(): void;
}

/** Appends the renderer to `container`; it fills the container (or sizes itself by aspect ratio) */
export function createAsciiRenderer(
  container: HTMLElement,
  options: AsciiRendererOptions = {},
): AsciiRendererInstance {
  let current: AsciiRendererOptions = { ...options };

  const root = document.createElement("div");
  const layer = document.createElement("div");
  const canvas = document.createElement("canvas");
  const text = document.createElement("pre");
  root.className = classes.root;
  root.setAttribute("role", "img");
  layer.className = classes.layer;
  canvas.className = classes.canvas;
  canvas.setAttribute("aria-hidden", "true");
  text.className = classes.text;
  text.setAttribute("aria-hidden", "true");
  text.hidden = true;
  layer.append(canvas, text);
  root.append(layer);

  let tokenNames: string[] = [];
  function applyTokens() {
    const tokens = resolveTokens(current);
    for (const name of tokenNames) if (!(name in tokens)) root.style.removeProperty(name);
    for (const [name, value] of Object.entries(tokens)) root.style.setProperty(name, value);
    tokenNames = Object.keys(tokens);
  }

  let settings = resolveSettings(current);
  root.setAttribute("aria-label", settings.alt);
  applyTokens();
  container.append(root);
  const player = createAsciiPlayer({ root, layer, canvas, text }, settings, {
    video: classes.video,
  });

  return {
    update(partial) {
      current = { ...current, ...partial };
      settings = resolveSettings(current);
      root.setAttribute("aria-label", settings.alt);
      applyTokens();
      player.update(settings);
    },
    play: () => player.play(),
    pause: () => player.pause(),
    render: () => player.render(),
    toText: () => player.toText(),
    destroy() {
      player.destroy();
      root.remove();
    },
  };
}
