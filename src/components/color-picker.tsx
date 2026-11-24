"use client";

import { Pipette } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { HexAlphaColorPicker } from "react-colorful";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { contrastLevel, contrastRatio, hexToRgba, isCssColor, rgbaToHex, toHex } from "@/lib/color";

const RECENT_KEY = "uxu:recent-colors";
const RECENT_MAX = 12;

/** Curated palette: neutrals + Tailwind-like hues (light → dark) */
const PALETTE: string[][] = [
  ["#000000", "#171717", "#404040", "#737373", "#a3a3a3", "#d4d4d4", "#f5f5f5", "#ffffff"],
  ["#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e", "#10b981", "#14b8a6"],
  ["#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899"],
  ["#7f1d1d", "#7c2d12", "#713f12", "#14532d", "#134e4a", "#1e3a8a", "#4c1d95", "#831843"],
  ["#00ff41", "#b6ffc8", "#ffb000", "#ff3df2", "#7ff3ff", "#5f8bff", "#ffd36b", "#f43f5e"],
];

/** Chromium-only API; Firefox has no EyeDropper, so the button stays hidden there */
type EyeDropperCtor = new () => { open(): Promise<{ sRGBHex: string }> };
const eyeDropper = () =>
  typeof window !== "undefined"
    ? (window as unknown as { EyeDropper?: EyeDropperCtor }).EyeDropper
    : undefined;

function readRecent(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((c): c is string => typeof c === "string") : [];
  } catch {
    return [];
  }
}

function pushRecent(color: string) {
  try {
    const next = [color, ...readRecent().filter((c) => c !== color)].slice(0, RECENT_MAX);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Storage may be unavailable (private mode); recents are a convenience only
  }
}

/** Checkerboard behind a color so alpha is visible */
const CHECKER =
  "bg-[conic-gradient(#808080_25%,#c0c0c0_0_50%,#808080_0_75%,#c0c0c0_0)] bg-size-[8px_8px]";

function Swatch({
  color,
  onPick,
  label,
}: {
  color: string;
  onPick: (c: string) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      title={label ?? color}
      aria-label={label ?? color}
      onClick={() => onPick(color)}
      className={`size-6 overflow-hidden rounded-sm border border-white/10 ${CHECKER} focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none`}
    >
      <span className="block size-full" style={{ background: color }} />
    </button>
  );
}

type Props = {
  value: string;
  onChange: (value: string) => void;
  /** Accessible name of the trigger */
  label: string;
  /** Extra swatches shown first, e.g. the colors of the current theme */
  themeColors?: string[];
  /** Background this color sits on; shows the WCAG contrast ratio */
  contrastWith?: string;
  className?: string;
};

/** WCAG ratio + level badge (used inside the picker and next to color rows) */
const noop = () => () => {};
/** True only on the client: color parsing needs the browser, so the badge never renders on the server */
const useIsClient = () =>
  useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );

export function ContrastBadge({ color, background }: { color: string; background: string }) {
  const isClient = useIsClient();
  if (!isClient || !isCssColor(color) || !isCssColor(background)) return null;
  const ratio = contrastRatio(toHex(color), toHex(background));
  const level = contrastLevel(ratio);
  const tone =
    level === "AAA" || level === "AA"
      ? "border-emerald-500/40 text-emerald-400"
      : level === "AA large"
        ? "border-amber-500/40 text-amber-400"
        : "border-red-500/40 text-red-400";
  return (
    <span
      title={`Contrast ${ratio.toFixed(2)}:1 against ${background}`}
      className={`inline-flex items-center gap-1 rounded border px-1 font-mono text-[10px] leading-4 tabular-nums ${tone}`}
    >
      {ratio.toFixed(1)}
      <span>{level}</span>
    </span>
  );
}

