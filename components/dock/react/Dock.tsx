"use client";

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type Ref,
} from "react";
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
} from "./dock.config";

export interface DockHandle {
  /** Replaces the items until the `items` prop changes again */
  setItems(items: DockItem[]): void;
  focusItem(index: number): void;
}

export type DockProps = DockOptions & {
  className?: string;
  style?: CSSProperties;
  ref?: Ref<DockHandle>;
};

const SIZE_VAR = "--ux-dock-item-size";

export function Dock({ className, style, ref, ...options }: DockProps) {
  const settings = resolveSettings(options);
  const [override, setOverride] = useState<{ source: unknown; items: DockItem[] } | null>(null);
  const items = sanitizeItems(
    override && override.source === options.items ? override.items : options.items,
  );
  const [focusIndex, setFocusIndex] = useState(0);
  const activeIndex = Math.min(focusIndex, Math.max(0, items.length - 1));
  const vertical = settings.position === "left" || settings.position === "right";

  const latest = useRef({ settings, items, vertical, onSelect: options.onSelect });
  latest.current = { settings, items, vertical, onSelect: options.onSelect };

  const itemEls = useRef<(HTMLElement | null)[]>([]);
  const iconEls = useRef<(HTMLSpanElement | null)[]>([]);
  const sizes = useRef(new Map<string, number>());
  const animations = useRef(new Map<string, Animation>());
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const keyboardFocus = useRef<number | null>(null);
  const reduced = useRef(false);
  const frame = useRef(0);
  const last = useRef(0);

  const motionOff = () => latest.current.settings.respectReducedMotion && reduced.current;

  const targetSize = useCallback((el: HTMLElement, index: number) => {
    const { settings: s, vertical: v } = latest.current;
    if ((s.respectReducedMotion && reduced.current) || s.magnification === 1) return s.baseSize;
    if (pointer.current) {
      const rect = el.getBoundingClientRect();
      const offset = v
        ? pointer.current.y - (rect.top + rect.height / 2)
        : pointer.current.x - (rect.left + rect.width / 2);
      return magnifiedSize(offset, s);
    }
    if (keyboardFocus.current !== null)
      return magnifiedSize((index - keyboardFocus.current) * (s.baseSize + s.gap), s);
    return s.baseSize;
  }, []);

  const tick = useCallback(
    (now: number) => {
      const { settings: s, items: list } = latest.current;
      // Frame-rate independent lerp
      const k = 1 - Math.pow(1 - motion.lerp, Math.min(4, (now - last.current) / 16.67 || 1));
      last.current = now;
      let moving = false;
      list.forEach((item, index) => {
        const el = itemEls.current[index];
        if (!el) return;
        const target = targetSize(el, index);
        const size = sizes.current.get(item.id) ?? s.baseSize;
        let next = size + (target - size) * k;
        if (Math.abs(target - next) < motion.settle) next = target;
        else moving = true;
        if (next === s.baseSize && target === s.baseSize) {
          sizes.current.delete(item.id);
          el.style.removeProperty(SIZE_VAR);
        } else {
          sizes.current.set(item.id, next);
          el.style.setProperty(SIZE_VAR, `${next}px`);
        }
      });
      frame.current = moving ? requestAnimationFrame(tick) : 0;
    },
    [targetSize],
  );

  const animate = useCallback(() => {
    if (frame.current) return;
    last.current = performance.now();
    frame.current = requestAnimationFrame(tick);
  }, [tick]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduced.current = query.matches;
    const onChange = () => {
      reduced.current = query.matches;
      animate();
    };
    query.addEventListener("change", onChange);
    const running = animations.current;
    return () => {
      query.removeEventListener("change", onChange);
      cancelAnimationFrame(frame.current);
      frame.current = 0;
      for (const animation of running.values()) animation.cancel();
    };
  }, [animate]);

  // Settings or items changed: let sizes converge to the new targets
  useEffect(() => {
    animate();
  });

  const focusItem = useCallback((index: number) => {
    const el = itemEls.current[index];
    if (!el) return;
    setFocusIndex(index);
    el.focus();
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      setItems: (next) => setOverride({ source: options.items, items: next }),
      focusItem,
    }),
    [focusItem, options.items],
  );

  function bounce(item: DockItem, index: number) {
    const icon = iconEls.current[index];
    if (!settings.bounce || motionOff() || !icon || typeof icon.animate !== "function") return;
    animations.current.get(item.id)?.cancel();
    animations.current.set(
      item.id,
      icon.animate(bounceFrames[settings.position], {
        duration: motion.bounceMs,
        easing: "ease-out",
      }),
    );
  }

  function select(item: DockItem, index: number) {
    setFocusIndex(index);
    bounce(item, index);
    latest.current.onSelect?.(item, index);
  }

  function onKeyDown(e: KeyboardEvent<HTMLElement>, index: number) {
    if (e.key === " " && e.currentTarget instanceof HTMLAnchorElement) {
      e.preventDefault();
      e.currentTarget.click();
      return;
    }
    const next = nextIndex(e.key, index, items.length, vertical);
    if (next === null) return;
    e.preventDefault();
    focusItem(next);
  }

  const rootStyle = { ...settings.tokens, ...style } as CSSProperties;
  const tooltipClass =
    settings.labels === "none"
      ? ""
      : `${classes.tooltip} ${tooltipSide[settings.position]} ${tooltipVisibility[settings.labels]}`;
  const indicatorClass = `${classes.indicator} ${indicatorSide[settings.position]}`;

  return (
    <div
      role="toolbar"
      aria-label={settings.label}
      aria-orientation={vertical ? "vertical" : "horizontal"}
      className={className ? `${roots[settings.position]} ${className}` : roots[settings.position]}
      style={rootStyle}
      onPointerMove={(e) => {
        pointer.current = { x: e.clientX, y: e.clientY };
        animate();
      }}
      onPointerLeave={() => {
        pointer.current = null;
        animate();
      }}
      onBlur={(e) => {
        if (e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget)) return;
        keyboardFocus.current = null;
        animate();
      }}
    >
      {items.map((item, index) => {
        const badge = badgeText(item.badge);
        const content = (
          <>
            <span
              ref={(el) => {
                iconEls.current[index] = el;
              }}
              className={classes.icon}
              aria-hidden="true"
            >
              {options.renderIcon?.(item) ?? item.icon}
            </span>
            {badge !== null ? (
              <span className={classes.badge} aria-hidden="true">
                {badge}
              </span>
            ) : null}
            {settings.labels !== "none" ? (
              <span className={tooltipClass} aria-hidden="true">
                {item.label}
              </span>
            ) : null}
            {settings.indicator && item.active ? (
              <span className={indicatorClass} aria-hidden="true" />
            ) : null}
          </>
        );
        const common = {
          className: classes.item,
          tabIndex: index === activeIndex ? 0 : -1,
          "aria-label": item.label,
          onClick: () => select(item, index),
          onKeyDown: (e: KeyboardEvent<HTMLElement>) => onKeyDown(e, index),
          onFocus: (e: { currentTarget: HTMLElement }) => {
            setFocusIndex(index);
            keyboardFocus.current = e.currentTarget.matches(":focus-visible") ? index : null;
            animate();
          },
          ref: (el: HTMLElement | null) => {
            itemEls.current[index] = el;
          },
        };
        return item.href ? (
          <a
            key={item.id}
            href={item.href}
            aria-current={item.active ? "page" : undefined}
            {...common}
          >
            {content}
          </a>
        ) : (
          <button
            key={item.id}
            type="button"
            aria-current={item.active ? "true" : undefined}
            {...common}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}

export default Dock;
