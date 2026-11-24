"use client";

import { useState } from "react";
import { CommandPalette } from "@lib/command-palette/react/CommandPalette";
import {
  defaults,
  sizes,
  themes,
  type CommandPaletteItem,
  type CommandPaletteOptions,
  type CommandPaletteSize,
  type CommandPaletteThemeName,
} from "@lib/command-palette/react/command-palette.config";
import {
  createCommandPalette,
  type CommandPaletteInstance,
} from "@lib/command-palette/vanilla/command-palette";
import { hasKey, setValue } from "@/lib/customize-config";
import { commandPaletteMeta } from "./command-palette.meta";
import type { Control, RegistryEntry, StudioState } from "./types";

const SAMPLE_ITEMS: CommandPaletteItem[] = [
  {
    id: "home",
    label: "Go to Home",
    group: "Navigation",
    icon: "🏠",
    href: "#home",
    shortcut: ["G", "H"],
  },
  {
    id: "docs",
    label: "Documentation",
    group: "Navigation",
    icon: "📚",
    href: "#docs",
    keywords: ["guide", "help"],
  },
  {
    id: "components",
    label: "Browse components",
    group: "Navigation",
    icon: "🧩",
    href: "#components",
  },
  {
    id: "changelog",
    label: "Changelog",
    group: "Navigation",
    icon: "📝",
    href: "#changelog",
    keywords: ["release", "news"],
  },
  { id: "new-file", label: "New file", group: "Actions", icon: "📄", shortcut: ["Ctrl", "N"] },
  {
    id: "search-files",
    label: "Search in files",
    group: "Actions",
    icon: "🔎",
    shortcut: ["Ctrl", "Shift", "F"],
    keywords: ["grep", "find"],
  },
  { id: "copy-link", label: "Copy link", group: "Actions", icon: "🔗", keywords: ["url", "share"] },
  { id: "deploy", label: "Deploy to production", group: "Actions", icon: "🚀", disabled: true },
  {
    id: "theme-dark",
    label: "Switch to dark theme",
    group: "Theme",
    icon: "🌙",
    keywords: ["night", "mode"],
  },
  {
    id: "theme-light",
    label: "Switch to light theme",
    group: "Theme",
    icon: "☀️",
    keywords: ["day", "mode"],
  },
  { id: "theme-system", label: "Use system theme", group: "Theme", icon: "💻", keywords: ["auto"] },
  { id: "logout", label: "Sign out", group: "Account", icon: "👋", keywords: ["logout", "exit"] },
];

/** Panel options; `hotkey` is a switch here and becomes "mod+k" / "" in the config */
const initialOptions = {
  theme: defaults.theme as string,
  variant: "inline",
  size: defaults.size as string,
  placeholder: defaults.placeholder,
  emptyText: defaults.emptyText,
  hotkey: true,
  showGroups: defaults.showGroups,
  footer: defaults.footer,
  closeOnSelect: defaults.closeOnSelect,
};

/** What each option is in the copied config (the playground starts on the inline variant) */
const configDefaults: Record<string, string | boolean> = {
  ...initialOptions,
  variant: defaults.variant,
};

const read = (state: StudioState) => ({
  base: (String(state.options.theme) in themes
    ? state.options.theme
    : defaults.theme) as CommandPaletteThemeName,
  size: (String(state.options.size) in sizes
    ? state.options.size
    : defaults.size) as CommandPaletteSize,
});

function toOptions(state: StudioState): CommandPaletteOptions {
  const o = state.options;
  const { base, size } = read(state);
  return {
    theme: { ...themes[base], ...sizes[size], ...state.tokens },
    size,
    placeholder: String(o.placeholder),
    emptyText: String(o.emptyText),
    hotkey: o.hotkey ? defaults.hotkey : "",
    showGroups: Boolean(o.showGroups),
    footer: Boolean(o.footer),
    closeOnSelect: Boolean(o.closeOnSelect),
  };
}

const isInline = (state: StudioState) => state.options.variant === "inline";

const ROOT = "flex min-h-112 w-full flex-col items-center gap-4 p-4";
const BAR =
  "flex w-full max-w-2xl flex-wrap items-center justify-between gap-3 text-sm text-neutral-400";
const BUTTON =
  "rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-neutral-200 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400";
