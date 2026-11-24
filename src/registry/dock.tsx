"use client";

import { useState } from "react";
import { Dock } from "@lib/dock/react/Dock";
import {
  defaults,
  sizes,
  themes,
  variants,
  type DockLabels,
  type DockPosition,
  type DockSize,
  type DockThemeName,
  type DockVariant,
} from "@lib/dock/react/dock.config";
import { createDock } from "@lib/dock/vanilla/dock";
import type { DockItem } from "@lib/dock/vanilla/dock.config";
import { hasKey, setValue } from "@/lib/customize-config";
import { dockMeta } from "./dock.meta";
import type { Control, RegistryEntry, StudioState } from "./types";

/** Numeric options exposed as sliders; they live in `defaults`, not in the token presets */
const NUMERIC = ["magnification", "distance"] as const;

const initialOptions = {
  theme: defaults.theme as string,
  variant: defaults.variant as string,
  size: defaults.size as string,
  position: defaults.position as string,
  labels: defaults.labels as string,
  indicator: defaults.indicator,
  bounce: defaults.bounce,
  respectReducedMotion: defaults.respectReducedMotion,
  label: defaults.label,
};

const ITEMS: DockItem[] = [
  { id: "home", label: "Home", icon: "🏠", active: true },
  { id: "search", label: "Search", icon: "🔍" },
  { id: "files", label: "Files", icon: "📁", badge: 3 },
  { id: "music", label: "Music", icon: "🎵", active: true },
  { id: "chat", label: "Chat", icon: "💬", badge: 12 },
  { id: "photos", label: "Photos", icon: "🖼️" },
  { id: "settings", label: "Settings", icon: "⚙️" },
  { id: "trash", label: "Trash", icon: "🗑️" },
];

/** Selecting an app makes it "open" (active); Trash never stays active */
const withActive = (items: DockItem[], id: string) =>
  items.map((item) =>
    item.id === id && id !== "trash" ? { ...item, active: true, badge: undefined } : item,
  );

const baseName = (state: StudioState) =>
  (String(state.options.theme) in themes ? state.options.theme : defaults.theme) as DockThemeName;

