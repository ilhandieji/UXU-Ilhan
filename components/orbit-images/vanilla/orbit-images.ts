import {
  captionClasses,
  classes,
  fitClasses,
  resolveSettings,
  resolveTokens,
  type OrbitImagesOptions,
  type OrbitImagesSettings,
} from "./orbit-images.config";
import { buildOrbitPath, createOrbitEngine } from "./orbit-images.engine";

export type OrbitImagesVanillaOptions = OrbitImagesOptions & {
  /** Content in the middle: a DOM node or plain text */
  centerContent?: Node | string;
  className?: string;
};

export interface OrbitImagesInstance {
  update(partial: OrbitImagesVanillaOptions): void;
  next(): void;
  prev(): void;
  /** Glides the image at `index` to the front */
  goTo(index: number): void;
  destroy(): void;
}

const SVG_NS = "http://www.w3.org/2000/svg";
const join = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");
let uid = 0;

function svgEl<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string> = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
  return el;
}

export function createOrbitImages(
  container: HTMLElement,
  options: OrbitImagesVanillaOptions = {},
): OrbitImagesInstance {
  let current: OrbitImagesVanillaOptions = { ...options };
  let settings = resolveSettings(current);
  const clipId = `orbit-clip-v${++uid}`;

  const root = document.createElement("div");
  root.setAttribute("role", "region");
  root.setAttribute("aria-roledescription", "carousel");
  if (settings.intro) root.setAttribute("data-intro", "");
  const stage = document.createElement("div");
  stage.className = classes.stage;
  stage.setAttribute("data-orbit-stage", "");
  root.append(stage);

  const backSvg = svgEl("svg", {
    "data-orbit-svg": "",
    preserveAspectRatio: "none",
    "aria-hidden": "true",
  });
  const backPath = svgEl("path", {
    "data-orbit-path": "",
    "data-orbit-stroke": "",
    class: classes.stroke,
  });
  backSvg.append(backPath);
  stage.append(backSvg);

  // Front copy of the path (lower half only) so items pass in front of / behind the center content
  const frontSvg = svgEl("svg", {
    "data-orbit-svg": "",
    preserveAspectRatio: "none",
    "aria-hidden": "true",
    class: join(classes.svg, classes.svgFront),
  });
  const clipPath = svgEl("clipPath", { id: clipId, clipPathUnits: "userSpaceOnUse" });
  clipPath.append(svgEl("rect", { "data-orbit-clip": "" }));
  const defs = svgEl("defs");
  defs.append(clipPath);
  const group = svgEl("g", { "clip-path": `url(#${clipId})` });
  const frontPath = svgEl("path", { "data-orbit-stroke": "", class: classes.stroke });
  group.append(frontPath);
  frontSvg.append(defs, group);

  const itemsHost = document.createDocumentFragment();
  let itemsKey = "";
  let items: HTMLElement[] = [];

  const center = document.createElement("div");
  center.className = classes.center;
  center.setAttribute("data-orbit-center", "");

  function buildItems(s: OrbitImagesSettings) {
    const interactive = !!s.onItemClick;
    const key = JSON.stringify([s.items, interactive, s.loading]);
    if (key === itemsKey) return;
    itemsKey = key;
    items.forEach((el) => el.remove());
    items = s.items.map((item, index) => {
      const el = document.createElement("div");
      el.setAttribute("data-orbit-item", String(index));
      if (interactive) {
        el.setAttribute("role", "button");
        el.tabIndex = 0;
        el.setAttribute("aria-label", item.alt);
      }
      const frame = document.createElement("div");
      const img = document.createElement("img");
      img.src = item.src;
      img.alt = item.alt;
      img.draggable = false;
      img.decoding = "async";
      img.loading = s.loading;
      frame.append(img);
      if (item.caption) {
        const caption = document.createElement("span");
        caption.textContent = item.caption;
        frame.append(caption);
      }
      el.append(frame);
      itemsHost.append(el);
      return el;
    });
    stage.insertBefore(itemsHost, center.parentNode === stage ? center : null);
  }

  /** Classes and attributes that change with options (cheap, runs on every update) */
  function render() {
    const s = settings;
    const path = buildOrbitPath(s);
    const c = s.baseWidth / 2;
    const transform = `rotate(${s.rotation} ${c} ${c})`;
    const clickable = s.clickToFront || !!s.onItemClick;

    root.className = join(
      classes.root,
      s.height === "auto" ? classes.autoHeight : classes.fixedHeight,
      s.draggable && classes.draggable,
      current.className,
    );
    root.setAttribute("aria-label", s.altPrefix);
    for (const [name, value] of Object.entries(resolveTokens(s))) {
      // The engine owns the measured aspect ratio once the path exists
      if (name === "--ux-orbit-images-aspect" && root.style.getPropertyValue(name)) continue;
      root.style.setProperty(name, value);
    }

    backSvg.setAttribute(
      "class",
      join(classes.svg, classes.svgBack, !s.showPath && classes.hidden),
    );
    for (const p of [backPath, frontPath]) {
      p.setAttribute("d", path);
      p.setAttribute("transform", transform);
    }

    const centerValue = current.centerContent;
    if (centerValue) {
      center.replaceChildren(
        typeof centerValue === "string" ? document.createTextNode(centerValue) : centerValue,
      );
      if (center.parentNode !== stage) stage.append(center);
    } else center.remove();
    const layered = s.showPath && s.depth > 0 && !!centerValue;
    if (layered && frontSvg.parentNode !== stage) backSvg.after(frontSvg);
    if (!layered) frontSvg.remove();

    buildItems(s);
    items.forEach((el, index) => {
      el.className = join(classes.item, clickable && classes.clickable);
      const frame = el.firstElementChild as HTMLElement;
      frame.className = join(classes.frame, s.variant === "glass" && classes.frameGlass);
      const img = frame.querySelector("img");
      if (img) img.className = join(classes.image, fitClasses[s.objectFit]);
      const caption = frame.querySelector("span");
      if (caption) caption.className = join(classes.caption, captionClasses[s.captions]);
      if (s.items[index] && img && img.loading !== s.loading) img.loading = s.loading;
    });
  }

  render();
  container.append(root);
  const engine = createOrbitEngine(root, settings);
  engine.update(settings);

  return {
    update(partial) {
      current = { ...current, ...partial };
      settings = resolveSettings(current);
      render();
      engine.update(settings);
    },
    next: () => engine.next(),
    prev: () => engine.prev(),
    goTo: (index) => engine.goTo(index),
    destroy() {
      engine.destroy();
      root.remove();
    },
  };
}
