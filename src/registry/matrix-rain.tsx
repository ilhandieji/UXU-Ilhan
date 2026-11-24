"use client";

import { useRef } from "react";
import { MatrixRain, type MatrixRainHandle } from "@lib/matrix-rain/react/MatrixRain";
import {
  charsets,
  defaults,
  sizes,
  themes,
  type MatrixRainOptions,
  type MatrixRainThemeName,
} from "@lib/matrix-rain/react/matrix-rain.config";
import { createMatrixRain } from "@lib/matrix-rain/vanilla/matrix-rain";
import { hasKey, setValue } from "@/lib/customize-config";
import { matrixRainMeta } from "./matrix-rain.meta";
import type { Control, RegistryEntry, StudioState } from "./types";

/** Behaviour numbers shown as sliders; they live in `defaults`, the rest are CSS tokens */
const NUMERIC_OPTIONS = ["speed", "density", "fade", "randomSpeed", "maxDevicePixelRatio"] as const;
const NUMERIC_SET = new Set<string>(NUMERIC_OPTIONS);

const initialOptions = {
  theme: defaults.theme as string,
  variant: defaults.variant as string,
  size: defaults.size as string,
  charset: defaults.charset as string,
  customChars: defaults.customChars,
  direction: defaults.direction as string,
  interactive: defaults.interactive,
  paused: defaults.paused,
  respectReducedMotion: defaults.respectReducedMotion,
};

const baseName = (state: StudioState) =>
  (String(state.options.theme) in themes
    ? state.options.theme
    : defaults.theme) as MatrixRainThemeName;

