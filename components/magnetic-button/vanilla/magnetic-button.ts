import {
  classes,
  ICON_PATH,
  motionVars,
  resolveSettings,
  resolveTokens,
  toMs,
  type MagneticButtonOptions,
  type MagneticButtonSettings,
} from "./magnetic-button.config";

export interface MagneticButtonInstance {
  /** The managed <button> / <a> */
  readonly element: HTMLButtonElement | HTMLAnchorElement;
  update(partial: MagneticButtonOptions): void;
  /** Snaps the button and its label back to rest immediately */
  reset(): void;
  destroy(): void;
}

const FRAME_MS = 1000 / 60;
const SVG_NS = "http://www.w3.org/2000/svg";

function createIcon(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", classes.icon);
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", ICON_PATH);
  svg.append(path);
  return svg;
}

/**
 * Enhances the first <button>/<a> child of `container` (its content becomes the label),
 * or creates one from `label` when there is none.
 */
export function createMagneticButton(
  container: HTMLElement,
  options: MagneticButtonOptions = {},
): MagneticButtonInstance {
  let current: MagneticButtonOptions = { ...options };
  let settings: MagneticButtonSettings = resolveSettings(current);

  const existing = container.querySelector<HTMLButtonElement | HTMLAnchorElement>(
    ":scope > button, :scope > a",
  );
  const enhanced = existing !== null;
  const original = existing
    ? {
        className: existing.getAttribute("class"),
        attrs: ["href", "disabled", "aria-disabled", "aria-label", "tabindex", "type"].map(
          (name) => [name, existing.getAttribute(name)] as const,
        ),
        children: Array.from(existing.childNodes),
      }
    : null;
  if (enhanced && options.as && options.as !== existing.tagName.toLowerCase())
    console.warn("[MagneticButton] `as` is ignored when enhancing an existing element");

  let el: HTMLButtonElement | HTMLAnchorElement =
    existing ?? document.createElement(settings.as === "a" ? "a" : "button");
  const layer = document.createElement("span");
  const labelBox = document.createElement("span");
  const text = document.createElement("span");
  const icon = createIcon();
  layer.className = classes.rippleLayer;
  layer.setAttribute("aria-hidden", "true");
  labelBox.className = classes.label;
  text.className = classes.text;
  if (original) text.append(...original.children);
  labelBox.append(text);
  el.append(layer, labelBox);
  if (!enhanced) container.append(el);

  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  const isStill = () => settings.disabled || (settings.respectReducedMotion && mq.matches);
  let tokenNames: string[] = [];

  // ---- magnet loop (window listener only while active) ----
  const pos = { x: 0, y: 0, lx: 0, ly: 0 };
  const target = { x: 0, y: 0, lx: 0, ly: 0 };
  const from = { ...pos };
  let mode: "rest" | "follow" | "return" = "rest";
  let returnStart = 0;
  let last = 0;
  let raf = 0;
  let listening = false;

  const write = () => {
    el.style.setProperty(motionVars.tx, `${pos.x.toFixed(2)}px`);
    el.style.setProperty(motionVars.ty, `${pos.y.toFixed(2)}px`);
    el.style.setProperty(motionVars.labelTx, `${pos.lx.toFixed(2)}px`);
    el.style.setProperty(motionVars.labelTy, `${pos.ly.toFixed(2)}px`);
  };

  const frame = (now: number) => {
    const dt = last ? now - last : FRAME_MS;
    last = now;
    if (mode === "follow") {
      const k = 1 - Math.pow(1 - settings.ease, dt / FRAME_MS);
      pos.x += (target.x - pos.x) * k;
      pos.y += (target.y - pos.y) * k;
      pos.lx += (target.lx - pos.lx) * k;
      pos.ly += (target.ly - pos.ly) * k;
    } else if (mode === "return") {
      const d = settings.returnDuration;
      const p = d > 0 ? Math.min(1, (now - returnStart) / d) : 1;
      const left = Math.pow(1 - p, 3);
      pos.x = from.x * left;
      pos.y = from.y * left;
      pos.lx = from.lx * left;
      pos.ly = from.ly * left;
      if (p >= 1) mode = "rest";
    }
    write();
    raf = mode === "rest" ? 0 : requestAnimationFrame(frame);
  };

  const start = () => {
    if (raf) return;
    last = 0;
    raf = requestAnimationFrame(frame);
  };

  const release = () => {
    if (mode !== "follow") return;
    Object.assign(from, pos);
    returnStart = performance.now();
    mode = "return";
    start();
  };

  const onMove = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    const rect = el.getBoundingClientRect();
    // The rect already includes the current offset; remove it to get the resting center
    const dx = e.clientX - (rect.left + rect.width / 2 - pos.x);
    const dy = e.clientY - (rect.top + rect.height / 2 - pos.y);
    const ex = Math.max(Math.abs(dx) - rect.width / 2, 0);
    const ey = Math.max(Math.abs(dy) - rect.height / 2, 0);
    if (Math.hypot(ex, ey) > settings.radius) return release();
    target.x = dx * settings.strength;
    target.y = dy * settings.strength;
    target.lx = dx * settings.textStrength;
    target.ly = dy * settings.textStrength;
    mode = "follow";
    start();
  };

  const listen = (on: boolean) => {
    if (on === listening) return;
    listening = on;
    if (on) {
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("blur", release);
      document.documentElement.addEventListener("pointerleave", release);
    } else {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("blur", release);
      document.documentElement.removeEventListener("pointerleave", release);
    }
  };

  const reset = () => {
    cancelAnimationFrame(raf);
    raf = 0;
    mode = "rest";
    Object.assign(pos, { x: 0, y: 0, lx: 0, ly: 0 });
    write();
  };

  // ---- click / ripple ----
  const onClick = (e: MouseEvent) => {
    if (settings.disabled) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
    if (!settings.ripple || isStill()) return;
    const rect = layer.getBoundingClientRect();
    const keyboard = e.detail === 0;
    const x = keyboard ? rect.width / 2 : e.clientX - rect.left;
    const y = keyboard ? rect.height / 2 : e.clientY - rect.top;
    const size = 2 * Math.hypot(Math.max(x, rect.width - x), Math.max(y, rect.height - y));
    const dot = document.createElement("span");
    dot.className = classes.ripple;
    dot.style.setProperty("--ux-magnetic-button-ripple-x", `${x}px`);
    dot.style.setProperty("--ux-magnetic-button-ripple-y", `${y}px`);
    dot.style.setProperty("--ux-magnetic-button-ripple-size", `${size}px`);
    layer.append(dot);
    const duration = toMs(el.style.getPropertyValue("--ux-magnetic-button-ripple-duration"), 600);
    const animation = dot.animate(
      [
        { scale: "0", opacity: 1 },
        { scale: "1", opacity: 0 },
      ],
      { duration, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
    );
    animation.onfinish = animation.oncancel = () => dot.remove();
  };

  const bind = (node: HTMLElement, on: boolean) => {
    if (on) node.addEventListener("click", onClick, true);
    else node.removeEventListener("click", onClick, true);
  };

  /** Swaps a created element for the other tag, keeping its children and state */
  const swapTag = () => {
    const tag = settings.as === "a" ? "a" : "button";
    if (enhanced || el.tagName.toLowerCase() === tag) return;
    const next = document.createElement(tag);
    next.append(...Array.from(el.childNodes));
    bind(el, false);
    el.replaceWith(next);
    el = next;
    bind(el, true);
    tokenNames = [];
  };

  function render() {
    swapTag();
    const still = isStill();
    const vars = resolveTokens(settings, still);
    for (const name of tokenNames) if (!(name in vars)) el.style.removeProperty(name);
    for (const [name, value] of Object.entries(vars)) el.style.setProperty(name, value);
    tokenNames = Object.keys(vars);
    write();

    el.setAttribute(
      "class",
      enhanced && original?.className ? `${classes.root} ${original.className}` : classes.root,
    );
    if (!enhanced || "label" in current) text.textContent = settings.label;
    text.hidden = text.childNodes.length === 0;
    if (settings.icon) labelBox.append(icon);
    else icon.remove();

    if (settings.ariaLabel) el.setAttribute("aria-label", settings.ariaLabel);
    else if (!enhanced) el.removeAttribute("aria-label");

    if (el instanceof HTMLButtonElement) {
      if (!enhanced) el.type = "button";
      el.disabled = settings.disabled;
    } else {
      const href = enhanced
        ? (original?.attrs.find(([n]) => n === "href")?.[1] ?? "")
        : settings.href;
      const link = "href" in current ? settings.href : href;
      if (settings.disabled || !link) el.removeAttribute("href");
      else el.setAttribute("href", link);
      if (settings.disabled) {
        el.setAttribute("aria-disabled", "true");
        el.tabIndex = -1;
      } else {
        el.removeAttribute("aria-disabled");
        el.removeAttribute("tabindex");
      }
    }

    listen(!still);
    if (still && mode !== "rest") reset();
  }

  const onMotionChange = () => render();
  mq.addEventListener("change", onMotionChange);
  bind(el, true);
  render();

  return {
    get element() {
      return el;
    },
    update(partial) {
      current = { ...current, ...partial };
      settings = resolveSettings(current);
      render();
    },
    reset,
    destroy() {
      listen(false);
      cancelAnimationFrame(raf);
      mq.removeEventListener("change", onMotionChange);
      bind(el, false);
      for (const name of [...tokenNames, ...Object.values(motionVars)])
        el.style.removeProperty(name);
      layer.remove();
      labelBox.remove();
      if (!original) {
        el.remove();
        return;
      }
      el.append(...original.children);
      if (original.className === null) el.removeAttribute("class");
      else el.setAttribute("class", original.className);
      for (const [name, value] of original.attrs) {
        if (value === null) el.removeAttribute(name);
        else el.setAttribute(name, value);
      }
      if (el instanceof HTMLButtonElement)
        el.disabled = original.attrs.some(([n, v]) => n === "disabled" && v !== null);
    },
  };
}
