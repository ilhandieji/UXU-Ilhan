"use client";

import { useRef } from "react";
import { ScrambleText, type ScrambleTextHandle } from "@lib/scramble-text/react/ScrambleText";
import {
  charsets,
  defaults,
  sizes,
  themes,
  variants,
  type ScrambleTextOptions,
  type ScrambleTextThemeName,
} from "@lib/scramble-text/react/scramble-text.config";
import { createScrambleText } from "@lib/scramble-text/vanilla/scramble-text";
import { hasKey, setValue } from "@/lib/customize-config";
import { scrambleTextMeta } from "./scramble-text.meta";
import type { Control, RegistryEntry, StudioState } from "./types";

/** Numeric options edited with sliders; they live in `defaults`, not in the CSS tokens */
const TIMING_KEYS = ["speed", "scrambleDuration", "stagger", "loopDelay"] as const;
const TIMING = new Set<string>(TIMING_KEYS);

/** Demo starts as a big headline; anything that differs from `defaults` is written on copy */
const initialOptions = {
  text: defaults.text,
  as: "h2",
  theme: defaults.theme as string,
  variant: defaults.variant as string,
  size: "lg",
  charset: defaults.charset as string,
  customChars: defaults.customChars,
  trigger: defaults.trigger as string,
  direction: defaults.direction as string,
  preserveSpaces: defaults.preserveSpaces,
  monospace: defaults.monospace,
  glow: defaults.glow,
  respectReducedMotion: defaults.respectReducedMotion,
};

const baseName = (state: StudioState) =>
  (String(state.options.theme) in themes
    ? state.options.theme
    : defaults.theme) as ScrambleTextThemeName;

function toOptions(state: StudioState): ScrambleTextOptions {
  const o = state.options;
  const css: Record<string, string> = {};
  const timing: Record<string, number> = {};
  for (const [key, value] of Object.entries(state.tokens)) {
    if (TIMING.has(key)) timing[key] = Number.parseFloat(value);
    else css[key] = value;
  }
  return {
    ...timing,
    text: String(o.text),
    as: o.as as ScrambleTextOptions["as"],
    theme: Object.keys(css).length ? { ...themes[baseName(state)], ...css } : baseName(state),
    variant: o.variant as ScrambleTextOptions["variant"],
    size: o.size as ScrambleTextOptions["size"],
    charset: o.charset as ScrambleTextOptions["charset"],
    customChars: String(o.customChars),
    trigger: o.trigger as ScrambleTextOptions["trigger"],
    direction: o.direction as ScrambleTextOptions["direction"],
    preserveSpaces: Boolean(o.preserveSpaces),
    monospace: Boolean(o.monospace),
    glow: Boolean(o.glow),
    respectReducedMotion: Boolean(o.respectReducedMotion),
  };
}

const select = (key: string, label: string, values: string[]): Control => ({
  type: "select",
  target: "option",
  key,
  label,
  choices: values.map((value) => ({ label: value, value })),
});
const slider = (
  key: string,
  label: string,
  min: number,
  max: number,
  step: number,
  unit = "",
): Control => ({ type: "slider", target: "token", key, label, min, max, step, unit });
const toggle = (key: string, label: string): Control => ({
  type: "switch",
  target: "option",
  key,
  label,
});

const SURFACE =
  "relative flex h-112 w-full items-center justify-center overflow-hidden rounded-lg border bg-neutral-950 px-4 py-6 text-center text-neutral-100 sm:px-8";
const REPLAY_BUTTON =
  "absolute top-3 right-3 rounded-md border border-white/15 bg-black/40 px-2.5 py-1 text-xs text-neutral-300 hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60";
const TEXT = "m-0 max-w-full";

function Preview({ state }: { state: StudioState }) {
  const ref = useRef<ScrambleTextHandle>(null);
  return (
    <div className={SURFACE}>
      <ScrambleText ref={ref} className={TEXT} {...toOptions(state)} />
      <button type="button" className={REPLAY_BUTTON} onClick={() => ref.current?.replay()}>
        Replay
      </button>
    </div>
  );
}

