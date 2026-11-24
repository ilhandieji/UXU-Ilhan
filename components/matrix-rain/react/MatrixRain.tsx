"use client";

import {
  useEffect,
  useImperativeHandle,
  useRef,
  type CSSProperties,
  type ReactNode,
  type Ref,
} from "react";
import {
  classes,
  layers,
  resolveSettings,
  resolveTokens,
  roots,
  type MatrixRainOptions,
} from "./matrix-rain.config";
import { createMatrixRainEngine, type MatrixRainEngine } from "./matrix-rain.engine";

export interface MatrixRainHandle {
  pause(): void;
  resume(): void;
  /** Speed spike that eases out over ~1s */
  burst(): void;
  /** Wipes the canvas and restarts the rain from the edge */
  clear(): void;
}

export type MatrixRainProps = MatrixRainOptions & {
  /** Content layered above the rain */
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  ref?: Ref<MatrixRainHandle>;
};

export function MatrixRain({ children, className, style, ref, ...options }: MatrixRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engine = useRef<MatrixRainEngine | null>(null);
  const settings = resolveSettings(options);
  const tokens = resolveTokens(options) as CSSProperties;
  const latest = useRef(settings);
  latest.current = settings;

  useEffect(() => {
    if (!canvasRef.current) return;
    engine.current = createMatrixRainEngine(canvasRef.current, latest.current);
    return () => {
      engine.current?.destroy();
      engine.current = null;
    };
  }, []);

  // Every prop change reaches the running engine without a remount (tokens are re-read from CSS)
  useEffect(() => {
    engine.current?.update(settings);
  });

  useImperativeHandle(
    ref,
    () => ({
      pause: () => engine.current?.pause(),
      resume: () => engine.current?.resume(),
      burst: () => engine.current?.burst(),
      clear: () => engine.current?.clear(),
    }),
    [],
  );

  const root = className ? `${roots[settings.variant]} ${className}` : roots[settings.variant];

  return (
    <div className={root} style={{ ...tokens, ...style }}>
      <canvas ref={canvasRef} className={layers[settings.variant]} aria-hidden="true" />
      {children ? <div className={classes.content}>{children}</div> : null}
    </div>
  );
}

export default MatrixRain;
