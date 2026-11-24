"use client";

import { useRef } from "react";
import {
  InteractiveCard,
  type InteractiveCardHandle,
} from "@lib/interactive-card/react/InteractiveCard";
import {
  defaults,
  sizes,
  themes,
  variants,
  type InteractiveCardOptions,
  type InteractiveCardSize,
  type InteractiveCardThemeName,
  type InteractiveCardVariant,
} from "@lib/interactive-card/react/interactive-card.config";
import {
  createInteractiveCard,
  type InteractiveCardInstance,
} from "@lib/interactive-card/vanilla/interactive-card";
import { hasKey, setValue } from "@/lib/customize-config";
import { interactiveCardMeta } from "./interactive-card.meta";
import type { Control, RegistryEntry, StudioState } from "./types";

/** Numeric options edited with sliders (stored as tokens in the panel, written to `defaults`) */
const NUMERIC = {
  maxTilt: "°",
  perspective: "px",
  scale: "",
  glareOpacity: "",
  spotlightSize: "px",
  spotlightOpacity: "",
  reset: "ms",
} as const;
type NumericKey = keyof typeof NUMERIC;
const isNumeric = (key: string): key is NumericKey => key in NUMERIC;

const initialOptions = {
  theme: defaults.theme as string,
  variant: defaults.variant as string,
  size: defaults.size as string,
  effect: defaults.effect as string,
  glare: defaults.glare,
  borderGlow: defaults.borderGlow,
  gyroscope: defaults.gyroscope,
  disabled: defaults.disabled,
  respectReducedMotion: defaults.respectReducedMotion,
};

const baseName = (state: StudioState) =>
  (String(state.options.theme) in themes
    ? state.options.theme
    : defaults.theme) as InteractiveCardThemeName;
const sizeName = (state: StudioState) =>
  (String(state.options.size) in sizes ? state.options.size : defaults.size) as InteractiveCardSize;
const variantName = (state: StudioState) =>
  (String(state.options.variant) in variants
    ? state.options.variant
    : defaults.variant) as InteractiveCardVariant;

