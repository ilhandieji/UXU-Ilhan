// Randomize: picks random values for every control (within its range), keeping text and skipped keys.
import { randomPalette } from "@/lib/site-palettes";
import type { Control, OptionValue, RegistryEntry, StudioState } from "@/registry/types";

const pick = <T>(items: T[], random: () => number) => items[Math.floor(random() * items.length)];

function randomValue(control: Control, random: () => number): OptionValue | undefined {
  switch (control.type) {
    case "select":
      return pick(control.choices, random).value;
    case "switch":
      return random() < 0.5;
    case "slider": {
      const steps = Math.round((control.max - control.min) / control.step);
      const value = control.min + Math.round(random() * steps) * control.step;
      // Strip float noise such as 0.30000000000000004
      return `${Number(value.toFixed(6))}${control.unit}`;
    }
    case "color":
      return `hsl(${Math.round(random() * 360)} ${70 + Math.round(random() * 30)}% ${50 + Math.round(random() * 15)}%)`;
    default:
      return undefined;
  }
}

export function randomizeState(entry: RegistryEntry, random = Math.random): StudioState {
  const skip = new Set(entry.randomizeSkip ?? []);
  const base = entry.initialState();
  const options = { ...base.options };
  const tokens: Record<string, string> = {};

  for (const control of entry.controls.flatMap((group) => group.controls)) {
    if (skip.has(control.key) || control.target === "none") continue;
    // A palette keeps colors harmonious; single colors are only random without one
    if (control.type === "color" && entry.palette) continue;
    const value = randomValue(control, random);
    if (value === undefined) continue;
    if (control.target === "token") tokens[control.key] = String(value);
    else options[control.key] = value;
  }
  return { options, tokens: { ...tokens, ...entry.palette?.(randomPalette(random)) } };
}

/** Preset → full state (applied on top of the initial state) */
export function presetState(
  entry: RegistryEntry,
  preset: { options?: Record<string, OptionValue>; tokens?: Record<string, string> },
): StudioState {
  const base = entry.initialState();
  return {
    options: { ...base.options, ...preset.options },
    tokens: { ...preset.tokens },
  };
}
