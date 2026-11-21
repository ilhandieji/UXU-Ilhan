"use client";

import {
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type Ref,
} from "react";
import {
  captionClasses,
  classes,
  fitClasses,
  resolveSettings,
  resolveTokens,
  type OrbitImagesOptions,
} from "./orbit-images.config";
import { buildOrbitPath, createOrbitEngine, type OrbitEngine } from "./orbit-images.engine";

export interface OrbitImagesHandle {
  next(): void;
  prev(): void;
  /** Glides the image at `index` to the front */
  goTo(index: number): void;
}

export type OrbitImagesProps = OrbitImagesOptions & {
  /** Content in the middle; with depth, images pass behind and in front of it */
  centerContent?: ReactNode;
  className?: string;
  style?: CSSProperties;
  ref?: Ref<OrbitImagesHandle>;
};

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
const join = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

export function OrbitImages({
  centerContent,
  className,
  style,
  ref,
  ...options
}: OrbitImagesProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const engine = useRef<OrbitEngine | null>(null);
  const clipId = `orbit-clip-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const settings = resolveSettings(options);
  const latest = useRef(settings);
  latest.current = settings;
  // Only the first render hides items for the intro; later renders never re-add it
  const [introPending] = useState(settings.intro);

  useIsomorphicLayoutEffect(() => {
    if (!rootRef.current) return;
    engine.current = createOrbitEngine(rootRef.current, latest.current);
    return () => {
      engine.current?.destroy();
      engine.current = null;
    };
  }, []);

  // Runs after every commit so the engine sees the freshly rendered path and items
  useIsomorphicLayoutEffect(() => {
    engine.current?.update(settings);
  });

  useImperativeHandle(
    ref,
    () => ({
      next: () => engine.current?.next(),
      prev: () => engine.current?.prev(),
      goTo: (index) => engine.current?.goTo(index),
    }),
    [],
  );

  const path = buildOrbitPath(settings);
  const center = settings.baseWidth / 2;
  const transform = `rotate(${settings.rotation} ${center} ${center})`;
  const interactive = !!settings.onItemClick;
  const clickable = settings.clickToFront || interactive;
  const layered = settings.showPath && settings.depth > 0 && !!centerContent;
  const autoHeight = settings.height === "auto";

  return (
    <div
      ref={rootRef}
      className={join(
        classes.root,
        autoHeight ? classes.autoHeight : classes.fixedHeight,
        settings.draggable && classes.draggable,
        className,
      )}
      style={{ ...(resolveTokens(settings) as CSSProperties), ...style }}
      role="region"
      aria-roledescription="carousel"
      aria-label={settings.altPrefix}
      data-intro={introPending ? "" : undefined}
    >
      <div className={classes.stage} data-orbit-stage="">
        <svg
          className={join(classes.svg, classes.svgBack, !settings.showPath && classes.hidden)}
          data-orbit-svg=""
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            data-orbit-path=""
            data-orbit-stroke=""
            className={classes.stroke}
            d={path}
            transform={transform}
          />
        </svg>
        {layered ? (
          <svg
            className={join(classes.svg, classes.svgFront)}
            data-orbit-svg=""
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
                <rect data-orbit-clip="" />
              </clipPath>
            </defs>
            <g clipPath={`url(#${clipId})`}>
              <path
                data-orbit-stroke=""
                className={classes.stroke}
                d={path}
                transform={transform}
              />
            </g>
          </svg>
        ) : null}
        {settings.items.map((item, index) => (
          <div
            key={`${index}-${item.src}`}
            className={join(classes.item, clickable && classes.clickable)}
            data-orbit-item={index}
            role={interactive ? "button" : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-label={interactive ? item.alt : undefined}
          >
            <div
              className={join(classes.frame, settings.variant === "glass" && classes.frameGlass)}
            >
              <img
                src={item.src}
                alt={item.alt}
                draggable={false}
                decoding="async"
                loading={settings.loading}
                className={join(classes.image, fitClasses[settings.objectFit])}
              />
              {item.caption ? (
                <span className={join(classes.caption, captionClasses[settings.captions])}>
                  {item.caption}
                </span>
              ) : null}
            </div>
          </div>
        ))}
        {centerContent ? (
          <div className={classes.center} data-orbit-center="">
            {centerContent}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default OrbitImages;
