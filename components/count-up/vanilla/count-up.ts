import {
  classes,
  defaults,
  easings,
  formatNumber,
  formatText,
  resolveSettings,
  resolveTokens,
  type CountUpOptions,
  type CountUpSettings,
} from "./count-up.config";

export interface CountUpInstance {
  /** Merges options; a new `to` (or a plain number) animates from the shown value to it */
  update(partial: CountUpOptions | number): void;
  /** Runs the animation from `from` to `to` (honours `delay`) */
  start(): void;
  /** Stops and shows `from`; an inView trigger is armed again (mount/manual wait for start()) */
  reset(): void;
  /** The value currently shown */
  readonly value: number;
  readonly element: HTMLElement;
  destroy(): void;
}

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

export function createCountUp(
  container: HTMLElement,
  options: CountUpOptions = {},
): CountUpInstance {
  let current: CountUpOptions = { ...defaults, ...options };
  let settings: CountUpSettings = resolveSettings(current);

  let display = settings.from;
  let started = false;
  let raf = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let observer: IntersectionObserver | null = null;

  const srEl = document.createElement("span");
  srEl.className = classes.srOnly;
  const displayEl = document.createElement("span");
  displayEl.className = classes.display;
  displayEl.setAttribute("aria-hidden", "true");
  const prefixEl = document.createElement("span");
  prefixEl.className = classes.affix;
  const valueEl = document.createElement("span");
  const suffixEl = document.createElement("span");
  suffixEl.className = classes.affix;
  displayEl.append(prefixEl, valueEl, suffixEl);

  let root = buildRoot(settings.as);
  container.append(root);

  function buildRoot(tag: string): HTMLElement {
    const el = document.createElement(tag);
    el.className = classes.root;
    el.append(srEl, displayEl);
    return el;
  }

  function paintTokens() {
    root.removeAttribute("style");
    for (const [name, value] of Object.entries(resolveTokens(current)))
      root.style.setProperty(name, value);
  }

  function paintValue() {
    valueEl.textContent = formatNumber(display, settings);
  }

  function paintStatic() {
    prefixEl.textContent = settings.prefix;
    prefixEl.hidden = !settings.prefix;
    suffixEl.textContent = settings.suffix;
    suffixEl.hidden = !settings.suffix;
    if (settings.ariaLive) srEl.setAttribute("aria-live", "polite");
    else srEl.removeAttribute("aria-live");
    // Without aria-live the final value is exposed right away; with it, it is written on completion
    if (!settings.ariaLive) srEl.textContent = formatText(settings.to, settings);
    else if (!srEl.textContent) srEl.textContent = formatText(display, settings);
    paintValue();
  }

  function cancel() {
    cancelAnimationFrame(raf);
    raf = 0;
    clearTimeout(timer);
    timer = undefined;
  }

  function complete() {
    display = settings.to;
    paintValue();
    srEl.textContent = formatText(settings.to, settings);
    settings.onComplete?.(settings.to);
  }

  function animate(fromValue: number, withDelay: boolean) {
    cancel();
    const reduced =
      settings.respectReducedMotion && window.matchMedia?.(REDUCED_MOTION).matches === true;
    if (reduced || settings.duration === 0) {
      complete();
      return;
    }
    const run = () => {
      const t0 = performance.now();
      const ms = settings.duration * 1000;
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / ms);
        if (t >= 1) {
          raf = 0;
          complete();
          return;
        }
        display = fromValue + (settings.to - fromValue) * easings[settings.easing](t);
        paintValue();
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    if (withDelay && settings.delay > 0) timer = setTimeout(run, settings.delay * 1000);
    else run();
  }

  function start() {
    started = true;
    animate(settings.from, true);
  }

  function rest() {
    cancel();
    started = false;
    display = settings.from;
    if (settings.ariaLive) srEl.textContent = formatText(display, settings);
    paintValue();
  }

  function teardownTrigger() {
    observer?.disconnect();
    observer = null;
  }

  function setupTrigger() {
    teardownTrigger();
    if (settings.trigger === "mount") {
      if (!started) start();
      return;
    }
    if (settings.trigger !== "inView" || (started && settings.once)) return;
    if (typeof IntersectionObserver === "undefined") {
      if (!started) start();
      return;
    }
    observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (entry.isIntersecting) {
          if (started && settings.once) return;
          start();
          if (settings.once) teardownTrigger();
        } else if (!settings.once && started) {
          rest();
        }
      },
      { threshold: settings.threshold },
    );
    observer.observe(root);
  }

  function retarget() {
    // Before the first run only the target changes; afterwards it animates from the shown value
    if (started) animate(display, false);
  }

  paintTokens();
  paintStatic();
  setupTrigger();

  return {
    update(partial) {
      const next = typeof partial === "number" ? { to: partial } : partial;
      const prev = settings;
      current = { ...current, ...next };
      settings = resolveSettings(current);
      if (settings.as !== prev.as) {
        const nextRoot = buildRoot(settings.as);
        root.replaceWith(nextRoot);
        root = nextRoot;
      }
      if (!started) display = settings.from;
      paintTokens();
      paintStatic();
      if (
        settings.as !== prev.as ||
        settings.trigger !== prev.trigger ||
        settings.once !== prev.once ||
        settings.threshold !== prev.threshold
      )
        setupTrigger();
      if (settings.to !== prev.to) retarget();
    },
    start,
    reset() {
      rest();
      if (settings.trigger === "inView") setupTrigger();
    },
    get value() {
      return display;
    },
    get element() {
      return root;
    },
    destroy() {
      cancel();
      teardownTrigger();
      root.remove();
    },
  };
}
