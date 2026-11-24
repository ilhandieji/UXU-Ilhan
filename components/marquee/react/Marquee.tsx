"use client";

import {
  Children,
  Fragment,
  isValidElement,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type Ref,
} from "react";
import {
  axis,
  classes,
  icons,
  resolveSettings,
  resolveTokens,
  rotate,
  type MarqueeHandle,
  type MarqueeOptions,
} from "./marquee.config";
import { createMarqueeEngine, type MarqueeEngine } from "./marquee.engine";

export type { MarqueeHandle, MarqueeOptions } from "./marquee.config";

export type MarqueeProps = MarqueeOptions & {
  /** Used when `items` is empty; every top-level child becomes one item */
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  ref?: Ref<MarqueeHandle>;
};

const join = (...parts: (string | false | undefined)[]) => parts.filter(Boolean).join(" ");

export function Marquee({ children, className, style, ref, ...options }: MarqueeProps) {
  const settings = resolveSettings(options);
  const rootRef = useRef<HTMLElement>(null);
  const engine = useRef<MarqueeEngine | null>(null);
  const latest = useRef(settings);
  latest.current = settings;
  const [copies, setCopies] = useState<number[]>([]);
  const [isStatic, setIsStatic] = useState(false);
  const [paused, setPaused] = useState(settings.paused);

  useEffect(() => {
    if (!rootRef.current) return;
    const instance = createMarqueeEngine(rootRef.current, latest.current, {
      onCopies: (row, count) =>
        setCopies((prev) => {
          const next = [...prev];
          next[row] = count;
          return next;
        }),
      onStaticChange: setIsStatic,
      onPausedChange: setPaused,
    });
    engine.current = instance;
    setIsStatic(instance.isStatic);
    return () => {
      instance.destroy();
      engine.current = null;
    };
  }, []);

  // Props reach the running engine without a remount; refresh picks up re-rendered rows / copies
  useEffect(() => {
    engine.current?.update(settings);
    engine.current?.refresh();
  });

  useImperativeHandle(
    ref,
    () => ({
      pause: () => engine.current?.pause(),
      play: () => engine.current?.play(),
      toggle: () => engine.current?.toggle(),
      setSpeed: (speed) => engine.current?.setSpeed(speed),
    }),
    [],
  );

  const ax = axis(settings);
  const content: ReactNode[] = settings.items.length
    ? settings.items
    : Children.toArray(children).filter(
        (child) => isValidElement(child) || typeof child === "string" || typeof child === "number",
      );
  const viewportClass = join(
    isStatic ? classes.staticViewport[ax] : classes.viewport[ax],
    settings.fade && classes.fade[ax],
    settings.draggable && !isStatic && classes.drag[ax],
  );

  const renderItems = (list: ReactNode[]) =>
    list.map((item, i) => (
      <Fragment key={i}>
        <div className={classes.item[settings.variant]}>{item}</div>
        {settings.separator ? (
          <span className={classes.separator} aria-hidden="true">
            {settings.separator}
          </span>
        ) : null}
      </Fragment>
    ));

  return (
    <section
      ref={rootRef}
      aria-label={settings.label}
      className={join(classes.root, className)}
      style={{ ...(resolveTokens(settings) as CSSProperties), ...style }}
    >
      <div data-marquee-rows="" className={classes.rows[ax]}>
        {Array.from({ length: settings.rows }, (_, row) => {
          const list = rotate(content, row, settings.rows);
          const count = isStatic ? 1 : Math.max(1, copies[row] ?? settings.repeat);
          return (
            <div key={row} data-marquee-row="" className={viewportClass}>
              <div data-marquee-track="" className={classes.track[ax]}>
                {Array.from({ length: count }, (_, copy) => {
                  // Only the first copy of the first row is exposed to assistive tech and focus
                  const duplicate = row > 0 || copy > 0;
                  return (
                    <div
                      key={copy}
                      data-marquee-group=""
                      className={classes.group[ax]}
                      aria-hidden={duplicate || undefined}
                      inert={duplicate || undefined}
                    >
                      {renderItems(list)}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {settings.controls && !isStatic ? (
        <button
          type="button"
          className={classes.control}
          aria-label={paused ? settings.playLabel : settings.pauseLabel}
          onClick={() => engine.current?.toggle()}
        >
          <svg viewBox="0 0 24 24" className={classes.controlIcon} aria-hidden="true">
            <path d={paused ? icons.play : icons.pause} />
          </svg>
        </button>
      ) : null}
    </section>
  );
}

export default Marquee;
