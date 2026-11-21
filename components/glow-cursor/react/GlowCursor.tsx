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
  resolveSettings,
  roots,
  variants,
  type GlowCursorOptions,
} from "./glow-cursor.config";
import { createGlowCursorEngine, type GlowCursorEngine } from "./glow-cursor.engine";

export interface GlowCursorHandle {
  /** Burst at (x, y) in px relative to the component; defaults to the center */
  burst(x?: number, y?: number): void;
  clear(): void;
}

export type GlowCursorProps = GlowCursorOptions & {
  children?: ReactNode;
  /** Rendered instead of the light when WebGL2 is unavailable */
  fallback?: ReactNode;
  className?: string;
  style?: CSSProperties;
  ref?: Ref<GlowCursorHandle>;
};

export function GlowCursor({
  children,
  fallback,
  className,
  style,
  ref,
  ...options
}: GlowCursorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engine = useRef<GlowCursorEngine | null>(null);
  const [unsupported, setUnsupported] = useState(false);
  const settings = resolveSettings(options);
  const latest = useRef(settings);
  latest.current = settings;
  const onUnsupported = useRef(options.onUnsupported);
  onUnsupported.current = options.onUnsupported;

  useEffect(() => {
    if (!canvasRef.current) return;
    engine.current = createGlowCursorEngine(canvasRef.current, latest.current);
    if (!engine.current) {
      setUnsupported(true);
      onUnsupported.current?.();
    }
    return () => {
      engine.current?.destroy();
      engine.current = null;
    };
  }, []);

  // Every prop change reaches the running simulation without recreating the WebGL context
  useEffect(() => {
    engine.current?.update(settings);
  });

  // In the fixed variant the native cursor is hidden for the whole page
  const hidePage = settings.hideCursor && settings.variant === "fixed";
  useEffect(() => {
    if (!hidePage) return;
    const root = document.documentElement;
    root.classList.add(classes.hiddenCursor);
    return () => root.classList.remove(classes.hiddenCursor);
  }, [hidePage]);

  useImperativeHandle(
    ref,
    () => ({
      burst: (x, y) => engine.current?.burst(x, y),
      clear: () => engine.current?.clear(),
    }),
    [],
  );

  const root = [
    roots[settings.variant],
    settings.hideCursor && !hidePage && classes.hiddenCursor,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={root} style={style}>
      {unsupported ? fallback : null}
      <canvas ref={canvasRef} className={variants[settings.variant]} aria-hidden="true" />
      {children ? <div className={classes.content}>{children}</div> : null}
    </div>
  );
}

export default GlowCursor;
