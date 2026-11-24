"use client";

import { Marquee } from "@lib/marquee/react/Marquee";
import {
  defaults,
  sizes,
  themes,
  variants,
  type MarqueeOptions,
  type MarqueeThemeName,
} from "@lib/marquee/react/marquee.config";
import { createMarquee } from "@lib/marquee/vanilla/marquee";
import { hasKey, setValue } from "@/lib/customize-config";
import { marqueeMeta } from "./marquee.meta";
import type { Control, RegistryEntry, StudioState } from "./types";

const TICKER_ITEMS = ["BUILD", "SHIP", "REPEAT", "LEARN", "TWEAK"];
const DEMO_ITEMS =
  "React, TypeScript, Tailwind CSS, Next.js, Vite, Node.js, Rust, Go, Bun, Deno, PostgreSQL, Docker";

/** Sliders that are options (numbers) rather than CSS tokens */
const NUMERIC_OPTIONS = ["speed", "fadeSize"] as const;
const isNumeric = (key: string) => (NUMERIC_OPTIONS as readonly string[]).includes(key);

const initialOptions = {
  theme: defaults.theme as string,
  variant: defaults.variant as string,
  size: defaults.size as string,
  items: DEMO_ITEMS,
  direction: defaults.direction as string,
  rows: String(defaults.rows),
  separator: "✦",
  pauseOnHover: defaults.pauseOnHover,
  pauseOnFocus: defaults.pauseOnFocus,
  reverseOnHover: defaults.reverseOnHover,
  draggable: defaults.draggable,
  fade: defaults.fade,
  controls: defaults.controls,
  paused: defaults.paused,
  respectReducedMotion: defaults.respectReducedMotion,
};

const baseName = (state: StudioState) =>
  (String(state.options.theme) in themes
    ? state.options.theme
    : defaults.theme) as MarqueeThemeName;

const splitItems = (value: unknown) =>
  String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const OPPOSITE = { left: "right", right: "left", up: "down", down: "up" } as const;

/** Options shared by both demo strips */
function common(state: StudioState): MarqueeOptions {
  const o = state.options;
  const cssTokens = Object.fromEntries(Object.entries(state.tokens).filter(([k]) => !isNumeric(k)));
  const num = (key: (typeof NUMERIC_OPTIONS)[number]) =>
    state.tokens[key] !== undefined ? Number.parseFloat(state.tokens[key]) : defaults[key];
  return {
    theme: { ...themes[baseName(state)], ...cssTokens },
    size: o.size as MarqueeOptions["size"],
    speed: num("speed"),
    fadeSize: num("fadeSize"),
    fade: Boolean(o.fade),
    pauseOnHover: Boolean(o.pauseOnHover),
    pauseOnFocus: Boolean(o.pauseOnFocus),
    reverseOnHover: Boolean(o.reverseOnHover),
    draggable: Boolean(o.draggable),
    controls: Boolean(o.controls),
    paused: Boolean(o.paused),
    respectReducedMotion: Boolean(o.respectReducedMotion),
  };
}

/** The big text ticker: plain variant, large type, the panel's separator */
function tickerOptions(state: StudioState): MarqueeOptions {
  const base = common(state);
  return {
    ...base,
    theme: {
      ...(base.theme as Record<string, string>),
      "font-size": "clamp(28px, 7vw, 56px)",
      "font-weight": "800",
    },
    variant: "plain",
    items: TICKER_ITEMS,
    separator: String(state.options.separator),
    direction: state.options.direction as MarqueeOptions["direction"],
    label: "Motto ticker",
  };
}

/** The pill row: the panel's items, variant and rows, running the other way */
function pillOptions(state: StudioState): MarqueeOptions {
  const dir = (state.options.direction as keyof typeof OPPOSITE) ?? "left";
  return {
    ...common(state),
    variant: state.options.variant as MarqueeOptions["variant"],
    items: splitItems(state.options.items),
    rows: Number(state.options.rows) || 1,
    direction: OPPOSITE[dir] ?? "right",
    label: "Tech stack",
  };
}

const isVertical = (state: StudioState) =>
  state.options.direction === "up" || state.options.direction === "down";
const STAGE = {
  horizontal: "flex w-full flex-col justify-center gap-6 py-6",
  vertical: "grid w-full grid-cols-2 gap-4 py-6",
};
const stageClass = (state: StudioState) => (isVertical(state) ? STAGE.vertical : STAGE.horizontal);

