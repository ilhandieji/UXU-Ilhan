"use client";

import { useEffect, useImperativeHandle, useRef, type CSSProperties, type Ref } from "react";
import {
  classes,
  resolveSettings,
  resolveTokens,
  type AsciiRendererOptions,
} from "./ascii-renderer.config";
import { createAsciiPlayer, type AsciiPlayer } from "./ascii-renderer.engine";

export interface AsciiRendererHandle {
  /** Starts video playback (also overrides reduced motion) */
  play(): void;
  pause(): void;
  /** Converts the current frame again right now */
  render(): void;
  /** Current ASCII as plain text lines joined by \n */
  toText(): string;
}

export type AsciiRendererProps = AsciiRendererOptions & {
  className?: string;
  style?: CSSProperties;
  ref?: Ref<AsciiRendererHandle>;
};

export function AsciiRenderer({ className, style, ref, ...options }: AsciiRendererProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textRef = useRef<HTMLPreElement>(null);
  const player = useRef<AsciiPlayer | null>(null);
  const settings = resolveSettings(options);
  const tokens = resolveTokens(options);
  const latest = useRef(settings);
  latest.current = settings;

  useEffect(() => {
    const root = rootRef.current;
    const layer = layerRef.current;
    const canvas = canvasRef.current;
    const text = textRef.current;
    if (!root || !layer || !canvas || !text) return;
    player.current = createAsciiPlayer({ root, layer, canvas, text }, latest.current, {
      video: classes.video,
    });
    return () => {
      player.current?.destroy();
      player.current = null;
    };
  }, []);

  // Runs after every render: the player diffs settings and only reloads/re-renders what changed
  useEffect(() => {
    player.current?.update(settings);
  });

  useImperativeHandle(
    ref,
    () => ({
      play: () => player.current?.play(),
      pause: () => player.current?.pause(),
      render: () => player.current?.render(),
      toText: () => player.current?.toText() ?? "",
    }),
    [],
  );

  return (
    <div
      ref={rootRef}
      role="img"
      aria-label={settings.alt}
      className={className ? `${classes.root} ${className}` : classes.root}
      style={{ ...(tokens as CSSProperties), ...style }}
    >
      <div ref={layerRef} className={classes.layer}>
        <canvas ref={canvasRef} className={classes.canvas} aria-hidden="true" />
        <pre ref={textRef} className={classes.text} aria-hidden="true" hidden />
      </div>
    </div>
  );
}

export default AsciiRenderer;
