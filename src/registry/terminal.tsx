"use client";

import { useRouter } from "next/navigation";
import { Terminal } from "@lib/terminal/react/Terminal";
import {
  defaults,
  sizes,
  themes,
  variants,
  type TerminalOptions,
  type TerminalSize,
  type TerminalThemeName,
  type TerminalVariant,
} from "@lib/terminal/react/terminal.config";
import { createTerminal } from "@lib/terminal/vanilla/terminal";
import { CORE_FONTS, DEFAULT_FONT, renderText, type AsciiLayout } from "@/lib/ascii/fonts";
import { readBannerArt } from "@/lib/ascii/terminal-banner";
import { hasKey, setValue } from "@/lib/customize-config";
import { sitePages } from "./meta";
import { terminalMeta } from "./terminal.meta";
import type { RegistryEntry, StudioState } from "./types";

const color = (key: string, label: string) =>
  ({ type: "color", target: "token", key, label }) as const;

const initialOptions = {
  theme: defaults.theme as string,
  variant: defaults.variant,
  size: defaults.size,
  glow: defaults.glow,
  user: defaults.user,
  host: defaults.host,
  subtitle: defaults.subtitle,
  placeholder: defaults.placeholder,
  "site.name": defaults.site.name,
  "site.version": defaults.site.version,
  // Playground-only: the resulting lines are baked into `banner`, these keys never reach the config
  bannerMode: "default",
  bannerText: "UXU",
  bannerFont: DEFAULT_FONT,
  bannerLayout: "default",
};

const BANNER_KEYS = new Set(["bannerMode", "bannerText", "bannerFont", "bannerLayout"]);

/** Banner lines for the current state; null = keep the config's default banner */
function bannerLines(state: StudioState): string[] | null {
  const o = state.options;
  if (o.bannerMode === "text") {
    const lines = renderText(String(o.bannerText), {
      font: String(o.bannerFont),
      layout: o.bannerLayout as AsciiLayout,
    });
    return lines.length ? lines : null;
  }
  if (o.bannerMode === "art") return readBannerArt();
  return null;
}

function read(state: StudioState) {
  const o = state.options;
  return {
    base: (o.theme as TerminalThemeName) in themes ? (o.theme as TerminalThemeName) : "matrix",
    size: o.size as TerminalSize,
    variant: o.variant as TerminalVariant,
    glow: o.glow as boolean,
  };
}

/** Final token set, resolved in the same order the copied config produces (variant wins over overrides) */
function themeObject(state: StudioState) {
  const { base, size, variant, glow } = read(state);
  const tokens = { ...themes[base], ...sizes[size], ...state.tokens, ...variants[variant] };
  return glow ? tokens : { ...tokens, glow: "none", "glow-strong": "none" };
}

function toOptions(state: StudioState): TerminalOptions {
  const o = state.options;
  const { size, variant, glow } = read(state);
  return {
    theme: themeObject(state),
    variant,
    size,
    glow,
    user: String(o.user),
    host: String(o.host),
    subtitle: String(o.subtitle),
    placeholder: String(o.placeholder),
    site: { ...defaults.site, name: String(o["site.name"]), version: String(o["site.version"]) },
    pages: sitePages(),
    ...(bannerLines(state) ? { banner: bannerLines(state) as string[] } : {}),
  };
}

function Preview({ state }: { state: StudioState }) {
  const router = useRouter();
  return <Terminal {...toOptions(state)} navigate={(path) => router.push(path)} />;
}

