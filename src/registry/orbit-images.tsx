"use client";

import { useRef } from "react";
import { OrbitImages, type OrbitImagesHandle } from "@lib/orbit-images/react/OrbitImages";
import {
  defaults,
  sizes,
  themes,
  variants,
  type OrbitImagesLook,
  type OrbitImagesOptions,
  type OrbitImagesThemeName,
} from "@lib/orbit-images/react/orbit-images.config";
import { createOrbitImages } from "@lib/orbit-images/vanilla/orbit-images";
import { setValue } from "@/lib/customize-config";
import { orbitImagesMeta } from "./orbit-images.meta";
import type { Control, RegistryEntry, StudioState } from "./types";

/** Look values live in `themes`; the remaining tunables live in `defaults` */
const LOOK_KEYS = Object.keys(themes.orbit) as (keyof OrbitImagesLook)[];
const STRING_KEYS = new Set(["shape", "direction", "easing", "pathColor"]);
const BOOLEAN_KEYS = new Set(["fill", "showPath", "alignToPath"]);
const EXTRA_KEYS = [
  "pathColor",
  "pathWidth",
  "wheelSpeed",
  "scrollSpeed",
  "gap",
  "sides",
  "petals",
  "waveCount",
  "starPoints",
] as const;
/** Playground-only switches, never written to the copied config */
const DEMO_ONLY = new Set(["center"]);

const initialOptions = {
  theme: defaults.theme as string,
  variant: defaults.variant as string,
  size: defaults.size as string,
  captions: defaults.captions as string,
  wheel: defaults.wheel as string,
  paused: defaults.paused,
  intro: defaults.intro,
  draggable: defaults.draggable,
  clickToFront: defaults.clickToFront,
  keyboard: defaults.keyboard,
  scrollLink: defaults.scrollLink,
  touchHold: defaults.touchHold,
  center: false,
};

const baseName = (state: StudioState) =>
  (String(state.options.theme) in themes
    ? state.options.theme
    : defaults.theme) as OrbitImagesThemeName;

function toValue(key: string, value: string): string | number | boolean {
  if (BOOLEAN_KEYS.has(key)) return value === "true";
  if (STRING_KEYS.has(key)) return value;
  return Number.parseFloat(value);
}

function toOptions(state: StudioState): OrbitImagesOptions {
  const o = state.options;
  const tokens = Object.fromEntries(
    Object.entries(state.tokens).map(([key, value]) => [key, toValue(key, value)]),
  );
  return {
    ...tokens,
    theme: baseName(state),
    variant: o.variant as OrbitImagesOptions["variant"],
    size: o.size as OrbitImagesOptions["size"],
    captions: o.captions as OrbitImagesOptions["captions"],
    wheel: o.wheel as OrbitImagesOptions["wheel"],
    paused: Boolean(o.paused),
    intro: Boolean(o.intro),
    draggable: Boolean(o.draggable),
    clickToFront: Boolean(o.clickToFront),
    keyboard: Boolean(o.keyboard),
    scrollLink: Boolean(o.scrollLink),
    touchHold: Boolean(o.touchHold),
    height: "100%",
  };
}