/** In-site color picker (popover) — replaces the OS picker opened by <input type="color"> */
export function ColorPicker({
  value,
  onChange,
  label,
  themeColors = [],
  contrastWith,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const hex = toHex(value);
  const [r, g, b, a] = hexToRgba(hex);
  const [hexDraft, setHexDraft] = useState(hex);
  const [startValue, setStartValue] = useState(value);

  useEffect(() => setHexDraft(hex), [hex]);

  const onOpenChange = (next: boolean) => {
    if (next) {
      setRecent(readRecent());
      setStartValue(value);
    } else if (value !== startValue && isCssColor(value)) pushRecent(toHex(value));
    setOpen(next);
  };

  const pickEye = async () => {
    const Ctor = eyeDropper();
    if (!Ctor) return;
    try {
      const { sRGBHex } = await new Ctor().open();
      onChange(toHex(sRGBHex));
    } catch {
      // User cancelled the eyedropper
    }
  };

  const uniqueTheme = [...new Set(themeColors.filter(isCssColor).map((c) => toHex(c)))].slice(
    0,
    16,
  );

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`${label}: pick color`}
          className={`size-8 shrink-0 overflow-hidden rounded-md border ${CHECKER} focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${className ?? ""}`}
        >
          <span className="block size-full" style={{ background: value || "transparent" }} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 space-y-3">
        <HexAlphaColorPicker
          color={hex}
          onChange={onChange}
          className="w-full! [&_.react-colorful__saturation]:rounded-md"
        />

        <div className="grid grid-cols-[1fr_auto] gap-2">
          <Input
            aria-label={`${label} hex`}
            value={hexDraft}
            spellCheck={false}
            className="h-8 font-mono text-xs"
            onChange={(e) => {
              setHexDraft(e.target.value);
              if (isCssColor(e.target.value)) onChange(e.target.value);
            }}
          />
          {eyeDropper() ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-8"
              onClick={pickEye}
              aria-label="Pick from screen"
            >
              <Pipette aria-hidden />
            </Button>
          ) : null}
        </div>

        {contrastWith ? (
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Contrast on background</span>
            <ContrastBadge color={value} background={contrastWith} />
          </div>
        ) : null}

        <div className="grid grid-cols-4 gap-1.5 font-mono text-[10px] text-muted-foreground">
          {(["r", "g", "b"] as const).map((channel, i) => (
            <label key={channel} className="space-y-0.5">
              <span className="uppercase">{channel}</span>
              <Input
                type="number"
                min={0}
                max={255}
                value={[r, g, b][i]}
                className="h-7 px-1.5 text-xs"
                onChange={(e) => {
                  const next = [r, g, b];
                  next[i] = Math.max(0, Math.min(255, Number(e.target.value) || 0));
                  onChange(rgbaToHex(next[0], next[1], next[2], a));
                }}
              />
            </label>
          ))}
          <label className="space-y-0.5">
            <span>A%</span>
            <Input
              type="number"
              min={0}
              max={100}
              value={Math.round(a * 100)}
              className="h-7 px-1.5 text-xs"
              onChange={(e) =>
                onChange(
                  rgbaToHex(r, g, b, Math.max(0, Math.min(100, Number(e.target.value) || 0)) / 100),
                )
              }
            />
          </label>
        </div>

        {uniqueTheme.length ? (
          <section className="space-y-1.5">
            <h4 className="text-[11px] font-medium text-muted-foreground">Theme</h4>
            <div className="flex flex-wrap gap-1.5">
              {uniqueTheme.map((c) => (
                <Swatch key={c} color={c} onPick={onChange} />
              ))}
            </div>
          </section>
        ) : null}

        <section className="space-y-1.5">
          <h4 className="text-[11px] font-medium text-muted-foreground">Palette</h4>
          <div className="grid grid-cols-8 gap-1.5">
            {PALETTE.flat().map((c, i) => (
              <Swatch key={`${c}-${i}`} color={c} onPick={onChange} />
            ))}
          </div>
        </section>

        {recent.length ? (
          <section className="space-y-1.5">
            <h4 className="text-[11px] font-medium text-muted-foreground">Recent</h4>
            <div className="flex flex-wrap gap-1.5">
              {recent.map((c) => (
                <Swatch key={c} color={c} onPick={onChange} />
              ))}
            </div>
          </section>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
