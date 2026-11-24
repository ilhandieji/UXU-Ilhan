"use client";

import { MagneticButton } from "@lib/magnetic-button/react/MagneticButton";
import {
  defaults,
  resolveSettings,
  resolveTokens,
  sizes,
  themes,
  variants,
  type MagneticButtonOptions,
  type MagneticButtonSize,
  type MagneticButtonThemeName,
  type MagneticButtonVariant,
} from "@lib/magnetic-button/react/magnetic-button.config";
import { createMagneticButton } from "@lib/magnetic-button/vanilla/magnetic-button";
import { hasKey, setValue } from "@/lib/customize-config";
import { magneticButtonMeta } from "./magnetic-button.meta";
import type { Control, RegistryEntry, StudioState } from "./types";

/** Slider keys that are numeric options (not CSS tokens); `magnetRadius` = option `radius` */
const NUMERIC = {
  strength: "strength",
  magnetRadius: "radius",
  textStrength: "textStrength",
  ease: "ease",
  returnDuration: "returnDuration",
  scaleOnHover: "scaleOnHover",
} as const;
type NumericKey = keyof typeof NUMERIC;
const isNumeric = (key: string): key is NumericKey => key in NUMERIC;

const initialOptions = {
  theme: defaults.theme as string,
  variant: defaults.variant as string,
  size: defaults.size as string,
  label: defaults.label,
  icon: defaults.icon,
  ripple: defaults.ripple,
  disabled: defaults.disabled,
  respectReducedMotion: defaults.respectReducedMotion,
};

const baseName = (state: StudioState) =>
  (String(state.options.theme) in themes
    ? state.options.theme
    : defaults.theme) as MagneticButtonThemeName;
const sizeName = (state: StudioState) =>
  (String(state.options.size) in sizes ? state.options.size : defaults.size) as MagneticButtonSize;
const variantName = (state: StudioState) =>
  (String(state.options.variant) in variants
    ? state.options.variant
    : defaults.variant) as MagneticButtonVariant;

function toOptions(state: StudioState): MagneticButtonOptions {
  const o = state.options;
  const tokens: Record<string, string> = {};
  const numbers: Partial<Record<(typeof NUMERIC)[NumericKey], number>> = {};
  for (const [key, value] of Object.entries(state.tokens)) {
    if (isNumeric(key)) numbers[NUMERIC[key]] = Number.parseFloat(value);
    else tokens[key] = value;
  }
  return {
    ...numbers,
    theme: baseName(state),
    variant: variantName(state),
    size: sizeName(state),
    tokens,
    label: String(o.label),
    icon: Boolean(o.icon),
    ripple: Boolean(o.ripple),
    disabled: Boolean(o.disabled),
    respectReducedMotion: Boolean(o.respectReducedMotion),
  };
}

/** The three demo buttons: the configured one, an outline "GitHub" link and a round icon button */
function demoButtons(state: StudioState): MagneticButtonOptions[] {
  const main = toOptions(state);
  const padY = state.tokens["padding-y"] ?? sizes[sizeName(state)]["padding-y"];
  return [
    main,
    {
      ...main,
      as: "a",
      href: "https://github.com",
      label: "GitHub",
      icon: false,
      variant: "outline",
    },
    {
      ...main,
      label: "",
      ariaLabel: "Next",
      icon: true,
      variant: "pill",
      tokens: { ...main.tokens, "padding-x": padY, radius: "9999px" },
    },
  ];
}

const surface = (light: boolean) =>
  light
    ? "flex min-h-112 w-full flex-wrap items-center justify-center gap-6 rounded-lg border bg-neutral-100 p-8"
    : "flex min-h-112 w-full flex-wrap items-center justify-center gap-6 rounded-lg border bg-neutral-950 p-8";
const HOST = "inline-flex";

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

function Preview({ state }: { state: StudioState }) {
  const [main, link, round] = demoButtons(state);
  return (
    <div className={surface(state.options.theme === "light")}>
      <MagneticButton {...main} />
      <MagneticButton {...link} target="_blank" rel="noreferrer" />
      <MagneticButton {...round} />
    </div>
  );
}

