"use client";

import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type Ref,
} from "react";
import {
  complete,
  createKeySound,
  executeLine,
  playBootSequence,
  tildePath,
  type Output,
  type Segment,
  type Tone,
} from "./terminal.commands";
import {
  classes,
  defaults,
  resolveTokens,
  type TerminalOptions,
  type TerminalSettings,
} from "./terminal.config";

export type TerminalProps = TerminalOptions & { className?: string; ref?: Ref<TerminalHandle> };

export interface TerminalHandle {
  run(line: string): Promise<void>;
  clear(): void;
  focus(): void;
}

type Entry = { id: number; prompt?: string; text?: string; out?: Output };

const toneClass: Record<Tone, string> = {
  accent: classes.accent,
  bright: classes.bright,
  dim: classes.dim,
  error: classes.error,
};

function Segments({ segments }: { segments: Segment[] }) {
  return (
    <div className={classes.line}>
      {segments.map(({ text, tone }, i) => (
        <span key={i} className={tone ? toneClass[tone] : classes.bright}>
          {text}
        </span>
      ))}
    </div>
  );
}

function OutputLine({ out }: { out: Output }) {
  if (typeof out === "string")
    return <div className={`${classes.line} ${classes.bright}`}>{out || "\u00a0"}</div>;
  if (Array.isArray(out)) return <Segments segments={out} />;
  return (
    <div className={classes.fetch}>
      <div className={classes.fetchArt}>{out.art.join("\n")}</div>
      <div>
        {out.lines.map((segments, i) => (
          <Segments key={i} segments={segments} />
        ))}
      </div>
    </div>
  );
}

const abortError = () => new DOMException("Aborted", "AbortError");