const optionSelect = (key: string, label: string, values: string[]): Control => ({
  type: "select",
  target: "option",
  key,
  label,
  choices: values.map((value) => ({ label: value, value })),
});
const tokenSelect = (key: string, label: string, values: string[]): Control => ({
  type: "select",
  target: "token",
  key,
  label,
  choices: values.map((value) => ({ label: value, value })),
});
const onOff = (key: string, label: string): Control => ({
  type: "select",
  target: "token",
  key,
  label,
  choices: [
    { label: "on", value: "true" },
    { label: "off", value: "false" },
  ],
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

const SURFACE =
  "relative h-112 w-full overflow-hidden rounded-lg border bg-neutral-950 p-6 text-neutral-100";
const CENTER_TEXT = "text-[clamp(22px,4vw,40px)] font-semibold tracking-tight";
const BUTTONS = "absolute right-3 bottom-3 z-300 flex gap-2";
const BUTTON =
  "rounded-md border border-white/15 bg-black/50 px-2.5 py-1 text-xs text-neutral-300 hover:bg-black/70";

function Preview({ state }: { state: StudioState }) {
  const ref = useRef<OrbitImagesHandle>(null);
  return (
    <div className={SURFACE}>
      <OrbitImages
        ref={ref}
        {...toOptions(state)}
        centerContent={
          state.options.center ? <span className={CENTER_TEXT}>Moments</span> : undefined
        }
      />
      <div className={BUTTONS}>
        <button type="button" className={BUTTON} onClick={() => ref.current?.prev()}>
          prev()
        </button>
        <button type="button" className={BUTTON} onClick={() => ref.current?.next()}>
          next()
        </button>
      </div>
    </div>
  );
}

export const orbitImages: RegistryEntry = {
  ...orbitImagesMeta,
  themeKey: "theme",
  presets: [
    { name: "Heart", tokens: { shape: "heart", radius: "220" } },
    { name: "Infinity slow", tokens: { shape: "infinity", duration: "40s" } },
    { name: "Star tilt", tokens: { shape: "star", tilt: "18°", starPoints: "6" } },
    { name: "Flower", tokens: { shape: "flower", petals: "6", showPath: "true" } },
  ],
  randomizeSkip: ["paused", "intro", "scrollLink", "variant"],
  palette: (p) => ({ pathColor: p.accent }),
  controls: [
    {
      title: "Preset & Shape",
      controls: [
        optionSelect("theme", "Preset", Object.keys(themes)),
        tokenSelect("shape", "Shape", [
          "ellipse",
          "circle",
          "square",
          "rectangle",
          "triangle",
          "star",
          "heart",
          "infinity",
          "wave",
          "polygon",
          "flower",
        ]),
        slider("radiusX", "Radius X", 100, 600, 10),
        slider("radiusY", "Radius Y", 20, 400, 10),
        slider("radius", "Radius", 60, 400, 10),
        slider("rotation", "Rotation", -45, 45, 1, "°"),
        slider("sides", "Polygon sides", 3, 12, 1),
        slider("petals", "Flower petals", 2, 12, 1),
        slider("starPoints", "Star points", 3, 12, 1),
        slider("waveCount", "Waves", 1, 8, 1),
      ],
    },
    {
      title: "Motion",
      controls: [
        slider("duration", "Duration", 4, 60, 1, "s"),
        tokenSelect("direction", "Direction", ["normal", "reverse"]),
        tokenSelect("easing", "Easing", ["linear", "easeIn", "easeOut", "easeInOut"]),
        onOff("fill", "Fill path"),
        slider("gap", "Train gap", 0.8, 4, 0.1),
        slider("hoverSpeed", "Hover speed", 0, 1, 0.05),
        toggle("paused", "Paused"),
        toggle("intro", "Intro"),
      ],
    },
    {
      title: "Look",
      controls: [
        optionSelect("variant", "Variant", Object.keys(variants)),
        optionSelect("size", "Size", Object.keys(sizes)),
        slider("itemSize", "Item size", 30, 160, 2),
        slider("itemRadius", "Item radius", 0, 80, 1),
        slider("depth", "Depth", 0, 1, 0.05),
        slider("shadow", "Shadow", 0, 1, 0.05),
        slider("hoverScale", "Hover scale", 1, 1.5, 0.01),
        slider("spotlight", "Spotlight", 0, 1, 0.05),
        slider("backBlur", "Back blur", 0, 8, 0.5, "px"),
        onOff("alignToPath", "Align to path"),
        optionSelect("captions", "Captions", ["off", "hover", "front", "always"]),
        toggle("center", "Center content"),
      ],
    },
    {
      title: "Path",
      controls: [
        onOff("showPath", "Show path"),
        { type: "color", target: "token", key: "pathColor", label: "Path color" },
        slider("pathWidth", "Path width", 0.5, 8, 0.5, "px"),
        slider("pathDash", "Path dash", 0, 20, 1, "px"),
      ],
    },
    {
      title: "Interaction",
      controls: [
        optionSelect("wheel", "Mouse wheel", ["off", "hover", "focus"]),
        slider("wheelSpeed", "Wheel speed", 0.1, 4, 0.1),
        toggle("scrollLink", "Page scroll link"),
        slider("scrollSpeed", "Scroll speed", -2, 2, 0.1),
        slider("tilt", "3D tilt", 0, 30, 1, "°"),
        toggle("draggable", "Drag / swipe"),
        toggle("touchHold", "Touch hold slows"),
        toggle("clickToFront", "Click to front"),
        toggle("keyboard", "Arrow keys"),
      ],
    },
  ],
  initialState: () => ({ options: { ...initialOptions }, tokens: {} }),
  baseline(state) {
    const preset = themes[baseName(state)];
    const look = Object.fromEntries(LOOK_KEYS.map((key) => [key, String(preset[key])]));
    const extra = Object.fromEntries(EXTRA_KEYS.map((key) => [key, String(defaults[key])]));
    return { ...look, ...extra };
  },
  Preview,
  mountVanilla(el, state) {
    const surface = document.createElement("div");
    surface.className = SURFACE;
    const buttons = document.createElement("div");
    buttons.className = BUTTONS;
    const make = (label: string, action: () => void) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = BUTTON;
      button.textContent = label;
      button.addEventListener("click", action);
      return button;
    };
    el.append(surface);
    const centerFor = (next: StudioState) => {
      if (!next.options.center) return "";
      const span = document.createElement("span");
      span.className = CENTER_TEXT;
      span.textContent = "Moments";
      return span;
    };
    const inst = createOrbitImages(surface, {
      ...toOptions(state),
      centerContent: centerFor(state),
    });
    buttons.append(
      make("prev()", () => inst.prev()),
      make("next()", () => inst.next()),
    );
    surface.append(buttons);
    let center = Boolean(state.options.center);
    return {
      update(next) {
        const nextCenter = Boolean(next.options.center);
        const changed = nextCenter !== center;
        center = nextCenter;
        inst.update({ ...toOptions(next), ...(changed ? { centerContent: centerFor(next) } : {}) });
      },
      destroy() {
        inst.destroy();
        surface.remove();
      },
    };
  },
  customize(source, state) {
    const base = baseName(state);
    let out = source;
    for (const [key, value] of Object.entries(state.options)) {
      if (DEMO_ONLY.has(key)) continue;
      if (initialOptions[key as keyof typeof initialOptions] !== value)
        out = setValue(out, ["defaults"], key, value);
    }
    for (const [key, value] of Object.entries(state.tokens)) {
      const isLook = (LOOK_KEYS as string[]).includes(key);
      out = setValue(out, isLook ? ["themes", base] : ["defaults"], key, toValue(key, value));
    }
    return out;
  },
  usage: (framework) =>
    framework === "react"
      ? `import { OrbitImages } from "./OrbitImages";

export default function Gallery() {
  return (
    <OrbitImages
      theme="carousel"
      images={["/a.jpg", "/b.jpg", { src: "/c.jpg", alt: "Team", caption: "Team" }]}
      wheel="hover"
      centerContent={<h2>Moments</h2>}
      onActiveChange={(index) => console.log(index)}
    />
  );
}`
      : `import { createOrbitImages } from "./orbit-images";

const orbit = createOrbitImages(document.querySelector("#gallery")!, {
  theme: "carousel",
  images: ["/a.jpg", "/b.jpg", "/c.jpg"],
  centerContent: "Moments",
});
orbit.next();`,
};