/** Options shared by both demos (without items / callbacks) */
function toOptions(state: StudioState) {
  const o = state.options;
  const size = o.size as DockSize;
  const variant = o.variant as DockVariant;
  const tokens = Object.fromEntries(
    Object.entries(state.tokens).filter(([key]) => !(NUMERIC as readonly string[]).includes(key)),
  );
  const number = (key: (typeof NUMERIC)[number]) =>
    state.tokens[key] !== undefined ? Number.parseFloat(state.tokens[key]) : defaults[key];
  return {
    // Same order the copied config resolves: theme ← size ← overrides ← variant
    theme: { ...themes[baseName(state)], ...sizes[size], ...tokens, ...variants[variant] },
    size,
    variant,
    position: o.position as DockPosition,
    labels: o.labels as DockLabels,
    indicator: Boolean(o.indicator),
    bounce: Boolean(o.bounce),
    respectReducedMotion: Boolean(o.respectReducedMotion),
    label: String(o.label),
    magnification: number("magnification"),
    distance: number("distance"),
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
const color = (key: string, label: string): Control => ({
  type: "color",
  target: "token",
  key,
  label,
});
const toggle = (key: string, label: string): Control => ({
  type: "switch",
  target: "option",
  key,
  label,
});

const WALLPAPER =
  "relative h-96 w-full overflow-hidden rounded-lg border bg-neutral-950 bg-[radial-gradient(ellipse_at_top_left,#4c2f8f_0%,transparent_55%),radial-gradient(ellipse_at_bottom_right,#0e5a6b_0%,transparent_55%),radial-gradient(circle_at_70%_20%,#7a2f5f_0%,transparent_40%)]";
const STATUS =
  "pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none text-center text-sm text-white/70";
const SLOT: Record<DockPosition, string> = {
  bottom: "absolute bottom-4 left-1/2 -translate-x-1/2",
  top: "absolute top-4 left-1/2 -translate-x-1/2",
  left: "absolute left-4 top-1/2 -translate-y-1/2",
  right: "absolute right-4 top-1/2 -translate-y-1/2",
};
const statusText = (label: string | null) =>
  label ? `Last selected: ${label}` : "Hover the dock · click or use arrow keys";

function Preview({ state }: { state: StudioState }) {
  const [items, setItems] = useState(ITEMS);
  const [selected, setSelected] = useState<string | null>(null);
  const options = toOptions(state);
  return (
    <div className={WALLPAPER}>
      <p className={STATUS}>{statusText(selected)}</p>
      <div className={SLOT[options.position]}>
        <Dock
          {...options}
          items={items}
          onSelect={(item) => {
            setSelected(item.label);
            setItems((list) => withActive(list, item.id));
          }}
        />
      </div>
    </div>
  );
}

export const dock: RegistryEntry = {
  ...dockMeta,
  themeKey: "theme",
  presets: [
    { name: "Glass", options: { theme: "glass", variant: "floating" } },
    {
      name: "Neon sidebar",
      options: { theme: "neon", position: "left", labels: "hover" },
      tokens: { magnification: "2.2" },
    },
    {
      name: "Flat light",
      options: { theme: "light", variant: "flat", labels: "always", size: "sm" },
      tokens: { magnification: "1.3" },
    },
    { name: "Big zoom", tokens: { magnification: "2.8", distance: "220px", "base-size": "44px" } },
    {
      name: "Outline top",
      options: { theme: "dark", variant: "outline", position: "top", indicator: false },
    },
  ],
  randomizeSkip: ["label", "respectReducedMotion"],
  palette: (p) => ({
    bg: p.bg,
    fg: p.fg,
    border: p.muted,
    "item-bg": p.bg,
    "item-bg-hover": p.muted,
    indicator: p.accent,
    ring: p.accent,
    "badge-bg": p.accent,
    "badge-fg": p.bg,
    "tooltip-bg": p.fg,
    "tooltip-fg": p.bg,
  }),
  contrastPairs: { fg: "item-bg", "tooltip-fg": "tooltip-bg", "badge-fg": "badge-bg" },
  controls: [
    {
      title: "Layout",
      controls: [
        select("position", "Position", ["bottom", "top", "left", "right"]),
        select("labels", "Labels", ["hover", "always", "none"]),
        select("variant", "Variant", Object.keys(variants)),
        select("size", "Size", Object.keys(sizes)),
        slider("base-size", "Base size", 24, 96, 1, "px"),
        slider("gap", "Gap", 0, 32, 1, "px"),
      ],
    },
    {
      title: "Motion",
      controls: [
        slider("magnification", "Magnification", 1, 3, 0.05),
        slider("distance", "Distance", 40, 400, 5, "px"),
        toggle("bounce", "Bounce on click"),
        toggle("indicator", "Active indicator"),
        toggle("respectReducedMotion", "Reduced motion"),
      ],
    },
    {
      title: "Colors",
      controls: [
        select("theme", "Preset", Object.keys(themes)),
        color("bg", "Panel"),
        color("border", "Border"),
        color("fg", "Text"),
        color("item-bg", "Item"),
        color("item-bg-hover", "Item hover"),
        color("indicator", "Indicator"),
        color("ring", "Focus ring"),
        color("badge-bg", "Badge"),
        color("badge-fg", "Badge text"),
        color("tooltip-bg", "Tooltip"),
        color("tooltip-fg", "Tooltip text"),
      ],
    },
    {
      title: "Shape",
      controls: [
        slider("radius", "Radius", 0, 40, 1, "px"),
        slider("item-radius", "Item radius", 0, 40, 1, "px"),
        slider("padding", "Padding", 0, 24, 1, "px"),
        slider("blur", "Blur", 0, 40, 1, "px"),
      ],
    },
    {
      title: "Content",
      controls: [{ type: "text", target: "option", key: "label", label: "Toolbar label" }],
    },
  ],
  initialState: () => ({ options: { ...initialOptions }, tokens: {} }),
  baseline: (state) => ({
    ...themes[baseName(state)],
    ...sizes[state.options.size as DockSize],
    magnification: String(defaults.magnification),
    distance: `${defaults.distance}px`,
  }),
  Preview,
  mountVanilla(el, state) {
    const wallpaper = document.createElement("div");
    const status = document.createElement("p");
    const slot = document.createElement("div");
    wallpaper.className = WALLPAPER;
    status.className = STATUS;
    status.textContent = statusText(null);
    wallpaper.append(status, slot);
    el.append(wallpaper);

    let items = ITEMS;
    const initial = toOptions(state);
    slot.className = SLOT[initial.position];
    const inst = createDock(slot, {
      ...initial,
      items,
      onSelect(item) {
        status.textContent = statusText(item.label);
        items = withActive(items, item.id);
        inst.setItems(items);
      },
    });
    return {
      update(next) {
        const options = toOptions(next);
        slot.className = SLOT[options.position];
        inst.update(options);
      },
      destroy() {
        inst.destroy();
        wallpaper.remove();
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
      if ((NUMERIC as readonly string[]).includes(key))
        out = setValue(out, ["defaults"], key, Number.parseFloat(value));
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
      ? `import { Dock } from "./Dock";

const items = [
  { id: "home", label: "Home", icon: "🏠", active: true },
  { id: "files", label: "Files", icon: "📁", badge: 3 },
  { id: "settings", label: "Settings", icon: "⚙️", href: "/settings" },
];

export default function Desktop() {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2">
      <Dock items={items} magnification={2} onSelect={(item) => console.log(item.id)} />
    </div>
  );
}`
      : `import { createDock } from "./dock";

const dock = createDock(document.querySelector("#dock")!, {
  items: [
    { id: "home", label: "Home", icon: "🏠", active: true },
    { id: "files", label: "Files", icon: "📁", badge: 3 },
  ],
  onSelect: (item) => console.log(item.id),
});
dock.update({ position: "left", theme: "neon" });`,
};