const HINT = "text-center text-sm text-neutral-500";
const statusText = (label: string | null) => `Last selected: ${label ?? "—"}`;
const hintText = "Press Ctrl/⌘ + K or the button to open the dialog";

function Preview({ state }: { state: StudioState }) {
  const [open, setOpen] = useState(false);
  const [last, setLast] = useState<string | null>(null);
  const options = toOptions(state);
  const inline = isInline(state);
  const onSelect = (item: CommandPaletteItem) => {
    setLast(item.label);
    return true; // handled: the demo never navigates
  };
  return (
    <div className={ROOT}>
      <div className={BAR}>
        <button type="button" className={BUTTON} onClick={() => setOpen(true)}>
          Open dialog
        </button>
        <span aria-live="polite">{statusText(last)}</span>
      </div>
      {inline ? (
        <CommandPalette {...options} variant="inline" items={SAMPLE_ITEMS} onSelect={onSelect} />
      ) : (
        <p className={HINT}>{options.hotkey ? hintText : "Use the button to open the dialog"}</p>
      )}
      <CommandPalette
        {...options}
        variant="dialog"
        hotkey={inline ? "" : options.hotkey}
        items={SAMPLE_ITEMS}
        open={open}
        onOpenChange={setOpen}
        onSelect={onSelect}
      />
    </div>
  );
}

const color = (key: string, label: string): Control => ({
  type: "color",
  target: "token",
  key,
  label,
});
const slider = (key: string, label: string, min: number, max: number, step: number): Control => ({
  type: "slider",
  target: "token",
  key,
  label,
  min,
  max,
  step,
  unit: "px",
});
const select = (key: string, label: string, values: string[]): Control => ({
  type: "select",
  target: "option",
  key,
  label,
  choices: values.map((value) => ({ label: value, value })),
});
const toggle = (key: string, label: string): Control => ({
  type: "switch",
  target: "option",
  key,
  label,
});
const text = (key: string, label: string): Control => ({
  type: "text",
  target: "option",
  key,
  label,
});

