"use client";

import { useRef } from "react";
import { GlowCursor, type GlowCursorHandle } from "@lib/glow-cursor/react/GlowCursor";
import {
  defaults,
  sizes,
  themes,
  type GlowCursorLight,
  type GlowCursorOptions,
  type GlowCursorThemeName,
} from "@lib/glow-cursor/react/glow-cursor.config";
import { createGlowCursor } from "@lib/glow-cursor/vanilla/glow-cursor";
import { setValue } from "@/lib/customize-config";
import { glowCursorMeta } from "./glow-cursor.meta";
import type { Control, RegistryEntry, StudioState } from "./types";

/** Preset values live in `themes`; the remaining numeric tokens live in `defaults` */
const LIGHT_KEYS = Object.keys(themes.comet) as (keyof GlowCursorLight)[];
const COLOR_KEYS = new Set(["color", "secondaryColor"]);
const NUMERIC_DEFAULTS = [
  "hueSpeed",
  "flow",
  "burstJets",
  "burstSize",
  "idleDelay",
  "opacity",
  "maxDevicePixelRatio",
] as const;

const initialOptions = {
  theme: defaults.theme as string,
  variant: defaults.variant as string,
  size: defaults.size as string,
  mode: defaults.mode as string,
  quality: defaults.quality as string,
  colorMode: defaults.colorMode as string,
  blendMode: defaults.blendMode,
  clickBurst: defaults.clickBurst,
  idle: defaults.idle,
  hideCursor: defaults.hideCursor,
  enabled: defaults.enabled,
  paused: defaults.paused,
  respectReducedMotion: defaults.respectReducedMotion,
};

const baseName = (state: StudioState) =>
  (String(state.options.theme) in themes
    ? state.options.theme
    : defaults.theme) as GlowCursorThemeName;

const toValue = (key: string, value: string) =>
  COLOR_KEYS.has(key) ? value : Number.parseFloat(value);

