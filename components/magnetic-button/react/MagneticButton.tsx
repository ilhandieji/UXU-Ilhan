"use client";

import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type HTMLAttributes,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type Ref,
} from "react";
import {
  classes,
  ICON_PATH,
  motionVars,
  resolveSettings,
  resolveTokens,
  toMs,
  type MagneticButtonOptions,
} from "./magnetic-button.config";

export interface MagneticButtonHandle {
  /** Snaps the button and its label back to rest immediately */
  reset(): void;
  /** The rendered <button> / <a> element */
  readonly element: HTMLButtonElement | HTMLAnchorElement | null;
}

type NativeProps = Omit<HTMLAttributes<HTMLElement>, "children"> &
  Pick<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "name" | "value" | "form"> &
  Pick<AnchorHTMLAttributes<HTMLAnchorElement>, "target" | "rel" | "download" | "hrefLang">;

export type MagneticButtonProps = MagneticButtonOptions &
  NativeProps & {
    /** Replaces `label` when given */
    children?: ReactNode;
    className?: string;
    style?: CSSProperties;
    ref?: Ref<MagneticButtonHandle>;
  };

interface MagnetConfig {
  active: boolean;
  strength: number;
  radius: number;
  textStrength: number;
  ease: number;
  returnDuration: number;
}

interface Magnet {
  refresh(): void;
  reset(): void;
  destroy(): void;
}

const FRAME_MS = 1000 / 60;

/** Pointer-follow loop: a window listener exists only while the magnet is active */
function createMagnet(el: HTMLElement, read: () => MagnetConfig): Magnet {
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
    const cfg = read();
    if (mode === "follow") {
      const k = 1 - Math.pow(1 - cfg.ease, dt / FRAME_MS);
      pos.x += (target.x - pos.x) * k;
      pos.y += (target.y - pos.y) * k;
      pos.lx += (target.lx - pos.lx) * k;
      pos.ly += (target.ly - pos.ly) * k;
    } else if (mode === "return") {
      const p = cfg.returnDuration > 0 ? Math.min(1, (now - returnStart) / cfg.returnDuration) : 1;
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
    const cfg = read();
    const rect = el.getBoundingClientRect();
    // The rect already includes the current offset; remove it to get the resting center
    const dx = e.clientX - (rect.left + rect.width / 2 - pos.x);
    const dy = e.clientY - (rect.top + rect.height / 2 - pos.y);
    const ex = Math.max(Math.abs(dx) - rect.width / 2, 0);
    const ey = Math.max(Math.abs(dy) - rect.height / 2, 0);
    if (Math.hypot(ex, ey) > cfg.radius) return release();
    target.x = dx * cfg.strength;
    target.y = dy * cfg.strength;
    target.lx = dx * cfg.textStrength;
    target.ly = dy * cfg.textStrength;
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

  return {
    refresh() {
      const active = read().active;
      listen(active);
      if (!active && mode !== "rest") reset();
    },
    reset,
    destroy() {
      listen(false);
      cancelAnimationFrame(raf);
      for (const name of Object.values(motionVars)) el.style.removeProperty(name);
    },
  };
}

/** Adds one ripple span to `layer`, centered on the click (or the middle for keyboard clicks) */
function spawnRipple(layer: HTMLElement, e: ReactMouseEvent<HTMLElement>, duration: number) {
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
  const animation = dot.animate(
    [
      { scale: "0", opacity: 1 },
      { scale: "1", opacity: 0 },
    ],
    { duration, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
  );
  animation.onfinish = animation.oncancel = () => dot.remove();
}

function Arrow() {
  return (
    <svg
      className={classes.icon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={ICON_PATH} />
    </svg>
  );
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reduced;
}

export function MagneticButton({
  theme,
  variant,
  size,
  tokens,
  as,
  href,
  label,
  ariaLabel,
  icon,
  strength,
  radius,
  textStrength,
  ease,
  returnDuration,
  scaleOnHover,
  ripple,
  disabled,
  respectReducedMotion,
  children,
  className,
  style,
  onClick,
  ref,
  ...native
}: MagneticButtonProps) {
  const settings = resolveSettings({
    theme,
    variant,
    size,
    tokens,
    as,
    href,
    label,
    ariaLabel,
    icon,
    strength,
    radius,
    textStrength,
    ease,
    returnDuration,
    scaleOnHover,
    ripple,
    disabled,
    respectReducedMotion,
  });
  const reduced = useReducedMotion();
  const still = settings.disabled || (settings.respectReducedMotion && reduced);
  const cssVars = resolveTokens(settings, still);

  const elRef = useRef<HTMLElement | null>(null);
  const layerRef = useRef<HTMLSpanElement>(null);
  const magnet = useRef<Magnet | null>(null);
  const latest = useRef<MagnetConfig>({ ...settings, active: !still });
  latest.current = { ...settings, active: !still };

  // The element changes when `as` changes, so the magnet is rebuilt for the new node
  useEffect(() => {
    if (!elRef.current) return;
    const m = createMagnet(elRef.current, () => latest.current);
    magnet.current = m;
    m.refresh();
    return () => {
      m.destroy();
      magnet.current = null;
    };
  }, [settings.as]);

  // Prop changes (disabled, reduced motion, …) toggle the listener without a remount
  useEffect(() => {
    magnet.current?.refresh();
  });

  useImperativeHandle(
    ref,
    () => ({
      reset: () => magnet.current?.reset(),
      get element() {
        return elRef.current as HTMLButtonElement | HTMLAnchorElement | null;
      },
    }),
    [],
  );

  const handleClick = (e: ReactMouseEvent<HTMLElement>) => {
    if (settings.disabled) {
      e.preventDefault();
      return;
    }
    if (settings.ripple && !still && layerRef.current)
      spawnRipple(layerRef.current, e, toMs(cssVars["--ux-magnetic-button-ripple-duration"], 600));
    onClick?.(e);
  };

  const content = children ?? settings.label;
  const inner = (
    <>
      <span ref={layerRef} className={classes.rippleLayer} aria-hidden="true" />
      <span className={classes.label}>
        {content !== "" ? <span className={classes.text}>{content}</span> : null}
        {settings.icon ? <Arrow /> : null}
      </span>
    </>
  );
  const shared = {
    className: className ? `${classes.root} ${className}` : classes.root,
    style: { ...(cssVars as CSSProperties), ...style },
    "aria-label": native["aria-label"] ?? (settings.ariaLabel || undefined),
    onClick: handleClick,
  };

  if (settings.as === "a") {
    const { type: _type, name: _name, value: _value, form: _form, ...anchor } = native;
    return (
      <a
        {...anchor}
        {...shared}
        ref={elRef as Ref<HTMLAnchorElement>}
        href={settings.disabled ? undefined : settings.href || undefined}
        aria-disabled={settings.disabled || undefined}
        tabIndex={settings.disabled ? -1 : native.tabIndex}
      >
        {inner}
      </a>
    );
  }

  const {
    target: _target,
    rel: _rel,
    download: _download,
    hrefLang: _hrefLang,
    ...button
  } = native;
  return (
    <button
      type="button"
      {...button}
      {...shared}
      ref={elRef as Ref<HTMLButtonElement>}
      disabled={settings.disabled}
    >
      {inner}
    </button>
  );
}

export default MagneticButton;