export const scrambleText: RegistryEntry = {
  ...scrambleTextMeta,
  themeKey: "theme",
  presets: [
    {
      name: "Matrix katakana",
      options: { theme: "matrix", charset: "katakana", direction: "random" },
    },
    {
      name: "Cyber hex loop",
      options: { theme: "cyber", charset: "hex", trigger: "loop", direction: "center" },
      tokens: { stagger: "30ms", loopDelay: "1500ms" },
    },
    {
      name: "Binary dump",
      options: { theme: "matrix", charset: "binary", variant: "dim" },
      tokens: { speed: "30ms", scrambleDuration: "900ms", stagger: "20ms" },
    },
    {
      name: "Amber blocks",
      options: { theme: "amber", charset: "blocks", direction: "end" },
      tokens: { "letter-spacing": "4px" },
    },
    {
      name: "Plain hover",
      options: {
        theme: "plain",
        trigger: "hover",
        glow: false,
        monospace: false,
        variant: "ghost",
      },
    },
  ],
  randomizeSkip: ["text", "as", "customChars", "trigger", "respectReducedMotion", "preserveSpaces"],
  palette: (p) => ({ fg: p.fg, scrambled: p.accent }),
  controls: [
    {
      title: "Content",
      controls: [
        { type: "text", target: "option", key: "text", label: "Text" },
        select("as", "Tag", ["span", "p", "h1", "h2", "h3", "div"]),
      ],
    },
    {
      title: "Animation",
      controls: [
        select("charset", "Charset", [...Object.keys(charsets), "custom"]),
        { type: "text", target: "option", key: "customChars", label: "Custom chars" },
        select("trigger", "Trigger", ["mount", "hover", "inView", "loop", "manual"]),
        select("direction", "Direction", ["start", "end", "center", "random"]),
        slider("speed", "Speed (tick)", 10, 200, 5, "ms"),
        slider("stagger", "Stagger", 0, 200, 5, "ms"),
        slider("scrambleDuration", "Scramble duration", 0, 3000, 50, "ms"),
        slider("loopDelay", "Loop delay", 0, 6000, 100, "ms"),
        toggle("preserveSpaces", "Preserve spaces"),
        toggle("respectReducedMotion", "Reduced motion"),
      ],
    },
    {
      title: "Colors",
      controls: [
        select("theme", "Preset", Object.keys(themes)),
        { type: "color", target: "token", key: "fg", label: "Text" },
        { type: "color", target: "token", key: "scrambled", label: "Scrambled" },
        select("variant", "Scrambled style", Object.keys(variants)),
        toggle("glow", "Glow"),
      ],
    },
    {
      title: "Typography",
      controls: [
        select("size", "Size", Object.keys(sizes)),
        slider("font-size", "Font size", 12, 96, 1, "px"),
        toggle("monospace", "Monospace"),
        {
          type: "select",
          target: "token",
          key: "mono-font",
          label: "Mono font",
          choices: [
            { label: "System mono", value: themes.matrix["mono-font"] },
            { label: "JetBrains Mono", value: "'JetBrains Mono', monospace" },
            { label: "Fira Code", value: "'Fira Code', monospace" },
            { label: "Space Mono", value: "'Space Mono', monospace" },
          ],
        },
        {
          type: "select",
          target: "token",
          key: "font-family",
          label: "Font",
          choices: [
            { label: "System sans", value: themes.matrix["font-family"] },
            { label: "Inter", value: "Inter, sans-serif" },
            { label: "Georgia", value: "Georgia, serif" },
          ],
        },
        {
          type: "select",
          target: "token",
          key: "font-weight",
          label: "Weight",
          choices: ["300", "400", "500", "600", "700", "800", "900"].map((v) => ({
            label: v,
            value: v,
          })),
        },
        slider("letter-spacing", "Letter spacing", -2, 20, 0.5, "px"),
      ],
    },
  ],
  initialState: () => ({ options: { ...initialOptions }, tokens: {} }),
  baseline(state) {
    const size = (
      String(state.options.size) in sizes ? state.options.size : "md"
    ) as keyof typeof sizes;
    const timing = Object.fromEntries(TIMING_KEYS.map((key) => [key, `${defaults[key]}ms`]));
    return { ...themes[baseName(state)], ...sizes[size], ...timing };
  },
  Preview,
  mountVanilla(el, state) {
    const surface = document.createElement("div");
    surface.className = SURFACE;
    const button = document.createElement("button");
    button.type = "button";
    button.className = REPLAY_BUTTON;
    button.textContent = "Replay";
    el.append(surface);
    const inst = createScrambleText(surface, toOptions(state));
    inst.element.classList.add(...TEXT.split(" "));
    surface.append(button);
    const onReplay = () => inst.replay();
    button.addEventListener("click", onReplay);
    return {
      update(next) {
        inst.update(toOptions(next));
        inst.element.classList.add(...TEXT.split(" "));
      },
      destroy() {
        button.removeEventListener("click", onReplay);
        inst.destroy();
        surface.remove();
      },
    };
  },
  customize(source, state) {
    const base = baseName(state);
    const size = String(state.options.size);
    let out = source;
    for (const [key, value] of Object.entries(state.options)) {
      if (defaults[key as keyof typeof defaults] !== value)
        out = setValue(out, ["defaults"], key, value);
    }
    for (const [key, value] of Object.entries(state.tokens)) {
      if (TIMING.has(key)) {
        out = setValue(out, ["defaults"], key, Number.parseFloat(value));
        continue;
      }
      out = setValue(
        out,
        hasKey(out, ["sizes", size], key) ? ["sizes", size] : ["themes", base],
        key,
        value,
      );
    }
    return out;
  },
  usage: (framework) =>
    framework === "react"
      ? `import { useRef } from "react";
import { ScrambleText, type ScrambleTextHandle } from "./ScrambleText";

export default function Hero() {
  const ref = useRef<ScrambleTextHandle>(null);
  return (
    <section>
      <ScrambleText ref={ref} as="h1" text="DECRYPTING THE FUTURE" charset="katakana" size="lg" />
      <button onClick={() => ref.current?.replay()}>Replay</button>
    </section>
  );
}`
      : `import { createScrambleText } from "./scramble-text";

const title = createScrambleText(document.querySelector("#hero")!, {
  as: "h1",
  text: "DECRYPTING THE FUTURE",
  trigger: "inView",
});
title.setText("ACCESS GRANTED");`,
};
