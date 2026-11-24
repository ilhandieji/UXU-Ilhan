import {
  classes,
  resolveSettings,
  resolveTokens,
  rootClassName,
  type ScrambleTextOptions,
  type ScrambleTextSettings,
} from "./scramble-text.config";
import { createScrambleEngine, type ScrambleCell } from "./scramble-text.engine";

export interface ScrambleTextInstance {
  update(partial: ScrambleTextOptions): void;
  /** Starts the scramble-in unless it is already running */
  play(): void;
  /** Restarts the scramble-in from scratch */
  replay(): void;
  /** Jumps to the final text */
  stop(): void;
  /** Scrambles into a new text (same as update({ text })) */
  setText(text: string): void;
  /** The root element (its tag follows the `as` option) */
  readonly element: HTMLElement;
  destroy(): void;
}

export function createScrambleText(
  container: HTMLElement,
  options: ScrambleTextOptions = {},
): ScrambleTextInstance {
  let current: ScrambleTextOptions = { ...options };
  let settings: ScrambleTextSettings = resolveSettings(current);

  const sr = document.createElement("span");
  sr.className = classes.srOnly;
  const visual = document.createElement("span");
  visual.setAttribute("aria-hidden", "true");
  const charEls: HTMLSpanElement[] = [];

  let root = document.createElement(settings.as);
  root.append(sr, visual);
  container.append(root);

  const render = (cells: ScrambleCell[]) => {
    while (charEls.length > cells.length) charEls.pop()?.remove();
    while (charEls.length < cells.length) {
      const span = document.createElement("span");
      visual.append(span);
      charEls.push(span);
    }
    cells.forEach((cell, i) => {
      const span = charEls[i];
      if (span.textContent !== cell.char) span.textContent = cell.char;
      const name = cell.scrambled ? classes.scrambled : "";
      if (span.className !== name) span.className = name;
    });
  };

  const engine = createScrambleEngine(settings.text, settings, {
    onFrame: render,
    onComplete: () => current.onComplete?.(),
  });
  sr.textContent = settings.text;
  render(Array.from(settings.text).map((char) => ({ char, scrambled: false })));

  const onEnter = () => engine.play();
  let observer: IntersectionObserver | null = null;

  const detachTrigger = () => {
    root.removeEventListener("pointerenter", onEnter);
    observer?.disconnect();
    observer = null;
  };

  const attachTrigger = () => {
    detachTrigger();
    const { trigger } = settings;
    if (trigger === "mount" || trigger === "loop") engine.replay();
    else if (trigger === "hover") root.addEventListener("pointerenter", onEnter);
    else if (trigger === "inView" && typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer?.disconnect();
        observer = null;
        engine.replay();
      });
      observer.observe(root);
    }
  };

  const applyStyle = () => {
    root.className = rootClassName(settings);
    root.removeAttribute("style");
    for (const [name, value] of Object.entries(resolveTokens(settings)))
      root.style.setProperty(name, value);
  };

  /** A new `as` swaps the root element but keeps children and the running animation */
  const swapTag = () => {
    if (root.tagName.toLowerCase() === settings.as) return;
    detachTrigger();
    const next = document.createElement(settings.as);
    next.append(sr, visual);
    root.replaceWith(next);
    root = next;
  };

  applyStyle();
  attachTrigger();

  const setText = (text: string) => {
    engine.setText(text, true);
    sr.textContent = text;
  };

  return {
    update(partial) {
      const previous = settings;
      current = { ...current, ...partial };
      settings = resolveSettings(current);
      engine.update(settings);
      const tagChanged = previous.as !== settings.as;
      swapTag();
      applyStyle();
      if (previous.text !== settings.text) setText(settings.text);
      if (tagChanged || previous.trigger !== settings.trigger) attachTrigger();
    },
    play: () => engine.play(),
    replay: () => engine.replay(),
    stop: () => engine.stop(),
    setText,
    get element() {
      return root;
    },
    destroy() {
      detachTrigger();
      engine.destroy();
      root.remove();
    },
  };
}