function toOptions(state: StudioState): GlowCursorOptions {
  const o = state.options;
  const tokens = Object.fromEntries(
    Object.entries(state.tokens).map(([key, value]) => [key, toValue(key, value)]),
  );
  return {
    ...tokens,
    theme: baseName(state),
    variant: o.variant as GlowCursorOptions["variant"],
    size: o.size as GlowCursorOptions["size"],
    mode: o.mode as GlowCursorOptions["mode"],
    quality: o.quality as GlowCursorOptions["quality"],
    colorMode: o.colorMode as GlowCursorOptions["colorMode"],
    blendMode: String(o.blendMode),
    clickBurst: Boolean(o.clickBurst),
    idle: Boolean(o.idle),
    hideCursor: Boolean(o.hideCursor),
    enabled: Boolean(o.enabled),
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
): Control => ({
  type: "slider",
  target: "token",
  key,
  label,
  min,
  max,
  step,
  unit,
});
const toggle = (key: string, label: string): Control => ({
  type: "switch",
  target: "option",
  key,
  label,
});

const surface = (light: boolean) =>
  light
    ? "h-112 w-full overflow-hidden rounded-lg border bg-white text-neutral-500"
    : "h-112 w-full overflow-hidden rounded-lg border bg-neutral-950 text-neutral-500";
const HINT = "flex h-full select-none items-end justify-center pb-5 text-sm";
const BURST_BUTTON =
  "absolute top-3 right-3 z-60 rounded-md border border-white/15 bg-black/40 px-2.5 py-1 text-xs text-neutral-300 hover:bg-black/60";

function Preview({ state }: { state: StudioState }) {
  const ref = useRef<GlowCursorHandle>(null);
  return (
    <div className={`relative ${surface(state.options.mode === "light")}`}>
      <GlowCursor ref={ref} {...toOptions(state)}>
        <p className={HINT}>Move and click</p>
      </GlowCursor>
      <button type="button" className={BURST_BUTTON} onClick={() => ref.current?.burst()}>
        burst()
      </button>
    </div>
  );
}

export const glowCursor: RegistryEntry = {
  ...glowCursorMeta,
  themeKey: "theme",
  controls: [
    {
      title: "Preset & Color",
      controls: [
        select("theme", "Preset", Object.keys(themes)),
        { type: "color", target: "token", key: "color", label: "Color" },
        { type: "color", target: "token", key: "secondaryColor", label: "Cooling color" },
        select("colorMode", "Color mode", ["solid", "rainbow", "velocity"]),
        slider("hueSpeed", "Hue speed", 0, 360, 5, "°"),
        select("mode", "Mode", ["dark", "light", "auto"]),
      ],
    },
    {
      title: "Light",
      controls: [
        slider("intensity", "Intensity", 0.3, 3, 0.05),
        slider("trailWidth", "Trail width", 1, 64, 0.5, "px"),
        slider("linger", "Linger", 0.3, 5, 0.1, "s"),
        slider("glow", "Glow", 0, 3, 0.05),
        slider("hotspot", "Hotspot", 0, 2, 0.05),
        slider("followSpeed", "Follow speed", 0, 1, 0.05),
        slider("grain", "Grain", 0, 1, 0.05),
        slider("flow", "Flow", 0, 2, 0.05),
      ],
    },
    {
      title: "Interaction",
      controls: [
        toggle("clickBurst", "Click burst"),
        slider("burstJets", "Burst jets", 1, 16, 1),
        slider("burstSize", "Burst size", 0.3, 3, 0.1),
        toggle("idle", "Idle path"),
        slider("idleDelay", "Idle delay", 0, 10, 0.5, "s"),
        toggle("hideCursor", "Hide cursor"),
        toggle("enabled", "Enabled"),
        toggle("paused", "Paused"),
        toggle("respectReducedMotion", "Reduced motion"),
      ],
    },
    {
      title: "Layer",
      controls: [
        select("variant", "Variant", ["contained", "overlay", "fixed"]),
        select("size", "Size", Object.keys(sizes)),
        select("quality", "Quality", ["low", "medium", "high"]),
        select("blendMode", "Blend", [
          "auto",
          "screen",
          "normal",
          "plus-lighter",
          "lighten",
          "multiply",
          "overlay",
          "difference",
        ]),
        slider("opacity", "Opacity", 0, 1, 0.05),
        slider("maxDevicePixelRatio", "Max DPR", 0.5, 3, 0.25),
      ],
    },
  ],
  initialState: () => ({ options: { ...initialOptions }, tokens: {} }),
  baseline(state) {
    const preset = themes[baseName(state)];
    const light = Object.fromEntries(LIGHT_KEYS.map((key) => [key, String(preset[key])]));
    const extra = Object.fromEntries(NUMERIC_DEFAULTS.map((key) => [key, String(defaults[key])]));
    return { ...light, ...extra, secondaryColor: preset.secondaryColor || preset.color };
  },
  Preview,
  mountVanilla(el, state) {
    const surfaceEl = document.createElement("div");
    const hint = document.createElement("p");
    const button = document.createElement("button");
    hint.className = HINT;
    hint.textContent = "Move and click";
    button.type = "button";
    button.className = BURST_BUTTON;
    button.textContent = "burst()";
    surfaceEl.append(hint, button);
    el.append(surfaceEl);
    const setSurface = (next: StudioState) => {
      surfaceEl.className = `relative ${surface(next.options.mode === "light")}`;
    };
    setSurface(state);
    const inst = createGlowCursor(surfaceEl, toOptions(state));
    button.addEventListener("click", () => inst.burst());
    return {
      update(next) {
        setSurface(next);
        inst.update(toOptions(next));
      },
      destroy() {
        inst.destroy();
        surfaceEl.remove();
      },
    };
  },
  customize(source, state) {
    const base = baseName(state);
    let out = source;
    for (const [key, value] of Object.entries(state.options)) {
      if (initialOptions[key as keyof typeof initialOptions] !== value)
        out = setValue(out, ["defaults"], key, value);
    }
    for (const [key, value] of Object.entries(state.tokens)) {
      const isLight = (LIGHT_KEYS as string[]).includes(key);
      out = setValue(out, isLight ? ["themes", base] : ["defaults"], key, toValue(key, value));
    }
    return out;
  },
  usage: (framework) =>
    framework === "react"
      ? `import { GlowCursor } from "./GlowCursor";

export default function Hero() {
  return (
    <section className="h-screen bg-black">
      <GlowCursor theme="aurora" idle>
        <h1>Move and click</h1>
      </GlowCursor>
    </section>
  );
}`
      : `import { createGlowCursor } from "./glow-cursor";

const glow = createGlowCursor(document.querySelector("#hero")!, { theme: "aurora", idle: true });
glow.update({ colorMode: "rainbow" });`,
};
