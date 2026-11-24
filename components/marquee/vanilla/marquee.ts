import {
  axis,
  classes,
  icons,
  resolveSettings,
  resolveTokens,
  rotate,
  type MarqueeHandle,
  type MarqueeOptions,
  type MarqueeSettings,
} from "./marquee.config";
import { createMarqueeEngine } from "./marquee.engine";

export type { MarqueeHandle, MarqueeOptions } from "./marquee.config";

export interface MarqueeInstance extends MarqueeHandle {
  /** Changes options without rebuilding the strip (content is rebuilt only when it changed) */
  update(partial: MarqueeOptions): void;
  readonly paused: boolean;
  /** Removes the strip and puts the container's original children back */
  destroy(): void;
}

const SVG_NS = "http://www.w3.org/2000/svg";
/** Options that change the rendered content (everything else only touches classes / tokens) */
const CONTENT_KEYS = ["items", "separator", "rows"] as const;

const join = (...parts: (string | false | undefined)[]) => parts.filter(Boolean).join(" ");

export function createMarquee(
  container: HTMLElement,
  options: MarqueeOptions = {},
): MarqueeInstance {
  let current: MarqueeOptions = { ...options };
  let settings: MarqueeSettings = resolveSettings(current);

  // The container's existing children become the items when `items` is empty
  const originals = [...container.childNodes].filter(
    (node) => node.nodeType === Node.ELEMENT_NODE || !!node.textContent?.trim(),
  );
  const leftovers = [...container.childNodes].filter((node) => !originals.includes(node));
  for (const node of leftovers) node.remove();

  const root = document.createElement("section");
  const rowsEl = document.createElement("div");
  rowsEl.dataset.marqueeRows = "";
  const button = document.createElement("button");
  button.type = "button";
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("class", classes.controlIcon);
  const path = document.createElementNS(SVG_NS, "path");
  svg.append(path);
  button.append(svg);
  root.append(rowsEl, button);
  container.append(root);

  let copies: number[] = [];

  function makeItem(content: Node | string, original: boolean): HTMLElement {
    const item = document.createElement("div");
    item.dataset.marqueeItem = "";
    if (typeof content === "string") item.textContent = content;
    else item.append(original ? content : content.cloneNode(true));
    return item;
  }

  /** Group 0 of row 0 holds the original nodes (keeping their listeners); the rest are clones */
  function makeGroup(row: number): HTMLElement {
    const group = document.createElement("div");
    group.dataset.marqueeGroup = "";
    const source: (Node | string)[] = settings.items.length ? settings.items : originals;
    for (const content of rotate(source, row, settings.rows)) {
      group.append(makeItem(content, row === 0));
      if (!settings.separator) continue;
      const sep = document.createElement("span");
      sep.dataset.marqueeSeparator = "";
      sep.setAttribute("aria-hidden", "true");
      sep.textContent = settings.separator;
      group.append(sep);
    }
    if (row > 0) hide(group);
    return group;
  }

  function hide(group: HTMLElement) {
    group.setAttribute("aria-hidden", "true");
    group.inert = true;
  }

  function setCopies(row: number, count: number) {
    const track = rowsEl.querySelectorAll<HTMLElement>("[data-marquee-track]")[row];
    const first = track?.firstElementChild;
    if (!track || !first) return;
    while (track.children.length > count) track.lastElementChild?.remove();
    while (track.children.length < count) {
      const clone = first.cloneNode(true) as HTMLElement;
      hide(clone);
      track.append(clone);
    }
  }

  function build() {
    // Move the originals out of the old items before the old DOM is discarded
    for (const node of originals) node.parentNode?.removeChild(node);
    rowsEl.replaceChildren();
    for (let row = 0; row < settings.rows; row++) {
      const viewport = document.createElement("div");
      viewport.dataset.marqueeRow = "";
      const track = document.createElement("div");
      track.dataset.marqueeTrack = "";
      track.append(makeGroup(row));
      viewport.append(track);
      rowsEl.append(viewport);
      setCopies(row, isStatic() ? 1 : Math.max(1, copies[row] ?? settings.repeat));
    }
    applyClasses();
  }

  const isStatic = () => engine?.isStatic ?? false;

  function applyClasses() {
    const ax = axis(settings);
    const still = isStatic();
    root.className = classes.root;
    root.setAttribute("aria-label", settings.label);
    root.removeAttribute("style");
    for (const [name, value] of Object.entries(resolveTokens(settings)))
      root.style.setProperty(name, value);
    rowsEl.className = classes.rows[ax];
    const viewportClass = join(
      still ? classes.staticViewport[ax] : classes.viewport[ax],
      settings.fade && classes.fade[ax],
      settings.draggable && !still && classes.drag[ax],
    );
    const set = (selector: string, className: string) => {
      for (const el of rowsEl.querySelectorAll(selector)) el.className = className;
    };
    set("[data-marquee-row]", viewportClass);
    set("[data-marquee-track]", classes.track[ax]);
    set("[data-marquee-group]", classes.group[ax]);
    set("[data-marquee-item]", classes.item[settings.variant]);
    set("[data-marquee-separator]", classes.separator);
    renderButton();
  }

  function renderButton() {
    button.className = classes.control;
    button.hidden = !settings.controls || isStatic();
    const paused = engine?.paused ?? settings.paused;
    button.setAttribute("aria-label", paused ? settings.playLabel : settings.pauseLabel);
    path.setAttribute("d", paused ? icons.play : icons.pause);
  }

  let engine: ReturnType<typeof createMarqueeEngine> | null = null;
  build();
  engine = createMarqueeEngine(root, settings, {
    onCopies(row, count) {
      copies[row] = count;
      setCopies(row, count);
    },
    onStaticChange() {
      copies = [];
      build();
      engine?.refresh();
    },
    onPausedChange: renderButton,
  });
  // The engine may already know the page prefers reduced motion
  if (engine.isStatic) build();
  engine.refresh();

  const onClick = () => engine?.toggle();
  button.addEventListener("click", onClick);

  return {
    update(partial) {
      const next = { ...current, ...partial };
      const contentChanged = CONTENT_KEYS.some(
        (key) => JSON.stringify(next[key]) !== JSON.stringify(current[key]),
      );
      current = next;
      settings = resolveSettings(current);
      if (contentChanged) build();
      else applyClasses();
      engine?.update(settings);
      if (contentChanged) engine?.refresh();
    },
    pause: () => engine?.pause(),
    play: () => engine?.play(),
    toggle: () => engine?.toggle(),
    setSpeed: (speed) => engine?.setSpeed(speed),
    get paused() {
      return engine?.paused ?? settings.paused;
    },
    destroy() {
      button.removeEventListener("click", onClick);
      engine?.destroy();
      engine = null;
      for (const node of originals) node.parentNode?.removeChild(node);
      root.remove();
      container.append(...leftovers, ...originals);
    },
  };
}
