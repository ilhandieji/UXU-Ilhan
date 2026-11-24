"use client";

import { useRef } from "react";
import { CountUp, type CountUpHandle } from "@lib/count-up/react/CountUp";
import {
  defaults,
  sizes,
  themes,
  type CountUpOptions,
  type CountUpThemeName,
} from "@lib/count-up/react/count-up.config";
import { createCountUp } from "@lib/count-up/vanilla/count-up";
import { hasKey, setValue } from "@/lib/customize-config";
import { countUpMeta } from "./count-up.meta";
import type { Control, RegistryEntry, StudioState } from "./types";

/** Slider values that are numeric options (live in `defaults`), not CSS tokens */
const NUMERIC_OPTIONS = ["duration", "delay", "decimals"] as const;
/** Text controls holding numbers */
const NUMBER_TEXT = new Set(["from", "to"]);

const initialOptions = {
  theme: defaults.theme as string,
  size: defaults.size as string,
  from: String(defaults.from),
  to: "12480",
  easing: defaults.easing as string,
  locale: defaults.locale,
  notation: defaults.notation as string,
  separator: defaults.separator,
  currency: defaults.currency,
  prefix: defaults.prefix,
  suffix: "+",
  trigger: defaults.trigger as string,
  once: defaults.once,
  respectReducedMotion: defaults.respectReducedMotion,
  ariaLive: defaults.ariaLive,
};

const baseName = (state: StudioState) =>
  (String(state.options.theme) in themes
    ? state.options.theme
    : defaults.theme) as CountUpThemeName;
const sizeName = (state: StudioState) =>
  (String(state.options.size) in sizes ? state.options.size : defaults.size) as keyof typeof sizes;

const toNumber = (value: unknown, fallback: number) => {
  const n = Number.parseFloat(String(value));
  return Number.isFinite(n) ? n : fallback;
};

/** Options shared by all three demo counters (timing, locale, look) */
function sharedOptions(state: StudioState): CountUpOptions {
  const o = state.options;
  const tokens: Record<string, string> = {};
  for (const [key, value] of Object.entries(state.tokens))
    if (!(NUMERIC_OPTIONS as readonly string[]).includes(key)) tokens[key] = value;
  return {
    theme: { ...themes[baseName(state)], ...tokens },
    size: sizeName(state),
    duration: toNumber(state.tokens.duration, defaults.duration),
    delay: toNumber(state.tokens.delay, defaults.delay),
    easing: o.easing as CountUpOptions["easing"],
    locale: String(o.locale),
    separator: Boolean(o.separator),
    trigger: o.trigger as CountUpOptions["trigger"],
    once: Boolean(o.once),
    respectReducedMotion: Boolean(o.respectReducedMotion),
    ariaLive: Boolean(o.ariaLive),
  };
}