export const terminal: RegistryEntry = {
  ...terminalMeta,
  themeKey: "theme",
  controls: [
    {
      title: "Theme",
      controls: [
        {
          type: "select",
          target: "option",
          key: "theme",
          label: "Preset",
          choices: Object.keys(themes).map((name) => ({ label: name, value: name })),
        },
        { type: "switch", target: "option", key: "glow", label: "Glow" },
        color("bg", "Background"),
        color("fg", "Text"),
        color("dim", "Muted text"),
        color("accent", "Accent"),
        color("cursor", "Cursor"),
        color("error", "Error"),
        color("border", "Border"),
        color("titlebar-bg", "Title bar"),
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
            { label: "System mono", value: themes.matrix["font-family"] },
            { label: "JetBrains Mono", value: "'JetBrains Mono', monospace" },
            { label: "Fira Code", value: "'Fira Code', monospace" },
            { label: "IBM Plex Mono", value: "'IBM Plex Mono', monospace" },
            { label: "Space Mono", value: "'Space Mono', monospace" },
          ],
        },
        {
          type: "slider",
          target: "token",
          key: "font-size",
          label: "Font size",
          min: 10,
          max: 22,
          step: 1,
          unit: "px",
        },
      ],
    },
    {
      title: "Frame",
      controls: [
        {
          type: "select",
          target: "option",
          key: "variant",
          label: "Variant",
          choices: Object.keys(variants).map((name) => ({ label: name, value: name })),
        },
        {
          type: "select",
          target: "option",
          key: "size",
          label: "Size",
          choices: Object.keys(sizes).map((name) => ({ label: name, value: name })),
        },
        {
          type: "slider",
          target: "token",
          key: "radius",
          label: "Radius",
          min: 0,
          max: 24,
          step: 1,
          unit: "px",
        },
        {
          type: "slider",
          target: "token",
          key: "width",
          label: "Width",
          min: 30,
          max: 100,
          step: 5,
          unit: "%",
        },
        {
          type: "slider",
          target: "token",
          key: "height",
          label: "Height",
          min: 240,
          max: 720,
          step: 10,
          unit: "px",
        },
      ],
    },
    {
      title: "Banner",
      controls: [
        {
          type: "select",
          target: "option",
          key: "bannerMode",
          label: "Banner",
          choices: [
            { label: "Default", value: "default" },
            { label: "From text", value: "text" },
            { label: "From ASCII Editor", value: "art" },
          ],
        },
        { type: "text", target: "option", key: "bannerText", label: "Banner text" },
        {
          type: "select",
          target: "option",
          key: "bannerFont",
          label: "Font",
          choices: CORE_FONTS.map((font) => ({ label: font, value: font })),
        },
        {
          type: "select",
          target: "option",
          key: "bannerLayout",
          label: "Letter spacing",
          choices: ["default", "fitted", "full", "smushed"].map((v) => ({ label: v, value: v })),
        },
        {
          type: "link",
          target: "none",
          key: "bannerEditor",
          label: "Open in ASCII Editor",
          href: (state) =>
            `/ascii?${new URLSearchParams({ text: String(state.options.bannerText), font: String(state.options.bannerFont) })}`,
        },
      ],
    },
    {
      title: "Content",
      controls: [
        { type: "text", target: "option", key: "user", label: "User" },
        { type: "text", target: "option", key: "host", label: "Host" },
        { type: "text", target: "option", key: "subtitle", label: "Subtitle" },
        { type: "text", target: "option", key: "placeholder", label: "Placeholder" },
        { type: "text", target: "option", key: "site.name", label: "Site name" },
        { type: "text", target: "option", key: "site.version", label: "Version" },
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
    const term = createTerminal(el, toOptions(state));
    return { update: (next) => term.update(toOptions(next)), destroy: () => term.destroy() };
  },
  customize(source, state) {
    const { base, size } = read(state);
    let out = source;
    for (const [key, value] of Object.entries(state.options)) {
      if (BANNER_KEYS.has(key) || initialOptions[key as keyof typeof initialOptions] === value)
        continue;
      const path = key.split(".");
      out = setValue(out, ["defaults", ...path.slice(0, -1)], path[path.length - 1], value);
    }
    for (const [key, value] of Object.entries(state.tokens)) {
      const target = hasKey(out, ["themes", base], key)
        ? ["themes", base]
        : hasKey(out, ["sizes", size], key)
          ? ["sizes", size]
          : hasKey(out, ["common"], key)
            ? ["common"]
            : ["themes", base];
      out = setValue(out, target, key, value);
    }
    const banner = bannerLines(state);
    if (banner) out = setValue(out, ["defaults"], "banner", banner);
    return out;
  },
  usage: (framework) =>
    framework === "react"
      ? `import { Terminal } from "./Terminal";

export default function Page() {
  return <Terminal />;
}`
      : `import { createTerminal } from "./terminal";

createTerminal(document.querySelector("#terminal")!);`,
};