export function Terminal({ className, ref, ...options }: TerminalProps) {
  // Nested option objects are merged with their defaults so partial values work
  const o: TerminalSettings = {
    ...defaults,
    ...options,
    sound: { ...defaults.sound, ...options.sound },
    bootSequence: { ...defaults.bootSequence, ...options.bootSequence },
  };
  const latest = useRef(o);
  latest.current = o;
  const [entries, setEntries] = useState<Entry[]>([]);
  const [bootLines, setBootLines] = useState<Output[]>([]);
  const [booting, setBooting] = useState(o.bootSequence.lines.length > 0);
  /** Prompt of an interactive command waiting for a typed line (null = none) */
  const [readPrompt, setReadPrompt] = useState<string | null>(null);
  const pendingRead = useRef<((line: string) => void) | null>(null);
  const pendingKey = useRef<((key: string) => void) | null>(null);
  const sound = useRef(createKeySound(() => latest.current.sound));
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [path, setPath] = useState("/");
  const past = useRef<string[]>([]);
  const cursor = useRef(0);
  const running = useRef<AbortController | null>(null);
  const nextId = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const screen = useRef<HTMLDivElement>(null);

  useEffect(() => setPath(location.pathname), []);
  useEffect(() => {
    const keySound = sound.current;
    return () => {
      running.current?.abort();
      keySound.close();
    };
  }, []);

  // Boot sequence once on mount: lines first, then the banner/intro (a key or click skips it)
  useEffect(() => {
    const sequence = latest.current.bootSequence;
    if (!sequence.lines.length) return;
    const controller = new AbortController();
    const root = rootRef.current;
    const skip = () => sequence.skippable && controller.abort();
    root?.addEventListener("keydown", skip);
    root?.addEventListener("pointerdown", skip);
    let alive = true;
    void playBootSequence(sequence, {
      print: (out) => setBootLines((prev) => [...prev, out]),
      signal: controller.signal,
    }).then(() => {
      if (!alive) return;
      if (latest.current.bootSequence.clearAfter) setBootLines([]);
      setBooting(false);
      requestAnimationFrame(() => input.current?.focus({ preventScroll: true }));
    });
    return () => {
      alive = false;
      controller.abort();
      root?.removeEventListener("keydown", skip);
      root?.removeEventListener("pointerdown", skip);
    };
  }, []);
  useEffect(() => {
    screen.current?.scrollTo({ top: screen.current.scrollHeight });
  }, [entries, bootLines]);

  const userName = o.currentUser || o.user;
  const cwd = o.cwd || tildePath(path);
  const promptText = `${userName}@${o.host}:${cwd}$`;
  const style = resolveTokens({
    theme: o.theme,
    size: o.size,
    variant: o.variant,
    glow: o.glow,
  }) as CSSProperties;
  const add = (entry: Omit<Entry, "id">) =>
    setEntries((prev) => [...prev, { ...entry, id: nextId.current++ }]);

  async function run(line: string) {
    add({ prompt: promptText, text: line });
    if (line.trim()) past.current.push(line);
    cursor.current = past.current.length;
    o.onCommand?.(line);
    const controller = new AbortController();
    running.current = controller;
    setBusy(true);
    const wait = <T,>(register: (resolve: (value: T) => void) => void) =>
      new Promise<T>((resolve, reject) => {
        if (controller.signal.aborted) return reject(abortError());
        controller.signal.addEventListener("abort", () => reject(abortError()), { once: true });
        register(resolve);
      });
    await executeLine(line, {
      options: o,
      history: past.current,
      root: rootRef.current,
      signal: controller.signal,
      print: (out) => add({ out }),
      clear: () => setEntries([]),
      read: (prompt = ">") =>
        wait<string>((resolve) => {
          pendingRead.current = resolve;
          setReadPrompt(prompt);
          requestAnimationFrame(() => input.current?.focus());
        }),
      readKey: () => wait<string>((resolve) => (pendingKey.current = resolve)),
      live: (out) => {
        const id = nextId.current++;
        setEntries((prev) => [...prev, { id, out }]);
        return (next) =>
          setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, out: next } : e)));
      },
    });
    running.current = null;
    pendingRead.current = null;
    pendingKey.current = null;
    setReadPrompt(null);
    setBusy(false);
    setPath(location.pathname);
    requestAnimationFrame(() => input.current?.focus());
  }

  useImperativeHandle(ref, () => ({
    run,
    clear: () => setEntries([]),
    focus: () => input.current?.focus(),
  }));

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key.length === 1 || event.key === "Backspace") sound.current.play("key");
    else if (event.key === "Enter") sound.current.play("enter");
    if (event.ctrlKey && event.key === "c") {
      event.preventDefault();
      if (running.current) return running.current.abort();
      add({ prompt: promptText, text: `${value}^C` });
      setValue("");
    } else if (busy && pendingKey.current) {
      event.preventDefault();
      const resolve = pendingKey.current;
      pendingKey.current = null;
      resolve(event.key);
    } else if (busy && pendingRead.current) {
      if (event.key !== "Enter") return;
      event.preventDefault();
      const resolve = pendingRead.current;
      pendingRead.current = null;
      add({ prompt: readPrompt ?? ">", text: value });
      setReadPrompt(null);
      setValue("");
      resolve(value);
    } else if (busy) {
      event.preventDefault();
    } else if (event.ctrlKey && event.key === "l") {
      event.preventDefault();
      setEntries([]);
    } else if (event.key === "Enter") {
      setValue("");
      void run(value);
    } else if (event.key === "Tab") {
      event.preventDefault();
      setValue(complete(value, o));
    } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      cursor.current = Math.min(
        past.current.length,
        Math.max(0, cursor.current + (event.key === "ArrowUp" ? -1 : 1)),
      );
      setValue(past.current[cursor.current] ?? "");
    }
  }

  return (
    <div
      ref={rootRef}
      className={className ? `${classes.root} ${className}` : classes.root}
      style={style}
      role="application"
      aria-label="Terminal"
    >
      {o.variant !== "minimal" && (
        <div className={classes.bar}>
          <div className={classes.dots}>
            {classes.dot.map((dotClass) => (
              <span key={dotClass} className={dotClass} />
            ))}
          </div>
          <div className={classes.title}>{o.title || `${userName}@${o.host}:${cwd}`}</div>
        </div>
      )}
      <div
        ref={screen}
        className={classes.screen}
        onClick={() => !getSelection()?.toString() && input.current?.focus()}
      >
        {bootLines.map((out, i) => (
          <OutputLine key={i} out={out} />
        ))}
        {!booting && o.banner && <div className={classes.banner}>{o.banner.join("\n")}</div>}
        {!booting && o.subtitle && <div className={classes.dim}>{o.subtitle}</div>}
        <div className={classes.gap} />
        {!booting &&
          o.boot.map(({ label, value: status }) => (
            <div key={label} className={classes.dim}>
              {label} : <span>{status}</span>
            </div>
          ))}
        <div className={classes.gap} />
        {!booting &&
          o.help.map(({ name, description }) => (
            <div key={name} className={classes.helpRow}>
              <span className={classes.helpName}>{name}</span>
              <span className={classes.dim}>{description}</span>
            </div>
          ))}
        <div className={classes.gap} />
        <div role="log" aria-live="polite">
          {entries.map((entry) =>
            entry.out !== undefined ? (
              <OutputLine key={entry.id} out={entry.out} />
            ) : (
              <div key={entry.id} className={classes.line}>
                {entry.prompt} <span className={classes.bright}>{entry.text}</span>
              </div>
            ),
          )}
        </div>
        <label
          className={busy && readPrompt === null ? classes.rowBusy : classes.row}
          hidden={booting}
        >
          <span className={classes.prompt}>{readPrompt ?? promptText}</span>
          <input
            ref={input}
            className={classes.input}
            value={value}
            placeholder={readPrompt === null ? o.placeholder : ""}
            spellCheck={false}
            autoComplete="off"
            aria-label="Terminal input"
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={onKeyDown}
          />
        </label>
      </div>
    </div>
  );
}