function Preview({ state }: { state: StudioState }) {
  return (
    <div className={stageClass(state)}>
      <Marquee {...tickerOptions(state)} />
      <Marquee {...pillOptions(state)} />
    </div>
  );
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

export const marquee: RegistryEntry = {
  ...marqueeMeta,
  themeKey: "theme",
  presets: [
    { name: "Neon ticker", options: { theme: "neon", separator: "◆" }, tokens: { speed: "90" } },
    { name: "Cards", options: { variant: "card", size: "lg" }, tokens: { speed: "40" } },
    { name: "Triple rows", options: { rows: "3", variant: "pill", size: "sm" } },
    { name: "Light vertical", options: { theme: "light", direction: "up" } },
    {
      name: "Drag to scrub",
      options: { theme: "outline", draggable: true },
      tokens: { speed: "30", fadeSize: "96px" },
    },
  ],
  randomizeSkip: [
    "items",
    "separator",
    "paused",
    "controls",
    "respectReducedMotion",
    "draggable",
    "pauseOnFocus",
  ],
  palette: (p) => ({
    bg: p.bg,
    fg: p.fg,
    separator: p.accent,
    border: p.muted,
    "item-border": p.muted,
  }),
  contrastPairs: { fg: "bg", separator: "bg" },
  controls: [
    {
      title: "Content",
      controls: [
        { type: "text", target: "option", key: "items", label: "Items (comma-separated)" },
        { type: "text", target: "option", key: "separator", label: "Separator" },
        select("rows", "Rows", ["1", "2", "3"]),
      ],
    },
    {
      title: "Motion",
      controls: [
        slider("speed", "Speed (px/s)", 0, 400, 5),
        select("direction", "Direction", ["left", "right", "up", "down"]),
        toggle("pauseOnHover", "Pause on hover"),
        toggle("pauseOnFocus", "Pause on focus"),
        toggle("reverseOnHover", "Reverse on hover"),
        toggle("draggable", "Draggable"),
        toggle("paused", "Paused"),
        toggle("respectReducedMotion", "Reduced motion"),
        toggle("controls", "Pause button"),
      ],
    },
    {
      title: "Edges",
      controls: [toggle("fade", "Fade edges"), slider("fadeSize", "Fade size", 0, 200, 4, "px")],
    },
    {
      title: "Theme",
      controls: [
        select("theme", "Preset", Object.keys(themes)),
        color("bg", "Background"),
        color("fg", "Text"),
        color("separator", "Separator"),
        color("border", "Border"),
        color("item-bg", "Item background"),
        color("item-border", "Item border"),
      ],
    },
    {
      title: "Frame",
      controls: [
        select("variant", "Variant", Object.keys(variants)),
        select("size", "Size", Object.keys(sizes)),
        slider("gap", "Gap", 0, 64, 1, "px"),
        slider("radius", "Radius", 0, 32, 1, "px"),
      ],
    },
  ],
  initialState: () => ({ options: { ...initialOptions }, tokens: {} }),
  baseline: (state) => ({
    ...themes[baseName(state)],
    ...sizes[(String(state.options.size) in sizes ? state.options.size : "md") as "md"],
    speed: String(defaults.speed),
    fadeSize: `${defaults.fadeSize}px`,
  }),
  Preview,
  mountVanilla(el, state) {
    const stage = document.createElement("div");
    const tickerEl = document.createElement("div");
    const pillsEl = document.createElement("div");
    stage.className = stageClass(state);
    stage.append(tickerEl, pillsEl);
    el.append(stage);
    const ticker = createMarquee(tickerEl, tickerOptions(state));
    const pills = createMarquee(pillsEl, pillOptions(state));
    return {
      update(next) {
        stage.className = stageClass(next);
        ticker.update(tickerOptions(next));
        pills.update(pillOptions(next));
      },
      destroy() {
        ticker.destroy();
        pills.destroy();
        stage.remove();
      },
    };
  },
  customize(source, state) {
    const base = baseName(state);
    const size = String(state.options.size);
    let out = source;
    // Items and separator are demo content, so they are always written; other options only when changed
    const always = new Set(["items", "separator"]);
    for (const [key, value] of Object.entries(state.options)) {
      if (!always.has(key) && initialOptions[key as keyof typeof initialOptions] === value)
        continue;
      if (key === "items") out = setValue(out, ["defaults"], key, splitItems(value));
      else if (key === "rows") out = setValue(out, ["defaults"], key, Number(value) || 1);
      else out = setValue(out, ["defaults"], key, value);
    }
    for (const [key, value] of Object.entries(state.tokens)) {
      if (isNumeric(key)) out = setValue(out, ["defaults"], key, Number.parseFloat(value));
      else
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
      ? `import { Marquee } from "./Marquee";

export default function Hero() {
  return (
    <>
      <Marquee items={["BUILD", "SHIP", "REPEAT"]} variant="plain" separator="✦" />
      <Marquee direction="right" label="Tech stack">
        <span>React</span>
        <span>TypeScript</span>
        <span>Tailwind CSS</span>
      </Marquee>
    </>
  );
}`
      : `import { createMarquee } from "./marquee";

// Existing children of #stack become the items
const marquee = createMarquee(document.querySelector("#stack")!, { direction: "right" });
marquee.update({ speed: 90, rows: 2 });
marquee.pause();`,
};