/** The three stats: the first one follows every panel control, the others keep their own format */
function stats(state: StudioState): { label: string; options: CountUpOptions }[] {
  const o = state.options;
  const shared = sharedOptions(state);
  const delay = shared.delay ?? 0;
  return [
    {
      label: "users",
      options: {
        ...shared,
        from: toNumber(o.from, defaults.from),
        to: toNumber(o.to, defaults.to),
        decimals: Math.round(toNumber(state.tokens.decimals, defaults.decimals)),
        notation: o.notation as CountUpOptions["notation"],
        currency: String(o.currency),
        prefix: String(o.prefix),
        suffix: String(o.suffix),
      },
    },
    {
      label: "revenue",
      options: {
        ...shared,
        delay: delay + 0.15,
        to: 1_200_000,
        decimals: 1,
        notation: "compact",
        currency: "USD",
      },
    },
    {
      label: "uptime",
      options: { ...shared, delay: delay + 0.3, to: 99.9, decimals: 1, suffix: "%" },
    },
  ];
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
const text = (key: string, label: string): Control => ({
  type: "text",
  target: "option",
  key,
  label,
});

const FONTS = [
  { label: "Inherit", value: "inherit" },
  { label: "System sans", value: "system-ui, sans-serif" },
  { label: "Monospace", value: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" },
  { label: "Serif", value: "Georgia, 'Times New Roman', serif" },
  {
    label: "Condensed",
    value: "'Arial Narrow', 'Roboto Condensed', sans-serif-condensed, sans-serif",
  },
];
const GLOWS = [
  { label: "None", value: "none" },
  { label: "Soft", value: "0 0 10px currentColor" },
  { label: "Neon", value: "0 0 6px currentColor, 0 0 24px currentColor" },
  { label: "Strong", value: "0 0 4px currentColor, 0 0 16px currentColor, 0 0 40px currentColor" },
];

const WRAP =
  "flex min-h-112 w-full flex-col items-center justify-center gap-10 p-6 text-neutral-100";
const ROW = "flex w-full flex-wrap items-start justify-center gap-x-12 gap-y-8";
const STAT = "flex min-w-32 flex-col items-center gap-2 text-center";
const LABEL = "text-xs uppercase tracking-widest text-neutral-500";
const BUTTON =
  "rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-neutral-300 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400";

function Preview({ state }: { state: StudioState }) {
  const refs = useRef<(CountUpHandle | null)[]>([]);
  return (
    <div className={WRAP}>
      <div className={ROW}>
        {stats(state).map((stat, i) => (
          <div key={stat.label} className={STAT}>
            <CountUp
              ref={(handle) => {
                refs.current[i] = handle;
              }}
              {...stat.options}
            />
            <p className={LABEL}>{stat.label}</p>
          </div>
        ))}
      </div>
      <button
        type="button"
        className={BUTTON}
        onClick={() => refs.current.forEach((handle) => handle?.start())}
      >
        Replay
      </button>
    </div>
  );
}

export const countUp: RegistryEntry = {
  ...countUpMeta,
  themeKey: "theme",
  presets: [
    {
      name: "Neon revenue",
      options: { theme: "neon", to: "1200000", notation: "compact", currency: "USD", suffix: "" },
      tokens: { decimals: "1" },
    },
    { name: "Persian digits", options: { theme: "gold", locale: "fa-IR", easing: "spring" } },
    {
      name: "Countdown",
      options: { theme: "mono", from: "100", to: "0", easing: "linear", suffix: "" },
      tokens: { duration: "5s" },
    },
    {
      name: "Big glow",
      options: { theme: "neon", size: "xl", easing: "expo" },
      tokens: { glow: GLOWS[3].value },
    },
    {
      name: "German euros",
      options: { locale: "de-DE", currency: "EUR", suffix: "" },
      tokens: { decimals: "2" },
    },
  ],
  randomizeSkip: [
    "from",
    "to",
    "prefix",
    "suffix",
    "currency",
    "trigger",
    "once",
    "respectReducedMotion",
    "ariaLive",
    "delay",
  ],
  palette: (p) => ({ fg: p.fg, "prefix-color": p.accent }),
  controls: [
    {
      title: "Value",
      controls: [
        text("to", "To"),
        text("from", "From"),
        slider("decimals", "Decimals", 0, 4, 1),
        text("prefix", "Prefix"),
        text("suffix", "Suffix"),
      ],
    },
    {
      title: "Format",
      controls: [
        select("locale", "Locale", ["en-US", "fa-IR", "de-DE", "ar-EG"]),
        select("notation", "Notation", ["standard", "compact"]),
        toggle("separator", "Grouping separator"),
        text("currency", "Currency (ISO)"),
      ],
    },
    {
      title: "Motion",
      controls: [
        slider("duration", "Duration", 0, 8, 0.1, "s"),
        slider("delay", "Delay", 0, 3, 0.05, "s"),
        select("easing", "Easing", ["linear", "easeOut", "easeInOut", "spring", "expo"]),
        select("trigger", "Trigger", ["mount", "inView", "manual"]),
        toggle("once", "Once"),
        toggle("respectReducedMotion", "Reduced motion"),
        toggle("ariaLive", "aria-live"),
      ],
    },
    {
      title: "Style",
      controls: [
        select("theme", "Preset", Object.keys(themes)),
        { type: "color", target: "token", key: "fg", label: "Number" },
        { type: "color", target: "token", key: "prefix-color", label: "Prefix / suffix" },
        { type: "select", target: "token", key: "font-family", label: "Font", choices: FONTS },
        select("size", "Size", Object.keys(sizes)),
        slider("font-size", "Font size", 12, 120, 1, "px"),
        {
          type: "select",
          target: "token",
          key: "font-weight",
          label: "Weight",
          choices: ["300", "400", "500", "600", "700", "800", "900"].map((v) => ({
            label: v,
            value: v,
          })),
        },
        slider("letter-spacing", "Letter spacing", -0.1, 0.3, 0.01, "em"),
        { type: "select", target: "token", key: "glow", label: "Glow", choices: GLOWS },
      ],
    },
  ],
  initialState: () => ({ options: { ...initialOptions }, tokens: {} }),
  baseline: (state) => ({
    ...themes[baseName(state)],
    ...sizes[sizeName(state)],
    duration: `${defaults.duration}s`,
    delay: `${defaults.delay}s`,
    decimals: String(defaults.decimals),
  }),
  Preview,
  mountVanilla(el, state) {
    const wrap = document.createElement("div");
    wrap.className = WRAP;
    const row = document.createElement("div");
    row.className = ROW;
    const instances = stats(state).map((stat) => {
      const cell = document.createElement("div");
      cell.className = STAT;
      const host = document.createElement("div");
      const label = document.createElement("p");
      label.className = LABEL;
      label.textContent = stat.label;
      cell.append(host, label);
      row.append(cell);
      return createCountUp(host, stat.options);
    });
    const button = document.createElement("button");
    button.type = "button";
    button.className = BUTTON;
    button.textContent = "Replay";
    button.addEventListener("click", () => instances.forEach((inst) => inst.start()));
    wrap.append(row, button);
    el.append(wrap);
    return {
      update(next) {
        stats(next).forEach((stat, i) => instances[i].update(stat.options));
      },
      destroy() {
        instances.forEach((inst) => inst.destroy());
        wrap.remove();
      },
    };
  },
  customize(source, state) {
    const base = baseName(state);
    const size = sizeName(state);
    let out = source;
    for (const [key, value] of Object.entries(state.options)) {
      const fallback = defaults[key as keyof typeof defaults];
      const literal = NUMBER_TEXT.has(key) ? toNumber(value, Number(fallback)) : value;
      if (literal !== fallback) out = setValue(out, ["defaults"], key, literal);
    }
    for (const [key, value] of Object.entries(state.tokens)) {
      if ((NUMERIC_OPTIONS as readonly string[]).includes(key)) {
        out = setValue(out, ["defaults"], key, toNumber(value, 0));
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
import { CountUp, type CountUpHandle } from "./CountUp";

export function Stats() {
  const users = useRef<CountUpHandle>(null);
  return (
    <dl>
      <CountUp as="dd" ref={users} to={12480} suffix="+" />
      <CountUp as="dd" to={1_200_000} notation="compact" currency="USD" decimals={1} />
      <CountUp as="dd" to={99.9} decimals={1} suffix="%" locale="fa-IR" theme="gold" />
      <button onClick={() => users.current?.start()}>Replay</button>
    </dl>
  );
}`
      : `import { createCountUp } from "./count-up";

const users = createCountUp(document.querySelector("#users")!, { to: 12480, suffix: "+" });
users.update(13000); // animates from the shown value
users.update({ locale: "fa-IR", theme: "neon" });
users.start(); // replay`,
};
