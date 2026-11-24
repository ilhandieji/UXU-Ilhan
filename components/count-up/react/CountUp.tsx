"use client";

import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type Ref,
} from "react";
import {
  classes,
  easings,
  formatNumber,
  formatText,
  resolveSettings,
  resolveTokens,
  type CountUpOptions,
  type CountUpSettings,
} from "./count-up.config";

export interface CountUpHandle {
  /** Runs the animation from `from` to `to` (honours `delay`) */
  start(): void;
  /** Stops and shows `from`; an inView trigger is armed again (mount/manual wait for start()) */
  reset(): void;
  /** Animates from the shown value to a new target */
  update(to: number): void;
  /** The value currently shown */
  readonly value: number;
}

export type CountUpProps = CountUpOptions & {
  className?: string;
  style?: CSSProperties;
  ref?: Ref<CountUpHandle>;
};

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

type Elements = {
  root: HTMLElement | null;
  value: HTMLSpanElement | null;
  sr: HTMLSpanElement | null;
};

/** Imperative rAF loop; reads settings and elements lazily so prop changes apply without remounting */
function createController(getSettings: () => CountUpSettings, els: Elements) {
  let display = getSettings().from;
  let started = false;
  let target: number | null = null;
  let raf = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let observer: IntersectionObserver | null = null;

  const s = (): CountUpSettings => {
    const settings = getSettings();
    return target === null ? settings : { ...settings, to: target };
  };

  function paintValue() {
    if (els.value) els.value.textContent = formatNumber(display, s());
  }

  function paint() {
    const settings = s();
    if (!started) display = settings.from;
    paintValue();
    if (!els.sr) return;
    // Without aria-live the final value is exposed right away; with it, it is written on completion
    if (!settings.ariaLive) els.sr.textContent = formatText(settings.to, settings);
    else if (!els.sr.textContent) els.sr.textContent = formatText(display, settings);
  }

  function cancel() {
    cancelAnimationFrame(raf);
    raf = 0;
    clearTimeout(timer);
    timer = undefined;
  }

  function complete() {
    const settings = s();
    display = settings.to;
    paintValue();
    if (els.sr) els.sr.textContent = formatText(settings.to, settings);
    settings.onComplete?.(settings.to);
  }

  function animate(fromValue: number, withDelay: boolean) {
    cancel();
    const settings = s();
    const reduced =
      settings.respectReducedMotion && window.matchMedia?.(REDUCED_MOTION).matches === true;
    if (reduced || settings.duration === 0) {
      complete();
      return;
    }
    const run = () => {
      const t0 = performance.now();
      const step = (now: number) => {
        const current = s();
        const t = Math.min(1, (now - t0) / (current.duration * 1000));
        if (t >= 1) {
          raf = 0;
          complete();
          return;
        }
        display = fromValue + (current.to - fromValue) * easings[current.easing](t);
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
    animate(s().from, true);
  }

  function rest() {
    cancel();
    started = false;
    display = s().from;
    if (els.sr && s().ariaLive) els.sr.textContent = formatText(display, s());
    paintValue();
  }

  function teardownTrigger() {
    observer?.disconnect();
    observer = null;
  }

  function setupTrigger() {
    teardownTrigger();
    const settings = s();
    if (settings.trigger === "mount") {
      if (!started) start();
      return;
    }
    if (settings.trigger !== "inView" || (started && settings.once) || !els.root) return;
    if (typeof IntersectionObserver === "undefined") {
      if (!started) start();
      return;
    }
    observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        const once = s().once;
        if (entry.isIntersecting) {
          if (started && once) return;
          start();
          if (once) teardownTrigger();
        } else if (!once && started) {
          rest();
        }
      },
      { threshold: settings.threshold },
    );
    observer.observe(els.root);
  }

  return {
    paint,
    start,
    setupTrigger,
    teardownTrigger,
    /** `to` = null clears an imperative target (a new `to` prop wins) */
    retarget(to: number | null) {
      target = to;
      paint();
      // Before the first run only the target changes; afterwards it animates from the shown value
      if (started) animate(display, false);
    },
    reset() {
      rest();
      if (s().trigger === "inView") setupTrigger();
    },
    get value() {
      return display;
    },
    destroy() {
      cancel();
      teardownTrigger();
    },
  };
}

type Controller = ReturnType<typeof createController>;

export function CountUp({ theme, size, className, style, ref, ...options }: CountUpProps) {
  const settings = resolveSettings(options);
  const latest = useRef(settings);
  latest.current = settings;

  const els = useRef<Elements>({ root: null, value: null, sr: null });
  const ctrl = useRef<Controller | null>(null);
  // Rendered once; later frames are written straight to the DOM so React never re-renders per frame
  const [initial] = useState(() => ({
    value: formatNumber(settings.from, settings),
    sr: settings.ariaLive ? formatText(settings.from, settings) : formatText(settings.to, settings),
  }));

  useEffect(() => {
    const controller = createController(() => latest.current, els.current);
    ctrl.current = controller;
    return () => {
      controller.destroy();
      ctrl.current = null;
    };
  }, []);

  const { trigger, once, threshold, as } = settings;
  useEffect(() => {
    const controller = ctrl.current;
    controller?.setupTrigger();
    return () => controller?.teardownTrigger();
  }, [trigger, once, threshold, as]);

  const prevTo = useRef(settings.to);
  useEffect(() => {
    if (prevTo.current === settings.to) return;
    prevTo.current = settings.to;
    ctrl.current?.retarget(null);
  }, [settings.to]);

  // Format options (locale, decimals, prefix, …) repaint the current value on every render
  useEffect(() => {
    ctrl.current?.paint();
  });

  useImperativeHandle(
    ref,
    () => ({
      start: () => ctrl.current?.start(),
      reset: () => ctrl.current?.reset(),
      update: (to: number) => ctrl.current?.retarget(Number.isFinite(to) ? to : null),
      get value() {
        return ctrl.current?.value ?? latest.current.from;
      },
    }),
    [],
  );

  const Tag = as as ElementType;
  const tokens = resolveTokens({ theme, size }) as CSSProperties;

  return (
    <Tag
      ref={(node: HTMLElement | null) => {
        els.current.root = node;
      }}
      className={className ? `${classes.root} ${className}` : classes.root}
      style={{ ...tokens, ...style }}
    >
      <span
        ref={(node: HTMLSpanElement | null) => {
          els.current.sr = node;
        }}
        className={classes.srOnly}
        aria-live={settings.ariaLive ? "polite" : undefined}
      >
        {initial.sr}
      </span>
      <span className={classes.display} aria-hidden="true">
        {settings.prefix ? <span className={classes.affix}>{settings.prefix}</span> : null}
        <span
          ref={(node: HTMLSpanElement | null) => {
            els.current.value = node;
          }}
        >
          {initial.value}
        </span>
        {settings.suffix ? <span className={classes.affix}>{settings.suffix}</span> : null}
      </span>
    </Tag>
  );
}

export default CountUp;