export const commandPalette: RegistryEntry = {
  ...commandPaletteMeta,
  themeKey: "theme",
  presets: [
    { name: "Terminal", options: { theme: "terminal", size: "md" } },
    { name: "Light compact", options: { theme: "light", size: "sm" } },
    {
      name: "Wide & tall",
      options: { size: "lg" },
      tokens: { width: "760px", "max-height": "480px" },
    },
    { name: "Flat list", options: { showGroups: false, footer: false } },
    { name: "Soft", tokens: { radius: "24px", "item-radius": "12px" } },
  ],
  randomizeSkip: ["placeholder", "emptyText", "variant", "hotkey", "closeOnSelect", "width"],
  palette: (p) => ({ bg: p.bg, fg: p.fg, muted: p.muted, border: p.muted, highlight: p.accent }),
  contrastPairs: { fg: "bg", muted: "bg", highlight: "bg", "accent-fg": "accent" },
  controls: [
    {
      title: "Theme",
      controls: [
        select("theme", "Preset", Object.keys(themes)),
        color("bg", "Background"),
        color("fg", "Text"),
        color("muted", "Muted text"),
        color("accent", "Active row"),
        color("accent-fg", "Active text"),
        color("highlight", "Match highlight"),
        color("border", "Border"),
      ],
    },
    {
      title: "Typography",
      controls: [
        {
          type: "select",
          target: "token",
          key: "font-family",
          label: "Font",
          choices: [
            { label: "System", value: themes.dark["font-family"] },
            { label: "System mono", value: themes.terminal["font-family"] },
            { label: "Inter", value: "Inter, system-ui, sans-serif" },
            { label: "JetBrains Mono", value: "'JetBrains Mono', monospace" },
          ],
        },
        slider("font-size", "Font size", 11, 20, 1),
      ],
    },
    {
      title: "Frame",
      controls: [
        select("variant", "Variant", ["inline", "dialog"]),
        select("size", "Size", Object.keys(sizes)),
        slider("radius", "Radius", 0, 28, 1),
        slider("item-radius", "Row radius", 0, 16, 1),
        slider("width", "Width", 320, 800, 10),
        slider("max-height", "List height", 160, 600, 10),
      ],
    },
    {
      title: "Behavior",
      controls: [
        toggle("hotkey", "Hotkey (Ctrl/⌘ K)"),
        toggle("showGroups", "Group headings"),
        toggle("footer", "Footer hints"),
        toggle("closeOnSelect", "Close on select"),
        text("placeholder", "Placeholder"),
        text("emptyText", "Empty text"),
      ],
    },
  ],
  initialState: () => ({ options: { ...initialOptions }, tokens: {} }),
  baseline(state) {
    const { base, size } = read(state);
    return { ...themes[base], ...sizes[size] };
  },
  Preview,
  mountVanilla(el, state) {
    let last: string | null = null;
    const root = document.createElement("div");
    const bar = document.createElement("div");
    const button = document.createElement("button");
    const status = document.createElement("span");
    const host = document.createElement("div");
    const hint = document.createElement("p");
    root.className = ROOT;
    bar.className = BAR;
    button.className = BUTTON;
    button.type = "button";
    button.textContent = "Open dialog";
    status.setAttribute("aria-live", "polite");
    status.textContent = statusText(last);
    host.className = "flex w-full justify-center";
    hint.className = HINT;
    bar.append(button, status);
    root.append(bar, host);
    el.append(root);

    const onSelect = (item: CommandPaletteItem) => {
      last = item.label;
      status.textContent = statusText(last);
      return true;
    };
    let inlineInst: CommandPaletteInstance | null = null;
    const dialog = createCommandPalette(host, { items: SAMPLE_ITEMS, onSelect, variant: "dialog" });

    const apply = (next: StudioState) => {
      const options = toOptions(next);
      const inline = isInline(next);
      dialog.update({ ...options, variant: "dialog", hotkey: inline ? "" : options.hotkey });
      if (inline && !inlineInst) {
        hint.remove();
        inlineInst = createCommandPalette(host, {
          ...options,
          variant: "inline",
          items: SAMPLE_ITEMS,
          onSelect,
        });
      } else if (inline) inlineInst?.update({ ...options, variant: "inline" });
      else {
        inlineInst?.destroy();
        inlineInst = null;
        hint.textContent = options.hotkey ? hintText : "Use the button to open the dialog";
        if (!hint.isConnected) host.append(hint);
      }
    };
    apply(state);
    button.addEventListener("click", () => dialog.open());

    return {
      update: apply,
      destroy() {
        inlineInst?.destroy();
        dialog.destroy();
        root.remove();
      },
    };
  },
  customize(source, state) {
    const { base, size } = read(state);
    let out = source;
    for (const [key, value] of Object.entries(state.options)) {
      if (key === "theme" && value === defaults.theme) continue;
      if (configDefaults[key] === value) continue;
      out = setValue(
        out,
        ["defaults"],
        key,
        key === "hotkey" ? (value ? defaults.hotkey : "") : value,
      );
    }
    for (const [key, value] of Object.entries(state.tokens)) {
      const target = hasKey(out, ["sizes", size], key)
        ? ["sizes", size]
        : hasKey(out, ["common"], key)
          ? ["common"]
          : ["themes", base];
      out = setValue(out, target, key, value);
    }
    return out;
  },
  usage: (framework) =>
    framework === "react"
      ? `"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CommandPalette } from "./CommandPalette";

const items = [
  { id: "home", label: "Home", group: "Pages", icon: "🏠", href: "/" },
  { id: "blog", label: "Blog", group: "Pages", icon: "📝", href: "/blog" },
  { id: "copy", label: "Copy link", group: "Actions", icon: "🔗" },
];

export function SiteSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <CommandPalette
      items={items}
      open={open}
      onOpenChange={setOpen}
      onSelect={(item) => {
        if (item.href) router.push(item.href);
        else if (item.id === "copy") navigator.clipboard.writeText(location.href);
      }}
    />
  );
}`
      : `import { createCommandPalette } from "./command-palette";

const palette = createCommandPalette(document.body, {
  items: [
    { id: "home", label: "Home", group: "Pages", href: "/" },
    { id: "copy", label: "Copy link", group: "Actions" },
  ],
  onSelect: (item) => {
    if (item.id === "copy") navigator.clipboard.writeText(location.href);
    else return false; // fall back to href navigation
  },
});
document.querySelector("#search")!.addEventListener("click", () => palette.open());`,
};