function toOptions(state: StudioState): InteractiveCardOptions {
  const o = state.options;
  const tokens: Record<string, string> = {};
  const numbers: Partial<Record<NumericKey, number>> = {};
  for (const [key, value] of Object.entries(state.tokens)) {
    if (isNumeric(key)) numbers[key] = Number.parseFloat(value);
    else tokens[key] = value;
  }
  return {
    ...numbers,
    theme: {
      ...themes[baseName(state)],
      ...sizes[sizeName(state)],
      ...variants[variantName(state)],
      ...tokens,
    },
    size: sizeName(state),
    variant: variantName(state),
    effect: o.effect as InteractiveCardOptions["effect"],
    glare: Boolean(o.glare),
    borderGlow: Boolean(o.borderGlow),
    gyroscope: Boolean(o.gyroscope),
    disabled: Boolean(o.disabled),
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

/* Demo content */
const FEATURES = [
  {
    icon: "⚡",
    title: "Instant",
    text: "Pointer position drives CSS variables on every animation frame.",
  },
  {
    icon: "🎛️",
    title: "Tunable",
    text: "Tilt, perspective, glare and spotlight are all options or tokens.",
  },
  {
    icon: "♿",
    title: "Accessible",
    text: "Keyboard focus shows a static spotlight; reduced motion is respected.",
  },
];

const STAGE = "relative w-full overflow-hidden px-4 py-10 sm:px-8";
const BLOB_A =
  "pointer-events-none absolute -top-10 left-1/4 size-56 rounded-full bg-indigo-500/25 blur-3xl";
const BLOB_B =
  "pointer-events-none absolute -bottom-12 right-1/5 size-64 rounded-full bg-fuchsia-500/20 blur-3xl";
const GRID = "relative mx-auto grid w-full max-w-4xl grid-cols-1 gap-5 sm:grid-cols-3";
const ICON = "mb-4 block text-3xl leading-none";
const TITLE = "mb-2 text-[1.15em] font-semibold tracking-tight";
const TEXT = "mb-5 text-[0.95em] leading-relaxed opacity-70";
const LINK =
  "rounded-md text-[0.9em] font-medium underline-offset-4 opacity-90 hover:underline focus-visible:underline focus-visible:outline-none";
const RESET_BUTTON =
  "relative mx-auto mt-6 block rounded-md border border-white/15 bg-black/40 px-2.5 py-1 text-xs text-neutral-300 hover:bg-black/60";

function Preview({ state }: { state: StudioState }) {
  const refs = useRef<(InteractiveCardHandle | null)[]>([]);
  const options = toOptions(state);
  return (
    <div className={STAGE}>
      <div className={BLOB_A} aria-hidden="true" />
      <div className={BLOB_B} aria-hidden="true" />
      <div className={GRID}>
        {FEATURES.map((f, i) => (
          <InteractiveCard
            key={f.title}
            ref={(handle) => {
              refs.current[i] = handle;
            }}
            {...options}
          >
            <span className={ICON} aria-hidden="true">
              {f.icon}
            </span>
            <h3 className={TITLE}>{f.title}</h3>
            <p className={TEXT}>{f.text}</p>
            <button type="button" className={LINK}>
              Learn more →
            </button>
          </InteractiveCard>
        ))}
      </div>
      <button
        type="button"
        className={RESET_BUTTON}
        onClick={() => refs.current.forEach((r) => r?.reset())}
      >
        reset()
      </button>
    </div>
  );
}

function featureContent(f: (typeof FEATURES)[number]): HTMLElement {
  const wrap = document.createElement("div");
  const icon = document.createElement("span");
  const title = document.createElement("h3");
  const text = document.createElement("p");
  const link = document.createElement("button");
  icon.className = ICON;
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = f.icon;
  title.className = TITLE;
  title.textContent = f.title;
  text.className = TEXT;
  text.textContent = f.text;
  link.type = "button";
  link.className = LINK;
  link.textContent = "Learn more →";
  wrap.append(icon, title, text, link);
  return wrap;
}

export const interactiveCard: RegistryEntry = {
  ...interactiveCardMeta,
  themeKey: "theme",
  presets: [
    { name: "Glass", options: { theme: "glass" } },
    {
      name: "Neon outline",
      options: { theme: "neon", variant: "outline" },
      tokens: { spotlightOpacity: "0.35", spotlightSize: "480px" },
    },
    {
      name: "Strong tilt",
      tokens: { maxTilt: "22°", perspective: "600px", scale: "1.06", glareOpacity: "0.3" },
    },
    {
      name: "Spotlight only",
      options: { effect: "spotlight" },
      tokens: { spotlightSize: "520px" },
    },
    { name: "Light elevated", options: { theme: "light", variant: "elevated" } },
  ],
  randomizeSkip: ["disabled", "respectReducedMotion", "gyroscope"],
  palette: (p) => ({ bg: p.bg, fg: p.fg, border: p.muted, spotlight: p.accent }),
  contrastPairs: { fg: "bg" },
  controls: [
    {
      title: "Theme",
      controls: [
        select("theme", "Preset", Object.keys(themes)),
        color("bg", "Background"),
        color("fg", "Text"),
        color("border", "Border"),
        color("spotlight", "Spotlight"),
        color("glare", "Glare"),
      ],
    },
    {
      title: "Tilt",
      controls: [
        select("effect", "Effect", ["both", "spotlight", "tilt"]),
        slider("maxTilt", "Max tilt", 0, 30, 1, "°"),
        slider("perspective", "Perspective", 200, 3000, 50, "px"),
        slider("scale", "Hover scale", 1, 1.15, 0.01),
        toggle("glare", "Glare"),
        slider("glareOpacity", "Glare opacity", 0, 1, 0.05),
        slider("reset", "Reset", 0, 1500, 50, "ms"),
      ],
    },
    {
      title: "Spotlight",
      controls: [
        slider("spotlightSize", "Size", 80, 800, 10, "px"),
        slider("spotlightOpacity", "Opacity", 0, 1, 0.01),
        toggle("borderGlow", "Border glow"),
      ],
    },
    {
      title: "Frame",
      controls: [
        select("variant", "Variant", Object.keys(variants)),
        select("size", "Size", Object.keys(sizes)),
        slider("radius", "Radius", 0, 40, 1, "px"),
        slider("padding", "Padding", 8, 48, 1, "px"),
        slider("blur", "Backdrop blur", 0, 40, 1, "px"),
      ],
    },
    {
      title: "Behavior",
      controls: [
        toggle("gyroscope", "Gyroscope"),
        toggle("disabled", "Disabled"),
        toggle("respectReducedMotion", "Reduced motion"),
      ],
    },
  ],
  initialState: () => ({ options: { ...initialOptions }, tokens: {} }),
  baseline(state) {
    const numeric = Object.fromEntries(
      (Object.keys(NUMERIC) as NumericKey[]).map((key) => [key, `${defaults[key]}${NUMERIC[key]}`]),
    );
    return {
      ...themes[baseName(state)],
      ...sizes[sizeName(state)],
      ...variants[variantName(state)],
      ...numeric,
    };
  },
  Preview,
  mountVanilla(el, state) {
    const stage = document.createElement("div");
    const blobA = document.createElement("div");
    const blobB = document.createElement("div");
    const grid = document.createElement("div");
    const button = document.createElement("button");
    stage.className = STAGE;
    blobA.className = BLOB_A;
    blobB.className = BLOB_B;
    blobA.setAttribute("aria-hidden", "true");
    blobB.setAttribute("aria-hidden", "true");
    grid.className = GRID;
    button.type = "button";
    button.className = RESET_BUTTON;
    button.textContent = "reset()";
    stage.append(blobA, blobB, grid, button);
    el.append(stage);
    const cards: InteractiveCardInstance[] = FEATURES.map((f) =>
      createInteractiveCard(grid, { ...toOptions(state), content: featureContent(f) }),
    );
    const onReset = () => cards.forEach((c) => c.reset());
    button.addEventListener("click", onReset);
    return {
      update(next) {
        const options = toOptions(next);
        cards.forEach((c) => c.update(options));
      },
      destroy() {
        button.removeEventListener("click", onReset);
        cards.forEach((c) => c.destroy());
        stage.remove();
      },
    };
  },
  customize(source, state) {
    const base = baseName(state);
    const size = sizeName(state);
    const variant = variantName(state);
    let out = source;
    for (const [key, value] of Object.entries(state.options)) {
      if (initialOptions[key as keyof typeof initialOptions] !== value)
        out = setValue(out, ["defaults"], key, value);
    }
    for (const [key, value] of Object.entries(state.tokens)) {
      if (isNumeric(key)) {
        out = setValue(out, ["defaults"], key, Number.parseFloat(value));
        continue;
      }
      const path = hasKey(out, ["variants", variant], key)
        ? ["variants", variant]
        : hasKey(out, ["sizes", size], key)
          ? ["sizes", size]
          : ["themes", base];
      out = setValue(out, path, key, value);
    }
    return out;
  },
  usage: (framework) =>
    framework === "react"
      ? `import { InteractiveCard } from "./InteractiveCard";

export default function Feature() {
  return (
    <InteractiveCard theme="glass" maxTilt={12} className="w-80">
      <h3>Instant</h3>
      <p>Spotlight and 3D tilt that follow the pointer.</p>
    </InteractiveCard>
  );
}`
      : `import { createInteractiveCard } from "./interactive-card";

// The container's existing children are moved into the card
const card = createInteractiveCard(document.querySelector("#feature")!, { theme: "glass" });
card.update({ effect: "spotlight", spotlightSize: 480 });
card.reset();`,
};