function toOptions(state: StudioState): MatrixRainOptions {
  const o = state.options;
  const look: Record<string, string> = {};
  const numbers: Partial<Record<(typeof NUMERIC_OPTIONS)[number], number>> = {};
  for (const [key, value] of Object.entries(state.tokens)) {
    if (NUMERIC_SET.has(key))
      numbers[key as (typeof NUMERIC_OPTIONS)[number]] = Number.parseFloat(value);
    else look[key] = value;
  }
  const size = (String(o.size) in sizes ? o.size : defaults.size) as keyof typeof sizes;
  return {
    ...numbers,
    theme: { ...themes[baseName(state)], ...sizes[size], ...look },
    size,
    variant: o.variant as MatrixRainOptions["variant"],
    charset: o.charset as MatrixRainOptions["charset"],
    customChars: String(o.customChars),
    direction: o.direction as MatrixRainOptions["direction"],
    interactive: Boolean(o.interactive),
    paused: Boolean(o.paused),
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
const color = (key: string, label: string): Control => ({
  type: "color",
  target: "token",
  key,
  label,
});

const SURFACE = "relative h-112 w-full overflow-hidden rounded-xl border border-white/10";
const OVERLAY =
  "flex h-full select-none items-center justify-center font-mono text-3xl font-semibold tracking-widest text-white drop-shadow-lg sm:text-5xl";
const BURST_BUTTON =
  "absolute top-3 right-3 z-10 rounded-md border border-white/15 bg-black/50 px-2.5 py-1 font-mono text-xs text-neutral-200 hover:bg-black/70 focus-visible:outline-2 focus-visible:outline-white/60";
const TEXT = "Wake up.";

function Preview({ state }: { state: StudioState }) {
  const ref = useRef<MatrixRainHandle>(null);
  return (
    <div className={SURFACE}>
      <MatrixRain ref={ref} {...toOptions(state)}>
        <p className={OVERLAY}>{TEXT}</p>
      </MatrixRain>
      <button type="button" className={BURST_BUTTON} onClick={() => ref.current?.burst()}>
        burst()
      </button>
    </div>
  );
}

export const matrixRain: RegistryEntry = {
  ...matrixRainMeta,
  themeKey: "theme",
  presets: [
    { name: "Classic", options: { theme: "matrix", charset: "katakana" } },
    {
      name: "Binary stream",
      options: { theme: "cyan", charset: "binary" },
      tokens: { speed: "1.6" },
    },
    {
      name: "Rising embers",
      options: { theme: "amber", direction: "up", charset: "symbols" },
      tokens: { speed: "0.6", fade: "0.6" },
    },
    {
      name: "Hex storm",
      options: { theme: "blood", charset: "hex", interactive: true },
      tokens: { speed: "2", density: "1", randomSpeed: "1" },
    },
    {
      name: "Sparse mono",
      options: { theme: "mono", charset: "latin" },
      tokens: { density: "0.35", fade: "0.15", "font-size": "20px" },
    },
  ],
  randomizeSkip: [
    "customChars",
    "paused",
    "respectReducedMotion",
    "variant",
    "maxDevicePixelRatio",
  ],
  palette: (p) => ({ bg: p.bg, color: p.accent, head: p.fg }),
  contrastPairs: { head: "bg" },
  controls: [
    {
      title: "Preset & Color",
      controls: [
        select("theme", "Preset", Object.keys(themes)),
        color("bg", "Background"),
        color("color", "Trail"),
        color("head", "Head"),
        slider("glow", "Glow", 0, 30, 1, "px"),
        slider("opacity", "Opacity", 0, 1, 0.05),
      ],
    },
    {
      title: "Characters",
      controls: [
        select("charset", "Charset", [...Object.keys(charsets), "custom"]),
        { type: "text", target: "option", key: "customChars", label: "Custom chars" },
        select("size", "Size", Object.keys(sizes)),
        slider("font-size", "Font size", 8, 40, 1, "px"),
      ],
    },
    {
      title: "Motion",
      controls: [
        slider("speed", "Speed", 0.1, 4, 0.05),
        slider("density", "Density", 0, 1, 0.05),
        slider("fade", "Fade", 0, 1, 0.05),
        slider("randomSpeed", "Random speed", 0, 1, 0.05),
        select("direction", "Direction", ["down", "up"]),
        toggle("interactive", "Interactive"),
        toggle("paused", "Paused"),
        toggle("respectReducedMotion", "Reduced motion"),
      ],
    },
    {
      title: "Layer",
      controls: [
        select("variant", "Variant", ["contained", "fullscreen"]),
        slider("maxDevicePixelRatio", "Max DPR", 0.5, 3, 0.25),
      ],
    },
  ],
  initialState: () => ({ options: { ...initialOptions }, tokens: {} }),
  baseline(state) {
    const size = (
      String(state.options.size) in sizes ? state.options.size : defaults.size
    ) as keyof typeof sizes;
    const numbers = Object.fromEntries(NUMERIC_OPTIONS.map((key) => [key, String(defaults[key])]));
    return { ...themes[baseName(state)], ...sizes[size], ...numbers };
  },
  Preview,
  mountVanilla(el, state) {
    const surfaceEl = document.createElement("div");
    const overlay = document.createElement("p");
    const button = document.createElement("button");
    surfaceEl.className = SURFACE;
    overlay.className = OVERLAY;
    overlay.textContent = TEXT;
    button.type = "button";
    button.className = BURST_BUTTON;
    button.textContent = "burst()";
    surfaceEl.append(overlay, button);
    el.append(surfaceEl);
    const inst = createMatrixRain(surfaceEl, toOptions(state));
    const onBurst = () => inst.burst();
    button.addEventListener("click", onBurst);
    return {
      update: (next) => inst.update(toOptions(next)),
      destroy() {
        button.removeEventListener("click", onBurst);
        inst.destroy();
        surfaceEl.remove();
      },
    };
  },
  customize(source, state) {
    const base = baseName(state);
    const size = String(state.options.size);
    let out = source;
    for (const [key, value] of Object.entries(state.options)) {
      if (initialOptions[key as keyof typeof initialOptions] !== value)
        out = setValue(out, ["defaults"], key, value);
    }
    for (const [key, value] of Object.entries(state.tokens)) {
      if (NUMERIC_SET.has(key)) {
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
import { MatrixRain, type MatrixRainHandle } from "./MatrixRain";

export default function Hero() {
  const rain = useRef<MatrixRainHandle>(null);
  return (
    <section className="h-screen">
      <MatrixRain ref={rain} theme="matrix" interactive>
        <button onClick={() => rain.current?.burst()}>Wake up.</button>
      </MatrixRain>
    </section>
  );
}

// Site-wide background / easter egg:
// <MatrixRain variant="fullscreen" opacity={0.6} bg="transparent" />`
      : `import { createMatrixRain } from "./matrix-rain";

const rain = createMatrixRain(document.querySelector("#hero")!, { theme: "cyan", charset: "binary" });
rain.update({ speed: 1.5, direction: "up" });
rain.burst();
// rain.destroy();`,
};
