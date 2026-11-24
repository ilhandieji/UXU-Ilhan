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
  resolveSettings,
  resolveTokens,
  rootClassName,
  type ScrambleTextOptions,
} from "./scramble-text.config";
import {
  createScrambleEngine,
  finalCells,
  type ScrambleCell,
  type ScrambleEngine,
} from "./scramble-text.engine";

export interface ScrambleTextHandle {
  /** Starts the scramble-in unless it is already running */
  play(): void;
  /** Restarts the scramble-in from scratch */
  replay(): void;
  /** Jumps to the final text */
  stop(): void;
  /** Scrambles into a new text (until the `text` prop changes again) */
  setText(text: string): void;
}

export type ScrambleTextProps = ScrambleTextOptions & {
  className?: string;
  style?: CSSProperties;
  ref?: Ref<ScrambleTextHandle>;
};

export function ScrambleText({ className, style, ref, onComplete, ...options }: ScrambleTextProps) {
  const settings = resolveSettings(options);
  const rootRef = useRef<HTMLElement>(null);
  const engine = useRef<ScrambleEngine | null>(null);
  const latest = useRef(settings);
  latest.current = settings;
  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;
  // The server and first client render show the final text
  const [cells, setCells] = useState<ScrambleCell[]>(() => finalCells(settings.text));
  const [finalText, setFinalText] = useState(settings.text);

  useEffect(() => {
    const instance = createScrambleEngine(latest.current.text, latest.current, {
      onFrame: setCells,
      onComplete: () => completeRef.current?.(),
    });
    engine.current = instance;
    setCells(finalCells(latest.current.text));
    setFinalText(latest.current.text);
    return () => {
      instance.destroy();
      engine.current = null;
    };
  }, []);

  // Every prop change reaches the running engine without remounting
  useEffect(() => {
    engine.current?.update(settings);
  });

  // A new text scrambles from whatever is visible now
  useEffect(() => {
    engine.current?.setText(settings.text, true);
    setFinalText(settings.text);
  }, [settings.text]);

  const { trigger } = settings;
  useEffect(() => {
    const instance = engine.current;
    const el = rootRef.current;
    if (!instance) return;
    if (trigger === "mount" || trigger === "loop") {
      instance.replay();
      return;
    }
    if (trigger !== "inView" || !el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      instance.replay();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [trigger]);

  useImperativeHandle(
    ref,
    () => ({
      play: () => engine.current?.play(),
      replay: () => engine.current?.replay(),
      stop: () => engine.current?.stop(),
      setText: (text) => {
        engine.current?.setText(text, true);
        setFinalText(text);
      },
    }),
    [],
  );

  const Tag = settings.as as ElementType;
  const tokens = resolveTokens(settings) as CSSProperties;
  const root = className ? `${rootClassName(settings)} ${className}` : rootClassName(settings);

  return (
    <Tag
      ref={rootRef}
      className={root}
      style={{ ...tokens, ...style }}
      onPointerEnter={trigger === "hover" ? () => engine.current?.play() : undefined}
    >
      <span className={classes.srOnly}>{finalText}</span>
      <span aria-hidden="true">
        {cells.map((cell, i) => (
          <span key={i} className={cell.scrambled ? classes.scrambled : undefined}>
            {cell.char}
          </span>
        ))}
      </span>
    </Tag>
  );
}

export default ScrambleText;
