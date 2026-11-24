import {
  classes,
  orientationToPointer,
  pointerVars,
  resolveSettings,
  resolveTokens,
  type InteractiveCardOptions,
  type InteractiveCardSettings,
} from "./interactive-card.config";

export type InteractiveCardVanillaOptions = InteractiveCardOptions & {
  /** Card content; when omitted the container's existing children are moved into the card */
  content?: string | Node;
  /** Extra classes for the root element */
  className?: string;
};

export interface InteractiveCardInstance {
  update(partial: InteractiveCardVanillaOptions): void;
  /** Eases the card back to rest immediately */
  reset(): void;
  destroy(): void;
  readonly element: HTMLElement;
}

type OrientationCtor = { requestPermission?: () => Promise<string> };

export function createInteractiveCard(
  container: HTMLElement,
  options: InteractiveCardVanillaOptions = {},
): InteractiveCardInstance {
  let current: InteractiveCardVanillaOptions = { ...options };
  let s: InteractiveCardSettings = resolveSettings(current);

  // Children the card adopted from the container; given back on destroy
  const adopted = options.content === undefined ? Array.from(container.childNodes) : [];

  const root = document.createElement("div");
  const card = document.createElement("div");
  const spotlight = document.createElement("div");
  const content = document.createElement("div");
  const glare = document.createElement("div");
  const border = document.createElement("div");
  const borderGlow = document.createElement("div");
  card.className = classes.card;
  spotlight.className = classes.spotlight;
  content.className = classes.content;
  glare.className = classes.glare;
  border.className = classes.border;
  borderGlow.className = classes.borderGlow;
  for (const el of [spotlight, glare, border, borderGlow]) el.setAttribute("aria-hidden", "true");
  card.append(spotlight, content, glare, border, borderGlow);
  root.append(card);
  container.append(root);

  const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const coarseQuery = window.matchMedia("(pointer: coarse)");
  const pointer = { px: 0.5, py: 0.5 };
  let pointerActive = false;
  let focusActive = false;
  let frame = 0;
  let gyroOn = false;
  let permissionAsked = false;

  const reduced = () => s.respectReducedMotion && reducedQuery.matches;
  const canTilt = () => s.effect !== "spotlight" && !reduced();

  function apply() {
    frame = 0;
    const active = !s.disabled && (pointerActive || focusActive);
    const centered = reduced() || (!pointerActive && focusActive);
    const p = centered ? { px: 0.5, py: 0.5 } : pointer;
    const vars = pointerVars(s, { ...p, active, tilt: pointerActive && canTilt() });
    for (const [name, value] of Object.entries(vars)) card.style.setProperty(name, value);
    root.dataset.active = String(active);
  }

  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(apply);
  };

  function render() {
    root.className = current.className ? `${classes.root} ${current.className}` : classes.root;
    root.removeAttribute("style");
    for (const [name, value] of Object.entries(resolveTokens(s)))
      root.style.setProperty(name, value);
    if (s.focusable) root.tabIndex = 0;
    else root.removeAttribute("tabindex");
    if (s.disabled) root.setAttribute("aria-disabled", "true");
    else root.removeAttribute("aria-disabled");
    spotlight.hidden = s.effect === "tilt";
    glare.hidden = !s.glare || !canTilt();
    borderGlow.hidden = !s.borderGlow;
    syncGyroscope();
    apply();
  }

  function setContent(value: string | Node | undefined) {
    content.replaceChildren();
    if (value === undefined) content.append(...adopted);
    else if (typeof value === "string") content.textContent = value;
    else content.append(value);
  }

  function rest() {
    pointerActive = false;
    if (frame) cancelAnimationFrame(frame);
    apply();
  }

  function onPointerMove(e: PointerEvent) {
    if (s.disabled) return;
    const rect = root.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    pointer.px = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    pointer.py = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    pointerActive = true;
    schedule();
  }

  const onPointerLeave = () => rest();
  // Touch / pen: there is no hover, so the card rests as soon as the finger lifts
  const onPointerEnd = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") rest();
  };

  function onPointerDown() {
    const ctor = (window as unknown as { DeviceOrientationEvent?: OrientationCtor })
      .DeviceOrientationEvent;
    // iOS asks for motion permission, and only inside a user gesture
    if (!gyroOn || permissionAsked || typeof ctor?.requestPermission !== "function") return;
    permissionAsked = true;
    ctor.requestPermission().catch(() => undefined);
  }

  function onFocusIn(e: FocusEvent) {
    let visible = true;
    try {
      visible = (e.target as Element).matches(":focus-visible");
    } catch {
      // Old browsers without :focus-visible: treat every focus as visible
    }
    if (!visible) return;
    focusActive = true;
    schedule();
  }

  function onFocusOut(e: FocusEvent) {
    if (e.relatedTarget instanceof Node && root.contains(e.relatedTarget)) return;
    focusActive = false;
    schedule();
  }

  function onOrientation(e: DeviceOrientationEvent) {
    if (s.disabled || e.beta === null || e.gamma === null) return;
    Object.assign(pointer, orientationToPointer(e.beta, e.gamma));
    pointerActive = true;
    schedule();
  }

  function syncGyroscope() {
    const want =
      s.gyroscope && !s.disabled && coarseQuery.matches && "DeviceOrientationEvent" in window;
    if (want === gyroOn) return;
    gyroOn = want;
    if (want) window.addEventListener("deviceorientation", onOrientation);
    else {
      window.removeEventListener("deviceorientation", onOrientation);
      pointerActive = false;
    }
  }

  const onMediaChange = () => render();

  root.addEventListener("pointermove", onPointerMove);
  root.addEventListener("pointerleave", onPointerLeave);
  root.addEventListener("pointerup", onPointerEnd);
  root.addEventListener("pointercancel", onPointerEnd);
  root.addEventListener("pointerdown", onPointerDown);
  root.addEventListener("focusin", onFocusIn);
  root.addEventListener("focusout", onFocusOut);
  reducedQuery.addEventListener("change", onMediaChange);
  coarseQuery.addEventListener("change", onMediaChange);

  setContent(options.content);
  render();

  return {
    element: root,
    update(partial) {
      const contentChanged = "content" in partial && partial.content !== current.content;
      current = { ...current, ...partial };
      s = resolveSettings(current);
      if (contentChanged) setContent(current.content);
      if (s.disabled) {
        pointerActive = false;
        focusActive = false;
      }
      render();
    },
    reset() {
      focusActive = false;
      rest();
    },
    destroy() {
      if (frame) cancelAnimationFrame(frame);
      root.removeEventListener("pointermove", onPointerMove);
      root.removeEventListener("pointerleave", onPointerLeave);
      root.removeEventListener("pointerup", onPointerEnd);
      root.removeEventListener("pointercancel", onPointerEnd);
      root.removeEventListener("pointerdown", onPointerDown);
      root.removeEventListener("focusin", onFocusIn);
      root.removeEventListener("focusout", onFocusOut);
      reducedQuery.removeEventListener("change", onMediaChange);
      coarseQuery.removeEventListener("change", onMediaChange);
      window.removeEventListener("deviceorientation", onOrientation);
      root.remove();
      container.append(...adopted);
    },
  };
}
