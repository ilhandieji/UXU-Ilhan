"use client";

import { useEffect, useState } from "react";
import { AsciiRenderer } from "@lib/ascii-renderer/react/AsciiRenderer";
import {
  CHARSETS,
  COLOR_MODES,
  DITHERS,
  defaults,
  sizes,
  themes,
  variants,
  type AsciiRendererOptions,
  type AsciiRendererThemeName,
} from "@lib/ascii-renderer/react/ascii-renderer.config";
import { createAsciiRenderer } from "@lib/ascii-renderer/vanilla/ascii-renderer";
import { hasKey, setValue } from "@/lib/customize-config";
import { asciiRendererMeta } from "./ascii-renderer.meta";
import type { Control, RegistryEntry, StudioState } from "./types";

/** Numeric options exposed as sliders (sliders are token controls); written to `defaults` */
const NUMERIC_OPTIONS = ["columns", "brightness", "contrast", "gamma"] as const;
const isNumericOption = (key: string) => (NUMERIC_OPTIONS as readonly string[]).includes(key);

/** Demo sources: one generated offline, two public images (picsum.photos sends CORS headers) */
const SOURCES: Record<string, string> = {
  generated: "",
  mountains: "https://picsum.photos/id/1018/800/533",
  dog: "https://picsum.photos/id/237/640/640",
};

let generated: string | null = null;
/** Colorful gradient + circles drawn on an offscreen canvas, so the demo works offline */
function generatedImage(): string {
  if (generated) return generated;
  const canvas = document.createElement("canvas");
  canvas.width = 480;
  canvas.height = 320;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const bg = ctx.createLinearGradient(0, 0, 480, 320);
  bg.addColorStop(0, "#1b0b3a");
  bg.addColorStop(0.5, "#0b4f6c");
  bg.addColorStop(1, "#01baef");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 480, 320);
  const circles: [number, number, number, string, string][] = [
    [150, 170, 110, "#ffe066", "#ff6b35"],
    [340, 120, 70, "#ff9ff3", "#c22ad6"],
    [360, 250, 45, "#b8ff6a", "#20a35a"],
    [70, 60, 30, "#ffffff", "#7a8cff"],
  ];
  for (const [x, y, r, inner, outer] of circles) {
    const g = ctx.createRadialGradient(x - r / 3, y - r / 3, r / 8, x, y, r);
    g.addColorStop(0, inner);
    g.addColorStop(1, outer);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  generated = canvas.toDataURL("image/png");
  return generated;
}

const sourceUrl = (key: string) => SOURCES[key] || generatedImage();

const initialOptions = {
  theme: defaults.theme as string,
  variant: "outline",
  size: defaults.size as string,
  source: "generated",
  charset: defaults.charset as string,
  customChars: defaults.customChars,
  color: defaults.color as string,
  dither: defaults.dither as string,
  invert: defaults.invert,
  output: defaults.output as string,
  fit: defaults.fit as string,
};

const baseName = (state: StudioState) =>
  (String(state.options.theme) in themes
    ? state.options.theme
    : defaults.theme) as AsciiRendererThemeName;

function toOptions(state: StudioState, src: string): AsciiRendererOptions {
  const o = state.options;
  const size = o.size as keyof typeof sizes;
  const variant = o.variant as keyof typeof variants;
  const tokens: Record<string, string> = {};
  const numeric: Record<string, number> = {};
  for (const [key, value] of Object.entries(state.tokens)) {
    if (isNumericOption(key)) numeric[key] = Number.parseFloat(value);
    else tokens[key] = value;
  }
  return {
    ...numeric,
    theme: { ...themes[baseName(state)], ...sizes[size], ...variants[variant], ...tokens },
    size,
    variant,
    src,
    alt: "Colorful shapes rendered as ASCII art",
    charset: o.charset as AsciiRendererOptions["charset"],
    customChars: String(o.customChars),
    color: o.color as AsciiRendererOptions["color"],
    dither: o.dither as AsciiRendererOptions["dither"],
    invert: Boolean(o.invert),
    output: o.output as AsciiRendererOptions["output"],
    fit: o.fit as AsciiRendererOptions["fit"],
  };
}

