"use client";

import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type Ref,
} from "react";
import {
  classes,
  orientationToPointer,
  pointerVars,
  resolveSettings,
  resolveTokens,
  type InteractiveCardOptions,
} from "./interactive-card.config";

export interface InteractiveCardHandle {
  /** Eases the card back to rest immediately */
  reset(): void;
}

export type InteractiveCardProps = InteractiveCardOptions & {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  ref?: Ref<InteractiveCardHandle>;
};

type OrientationCtor = { requestPermission?: () => Promise<string> };

/** Subscribes to a media query; false during SSR and the first client render */
function useMedia(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const sync = () => setMatches(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [query]);
  return matches;
}

export function InteractiveCard({
  children,
  className,
  style,
  ref,
  ...options
}: InteractiveCardProps) {
  const s = resolveSettings(options);
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useMedia("(prefers-reduced-motion: reduce)");
  const coarse = useMedia("(pointer: coarse)");
  const reduced = s.respectReducedMotion && prefersReduced;
  const canTilt = s.effect !== "spotlight" && !reduced;

  // Mutable pointer state lives outside React: it changes every frame
  const state = useRef({ px: 0.5, py: 0.5, pointer: false, focus: false, frame: 0 });
  const latest = useRef({ s, reduced, canTilt });
  latest.current = { s, reduced, canTilt };

  const apply = useRef(() => {
    const st = state.current;
    st.frame = 0;
    const { s: cur, reduced: red, canTilt: tilt } = latest.current;
    const root = rootRef.current;
    const card = cardRef.current;
    if (!root || !card) return;
    const active = !cur.disabled && (st.pointer || st.focus);
    const centered = red || (!st.pointer && st.focus);
    const p = centered ? { px: 0.5, py: 0.5 } : { px: st.px, py: st.py };
    const vars = pointerVars(cur, { ...p, active, tilt: st.pointer && tilt });
    for (const [name, value] of Object.entries(vars)) card.style.setProperty(name, value);
    root.dataset.active = String(active);
  }).current;

  const schedule = useRef(() => {
    if (!state.current.frame) state.current.frame = requestAnimationFrame(apply);
  }).current;

  const rest = useRef(() => {
    const st = state.current;
    st.pointer = false;
    if (st.frame) cancelAnimationFrame(st.frame);
    apply();
  }).current;

  // Pointer, touch and focus listeners — attached once, they read the latest settings
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const st = state.current;
    let permissionAsked = false;

    const onPointerMove = (e: PointerEvent) => {
      if (latest.current.s.disabled) return;
      const rect = root.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      st.px = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      st.py = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
      st.pointer = true;
      schedule();
    };
    // Touch / pen: there is no hover, so the card rests as soon as the finger lifts
    const onPointerEnd = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") rest();
    };
    const onPointerDown = () => {
      const ctor = (window as unknown as { DeviceOrientationEvent?: OrientationCtor })
        .DeviceOrientationEvent;
      // iOS asks for motion permission, and only inside a user gesture
      if (!latest.current.s.gyroscope || permissionAsked) return;
      if (typeof ctor?.requestPermission !== "function") return;
      permissionAsked = true;
      ctor.requestPermission().catch(() => undefined);
    };
    const onFocusIn = (e: FocusEvent) => {
      let visible = true;
      try {
        visible = (e.target as Element).matches(":focus-visible");
      } catch {
        // Old browsers without :focus-visible: treat every focus as visible
      }
      if (!visible) return;
      st.focus = true;
      schedule();
    };
    const onFocusOut = (e: FocusEvent) => {
      if (e.relatedTarget instanceof Node && root.contains(e.relatedTarget)) return;
      st.focus = false;
      schedule();
    };

    root.addEventListener("pointermove", onPointerMove);
    root.addEventListener("pointerleave", rest);
    root.addEventListener("pointerup", onPointerEnd);
    root.addEventListener("pointercancel", onPointerEnd);
    root.addEventListener("pointerdown", onPointerDown);
    root.addEventListener("focusin", onFocusIn);
    root.addEventListener("focusout", onFocusOut);
    return () => {
      if (st.frame) cancelAnimationFrame(st.frame);
      st.frame = 0;
      root.removeEventListener("pointermove", onPointerMove);
      root.removeEventListener("pointerleave", rest);
      root.removeEventListener("pointerup", onPointerEnd);
      root.removeEventListener("pointercancel", onPointerEnd);
      root.removeEventListener("pointerdown", onPointerDown);
      root.removeEventListener("focusin", onFocusIn);
      root.removeEventListener("focusout", onFocusOut);
    };
  }, [apply, rest, schedule]);

  // Gyroscope tilt on touch devices
  const gyro = s.gyroscope && !s.disabled && coarse;
  useEffect(() => {
    if (!gyro || !("DeviceOrientationEvent" in window)) return;
    const st = state.current;
    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta === null || e.gamma === null) return;
      Object.assign(st, orientationToPointer(e.beta, e.gamma));
      st.pointer = true;
      schedule();
    };
    window.addEventListener("deviceorientation", onOrientation);
    return () => {
      window.removeEventListener("deviceorientation", onOrientation);
      st.pointer = false;
      apply();
    };
  }, [gyro, apply, schedule]);

  // Every settings change reaches the pointer variables without remounting
  useEffect(() => {
    if (s.disabled) {
      state.current.pointer = false;
      state.current.focus = false;
    }
    apply();
  });

  useImperativeHandle(
    ref,
    () => ({
      reset() {
        state.current.focus = false;
        rest();
      },
    }),
    [rest],
  );

  return (
    <div
      ref={rootRef}
      className={className ? `${classes.root} ${className}` : classes.root}
      style={{ ...(resolveTokens(s) as CSSProperties), ...style }}
      tabIndex={s.focusable ? 0 : undefined}
      aria-disabled={s.disabled || undefined}
    >
      <div ref={cardRef} className={classes.card}>
        <div className={classes.spotlight} aria-hidden="true" hidden={s.effect === "tilt"} />
        <div className={classes.content}>{children}</div>
        <div className={classes.glare} aria-hidden="true" hidden={!s.glare || !canTilt} />
        <div className={classes.border} aria-hidden="true" />
        <div className={classes.borderGlow} aria-hidden="true" hidden={!s.borderGlow} />
      </div>
    </div>
  );
}

export default InteractiveCard;