export const magneticButton: RegistryEntry = {
  ...magneticButtonMeta,
  themeKey: "theme",
  presets: [
    { name: "Brand pill", options: { theme: "brand", variant: "pill" } },
    { name: "Light outline", options: { theme: "light", variant: "outline" } },
    {
      name: "Sticky",
      tokens: { strength: "0.7", ease: "0.35", textStrength: "0.3", magnetRadius: "140px" },
    },
    {
      name: "Subtle ghost",
      options: { theme: "ghost", ripple: false },
      tokens: { strength: "0.2", textStrength: "0.08", scaleOnHover: "1" },
    },
    {
      name: "Big & slow",
      options: { size: "lg", theme: "brand" },
      tokens: { ease: "0.06", returnDuration: "1400ms", magnetRadius: "160px" },
    },
  ],
  randomizeSkip: ["label", "disabled", "respectReducedMotion"],
  palette: (p) => ({
    bg: p.fg,
    fg: p.bg,
    border: p.muted,
    "bg-hover": p.accent,
    "fg-hover": p.bg,
    ring: p.accent,
    ripple: p.accent,
  }),
  contrastPairs: { fg: "bg", "fg-hover": "bg-hover" },
  controls: [
    {
      title: "Magnet",
      controls: [
        slider("strength", "Strength", 0, 1, 0.05),
        slider("magnetRadius", "Magnet radius", 0, 300, 5, "px"),
        slider("textStrength", "Label parallax", 0, 1, 0.05),
        slider("ease", "Ease", 0.02, 1, 0.01),
        slider("returnDuration", "Return duration", 0, 2000, 50, "ms"),
        slider("scaleOnHover", "Hover scale", 1, 1.3, 0.01),
        toggle("ripple", "Ripple"),
        toggle("respectReducedMotion", "Reduced motion"),
      ],
    },
    {
      title: "Theme",
      controls: [
        select("theme", "Preset", Object.keys(themes)),
        color("bg", "Background"),
        color("fg", "Text"),
        color("border", "Border"),
        color("bg-hover", "Hover background"),
        color("fg-hover", "Hover text"),
        color("ring", "Focus ring"),
        color("ripple", "Ripple"),
      ],
    },
    {
      title: "Frame",
      controls: [
        select("variant", "Variant", Object.keys(variants)),
        select("size", "Size", Object.keys(sizes)),
        slider("radius", "Corner radius", 0, 40, 1, "px"),
        slider("font-size", "Font size", 11, 24, 1, "px"),
        slider("padding-x", "Padding X", 6, 48, 1, "px"),
        slider("padding-y", "Padding Y", 4, 28, 1, "px"),
        select("font-weight", "Font weight", ["400", "500", "600", "700"]),
      ],
    },
    {
      title: "Content",
      controls: [
        { type: "text", target: "option", key: "label", label: "Label" },
        toggle("icon", "Arrow icon"),
        toggle("disabled", "Disabled"),
      ],
    },
  ],
  initialState: () => ({ options: { ...initialOptions }, tokens: {} }),
  baseline(state) {
    const vars = resolveTokens(
      resolveSettings({
        theme: baseName(state),
        size: sizeName(state),
        variant: variantName(state),
      }),
    );
    const tokens = Object.fromEntries(
      Object.entries(vars).map(([name, value]) => [
        name.replace("--ux-magnetic-button-", ""),
        value,
      ]),
    );
    const numbers = Object.fromEntries(
      (Object.keys(NUMERIC) as NumericKey[]).map((key) => [key, String(defaults[NUMERIC[key]])]),
    );
    return { ...tokens, ...numbers };
  },
  Preview,
  mountVanilla(el, state) {
    const surfaceEl = document.createElement("div");
    el.append(surfaceEl);
    const setSurface = (next: StudioState) => {
      surfaceEl.className = surface(next.options.theme === "light");
    };
    setSurface(state);
    const instances = demoButtons(state).map((options, i) => {
      const host = document.createElement("span");
      host.className = HOST;
      surfaceEl.append(host);
      const inst = createMagneticButton(host, options);
      if (i === 1) {
        inst.element.setAttribute("target", "_blank");
        inst.element.setAttribute("rel", "noreferrer");
      }
      return inst;
    });
    return {
      update(next) {
        setSurface(next);
        demoButtons(next).forEach((options, i) => instances[i].update(options));
      },
      destroy() {
        for (const inst of instances) inst.destroy();
        surfaceEl.remove();
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
        out = setValue(out, ["defaults"], NUMERIC[key], Number.parseFloat(value));
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
      ? `import { MagneticButton } from "./MagneticButton";

export default function Hero() {
  return (
    <div className="flex gap-4">
      <MagneticButton theme="brand" variant="pill" onClick={() => console.log("go")}>
        Get started
      </MagneticButton>
      <MagneticButton as="a" href="https://github.com" variant="outline" icon={false} label="GitHub" />
    </div>
  );
}`
      : `import { createMagneticButton } from "./magnetic-button";

// Enhances <div id="cta"><button>Get started</button></div>, or creates a button if empty
const cta = createMagneticButton(document.querySelector("#cta")!, { theme: "brand", strength: 0.5 });
cta.element.addEventListener("click", () => console.log("go"));
cta.update({ variant: "pill" });`,
};
