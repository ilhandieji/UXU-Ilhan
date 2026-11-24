import {
  badgeText,
  bounceFrames,
  classes,
  indicatorSide,
  magnifiedSize,
  motion,
  nextIndex,
  resolveSettings,
  roots,
  sanitizeItems,
  tooltipSide,
  tooltipVisibility,
  type DockItem,
  type DockOptions,
  type DockSettings,
} from "./dock.config";

export interface DockInstance {
  update(partial: DockOptions): void;
  setItems(items: DockItem[]): void;
  focusItem(index: number): void;
  /** The toolbar element */
  readonly element: HTMLElement;
  destroy(): void;
}

interface Entry {
  item: DockItem;
  el: HTMLAnchorElement | HTMLButtonElement;
  icon: HTMLSpanElement;
  badge: HTMLSpanElement;
  tooltip: HTMLSpanElement;
  indicator: HTMLSpanElement;
  /** Current animated size in px; null = at rest (CSS uses the base size) */
  size: number | null;
  animation?: Animation;
}

const SIZE_VAR = "--ux-dock-item-size";

/** Appends an app-dock toolbar to `container`. */
export function createDock(container: HTMLElement, options: DockOptions = {}): DockInstance {
  let current: DockOptions = { ...options };
  let s: DockSettings = resolveSettings(current);
  let items = sanitizeItems(current.items);
  let entries: Entry[] = [];
  let focusIndex = 0;
  let pointer: { x: number; y: number } | null = null;
  let keyboardFocus: number | null = null;
  let frame = 0;
  let last = 0;
  let appliedVars: string[] = [];

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const motionOff = () => s.respectReducedMotion && reduced.matches;
  const vertical = () => s.position === "left" || s.position === "right";

  const root = document.createElement("div");
  root.setAttribute("role", "toolbar");
  container.append(root);

  function renderRoot() {
    root.className = roots[s.position];
    root.setAttribute("aria-label", s.label);
    root.setAttribute("aria-orientation", vertical() ? "vertical" : "horizontal");
    for (const name of appliedVars) if (!(name in s.tokens)) root.style.removeProperty(name);
    for (const [name, value] of Object.entries(s.tokens)) root.style.setProperty(name, value);
    appliedVars = Object.keys(s.tokens);
  }

  function createEntry(item: DockItem): Entry {
    const el = document.createElement(item.href ? "a" : "button");
    if (el instanceof HTMLButtonElement) el.type = "button";
    const icon = document.createElement("span");
    const badge = document.createElement("span");
    const tooltip = document.createElement("span");
    const indicator = document.createElement("span");
    icon.setAttribute("aria-hidden", "true");
    badge.setAttribute("aria-hidden", "true");
    tooltip.setAttribute("aria-hidden", "true");
    indicator.setAttribute("aria-hidden", "true");
    el.append(icon, badge, tooltip, indicator);
    return { item, el, icon, badge, tooltip, indicator, size: null };
  }

  function renderIcon(entry: Entry) {
    const custom = current.renderIcon?.(entry.item) ?? null;
    if (custom === null) entry.icon.textContent = entry.item.icon;
    else if (typeof custom === "string") entry.icon.textContent = custom;
    else entry.icon.replaceChildren(custom);
  }

  function renderEntry(entry: Entry, index: number) {
    const { item, el } = entry;
    el.className = classes.item;
    el.tabIndex = index === focusIndex ? 0 : -1;
    el.setAttribute("aria-label", item.label);
    el.dataset.index = String(index);
    if (el instanceof HTMLAnchorElement) el.href = item.href ?? "";
    if (item.active) el.setAttribute("aria-current", item.href ? "page" : "true");
    else el.removeAttribute("aria-current");

    renderIcon(entry);
    entry.icon.className = classes.icon;

    const badge = badgeText(item.badge);
    entry.badge.className = classes.badge;
    entry.badge.hidden = badge === null;
    entry.badge.textContent = badge ?? "";

    entry.tooltip.hidden = s.labels === "none";
    entry.tooltip.textContent = item.label;
    if (s.labels !== "none")
      entry.tooltip.className = `${classes.tooltip} ${tooltipSide[s.position]} ${tooltipVisibility[s.labels]}`;

    entry.indicator.hidden = !(s.indicator && item.active);
    entry.indicator.className = `${classes.indicator} ${indicatorSide[s.position]}`;
  }

  /** Reuses elements by id so animated sizes and focus survive updates */
  function renderItems() {
    const previous = new Map(entries.map((entry) => [entry.item.id, entry]));
    focusIndex = Math.min(focusIndex, Math.max(0, items.length - 1));
    entries = items.map((item, index) => {
      let entry = previous.get(item.id);
      previous.delete(item.id);
      if (entry && !!entry.item.href !== !!item.href) {
        entry.el.remove();
        entry = undefined;
      }
      entry = entry ?? createEntry(item);
      entry.item = item;
      renderEntry(entry, index);
      root.append(entry.el);
      return entry;
    });
    for (const stale of previous.values()) {
      stale.animation?.cancel();
      stale.el.remove();
    }
  }

  function targetSize(entry: Entry, index: number): number {
    if (motionOff() || s.magnification === 1) return s.baseSize;
    if (pointer) {
      const rect = entry.el.getBoundingClientRect();
      const offset = vertical()
        ? pointer.y - (rect.top + rect.height / 2)
        : pointer.x - (rect.left + rect.width / 2);
      return magnifiedSize(offset, s);
    }
    if (keyboardFocus !== null)
      return magnifiedSize((index - keyboardFocus) * (s.baseSize + s.gap), s);
    return s.baseSize;
  }

  function tick(now: number) {
    // Frame-rate independent lerp
    const k = 1 - Math.pow(1 - motion.lerp, Math.min(4, (now - last) / 16.67 || 1));
    last = now;
    let moving = false;
    entries.forEach((entry, index) => {
      const target = targetSize(entry, index);
      const size = entry.size ?? s.baseSize;
      let next = size + (target - size) * k;
      if (Math.abs(target - next) < motion.settle) next = target;
      else moving = true;
      if (next === s.baseSize && target === s.baseSize) {
        entry.size = null;
        entry.el.style.removeProperty(SIZE_VAR);
      } else {
        entry.size = next;
        entry.el.style.setProperty(SIZE_VAR, `${next}px`);
      }
    });
    frame = moving ? requestAnimationFrame(tick) : 0;
  }

  function animate() {
    if (frame) return;
    last = performance.now();
    frame = requestAnimationFrame(tick);
  }

  function bounce(entry: Entry) {
    if (!s.bounce || motionOff() || typeof entry.icon.animate !== "function") return;
    entry.animation?.cancel();
    entry.animation = entry.icon.animate(bounceFrames[s.position], {
      duration: motion.bounceMs,
      easing: "ease-out",
    });
  }

  function setFocusIndex(index: number) {
    focusIndex = index;
    entries.forEach((entry, i) => (entry.el.tabIndex = i === index ? 0 : -1));
  }

  function focusItem(index: number) {
    const entry = entries[index];
    if (!entry) return;
    setFocusIndex(index);
    entry.el.focus();
  }

  const indexOf = (target: EventTarget | null) => {
    const el = target instanceof Element ? target.closest<HTMLElement>("[data-index]") : null;
    return el && root.contains(el) ? Number(el.dataset.index) : -1;
  };

  function onPointerMove(e: PointerEvent) {
    pointer = { x: e.clientX, y: e.clientY };
    animate();
  }
  function onPointerLeave() {
    pointer = null;
    animate();
  }
  function onClick(e: MouseEvent) {
    const index = indexOf(e.target);
    const entry = entries[index];
    if (!entry) return;
    setFocusIndex(index);
    bounce(entry);
    current.onSelect?.(entry.item, index);
  }
  function onKeyDown(e: KeyboardEvent) {
    const index = indexOf(e.target);
    if (index < 0) return;
    if (e.key === " " && entries[index].el instanceof HTMLAnchorElement) {
      e.preventDefault();
      entries[index].el.click();
      return;
    }
    const next = nextIndex(e.key, index, entries.length, vertical());
    if (next === null) return;
    e.preventDefault();
    focusItem(next);
  }
  function onFocusIn(e: FocusEvent) {
    const index = indexOf(e.target);
    if (index < 0) return;
    setFocusIndex(index);
    const el = entries[index].el;
    keyboardFocus = el.matches(":focus-visible") ? index : null;
    animate();
  }
  function onFocusOut(e: FocusEvent) {
    if (e.relatedTarget instanceof Node && root.contains(e.relatedTarget)) return;
    keyboardFocus = null;
    animate();
  }
  const onMotionChange = () => animate();

  root.addEventListener("pointermove", onPointerMove);
  root.addEventListener("pointerleave", onPointerLeave);
  root.addEventListener("click", onClick);
  root.addEventListener("keydown", onKeyDown);
  root.addEventListener("focusin", onFocusIn);
  root.addEventListener("focusout", onFocusOut);
  reduced.addEventListener("change", onMotionChange);

  renderRoot();
  renderItems();

  return {
    element: root,
    update(partial) {
      current = { ...current, ...partial };
      s = resolveSettings(current);
      if ("items" in partial) items = sanitizeItems(current.items);
      renderRoot();
      renderItems();
      animate();
    },
    setItems(next) {
      current = { ...current, items: next };
      items = sanitizeItems(next);
      renderItems();
      animate();
    },
    focusItem,
    destroy() {
      cancelAnimationFrame(frame);
      frame = 0;
      root.removeEventListener("pointermove", onPointerMove);
      root.removeEventListener("pointerleave", onPointerLeave);
      root.removeEventListener("click", onClick);
      root.removeEventListener("keydown", onKeyDown);
      root.removeEventListener("focusin", onFocusIn);
      root.removeEventListener("focusout", onFocusOut);
      reduced.removeEventListener("change", onMotionChange);
      for (const entry of entries) entry.animation?.cancel();
      entries = [];
      root.remove();
    },
  };
}