const select = (key: string, label: string, values: readonly string[]): Control => ({
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

const FRAME = "h-112 w-full max-w-full";

function Preview({ state }: { state: StudioState }) {
  const [src, setSrc] = useState("");
  const source = String(state.options.source);
  // The generated image needs a canvas, so it is built after mount (SSR-safe)
  useEffect(() => setSrc(sourceUrl(source)), [source]);
  return (
    <div className={FRAME}>
      <AsciiRenderer {...toOptions(state, src)} />
    </div>
  );
}

export const asciiRenderer: RegistryEntry = {
  ...asciiRendererMeta,
  themeKey: "theme",
  presets: [
    { name: "Braille truecolor", options: { charset: "braille", color: "truecolor" } },
    {
      name: "Half-block pixels",
      options: { charset: "halfblock", color: "truecolor" },
      tokens: { columns: "120" },
    },
    { name: "Paper print", options: { theme: "paper", charset: "detailed", dither: "floyd" } },
    { name: "Amber blocks", options: { theme: "amber", charset: "blocks", dither: "bayer" } },
    { name: "ANSI 16", options: { theme: "mono", color: "ansi16", charset: "standard" } },
  ],
  randomizeSkip: ["source", "customChars", "output", "fit"],
  palette: (p) => ({ bg: p.bg, fg: p.accent, border: p.muted }),
  contrastPairs: { fg: "bg" },
  controls: [
    {
      title: "Source",
      controls: [
        select("source", "Source", Object.keys(SOURCES)),
        select("output", "Output", ["canvas", "text"]),
        select("fit", "Fit", ["contain", "cover", "none"]),
      ],
    },
    {
      title: "Conversion",
      controls: [
        slider("columns", "Columns", 20, 200, 1),
        select("charset", "Charset", CHARSETS),
        { type: "text", target: "option", key: "customChars", label: "Custom chars" },
        select("color", "Color mode", COLOR_MODES),
        select("dither", "Dither", DITHERS),
        { type: "switch", target: "option", key: "invert", label: "Invert" },
        slider("brightness", "Brightness", -1, 1, 0.05),
        slider("contrast", "Contrast", 0, 3, 0.05),
        slider("gamma", "Gamma", 0.2, 3, 0.05),
      ],
    },
    {
      title: "Theme",
      controls: [
        select("theme", "Preset", Object.keys(themes)),
        { type: "color", target: "token", key: "bg", label: "Background" },
        { type: "color", target: "token", key: "fg", label: "Text (mono)" },
        { type: "color", target: "token", key: "border", label: "Border" },
      ],
    },
    {
      title: "Frame",
      controls: [
        select("variant", "Variant", Object.keys(variants)),
        select("size", "Size", Object.keys(sizes)),
        slider("font-size", "Font size", 4, 24, 1, "px"),
        slider("padding", "Padding", 0, 32, 1, "px"),
        slider("radius", "Radius", 0, 24, 1, "px"),
      ],
    },
  ],
  initialState: () => ({ options: { ...initialOptions }, tokens: {} }),
  baseline(state) {
    const size = (
      String(state.options.size) in sizes ? state.options.size : "md"
    ) as keyof typeof sizes;
    const extra = Object.fromEntries(NUMERIC_OPTIONS.map((key) => [key, String(defaults[key])]));
    return { ...themes[baseName(state)], ...sizes[size], ...extra };
  },
  Preview,
  mountVanilla(el, state) {
    const frame = document.createElement("div");
    frame.className = FRAME;
    el.append(frame);
    const inst = createAsciiRenderer(
      frame,
      toOptions(state, sourceUrl(String(state.options.source))),
    );
    return {
      update: (next) => inst.update(toOptions(next, sourceUrl(String(next.options.source)))),
      destroy() {
        inst.destroy();
        frame.remove();
      },
    };
  },
  customize(source, state) {
    const base = baseName(state);
    const size = String(state.options.size);
    let out = source;
    for (const [key, value] of Object.entries(state.options)) {
      if (key === "source") {
        // Only real URLs are written; the generated demo image is a long data URL
        if (SOURCES[String(value)])
          out = setValue(out, ["defaults"], "src", SOURCES[String(value)]);
        continue;
      }
      if (defaults[key as keyof typeof defaults] !== value)
        out = setValue(out, ["defaults"], key, value);
    }
    for (const [key, value] of Object.entries(state.tokens)) {
      if (isNumericOption(key)) {
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
import { AsciiRenderer, type AsciiRendererHandle } from "./AsciiRenderer";

export default function Hero() {
  const ascii = useRef<AsciiRendererHandle>(null);
  return (
    <div className="h-96">
      <AsciiRenderer
        ref={ascii}
        src="/clip.mp4"
        alt="Product demo rendered as ASCII"
        charset="braille"
        color="truecolor"
        columns={120}
      />
    </div>
  );
}`
      : `import { createAsciiRenderer } from "./ascii-renderer";

const ascii = createAsciiRenderer(document.querySelector("#ascii")!, {
  src: "/photo.jpg",
  alt: "Portrait rendered as ASCII",
  columns: 100,
  dither: "floyd",
});
ascii.update({ theme: "amber", charset: "blocks" });
console.log(ascii.toText());`,
};
