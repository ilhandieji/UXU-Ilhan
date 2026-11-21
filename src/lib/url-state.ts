// Keeps the playground's customize state in the URL query (?key=value), like reactbits.dev:
// refresh, reopening a closed tab or sharing the link restores every choice.
// Only values that differ from the component's initial state are written, so URLs stay short.
import { isCssColor } from "@/lib/color";
import type { Control, Framework, OptionValue, RegistryEntry, StudioState } from "@/registry/types";

export type StudioTab = "preview" | "code";

export interface StudioUrlState {
  state: StudioState;
  framework: Framework;
  tab: StudioTab;
}

/** Reserved query keys (never used as control keys) */
const FRAMEWORK = "fw";
const TAB = "tab";
const MAX_TEXT = 20000;

function controlsOf(entry: RegistryEntry): Map<string, Control> {
  return new Map(
    entry.controls.flatMap((group) => group.controls).map((control) => [control.key, control]),
  );
}

const encodeValue = (value: OptionValue) =>
  typeof value === "boolean" ? (value ? "1" : "0") : String(value);

export function encodeStudio(
  entry: RegistryEntry,
  { state, framework, tab }: StudioUrlState,
): string {
  const initial = entry.initialState();
  const controls = controlsOf(entry);
  const params = new URLSearchParams();
  if (framework !== "react") params.set(FRAMEWORK, framework);
  if (tab !== "preview") params.set(TAB, tab);
  for (const [key, value] of Object.entries(state.options)) {
    if (initial.options[key] !== value) params.set(key, encodeValue(value));
  }
  for (const [key, value] of Object.entries(state.tokens)) {
    if (key in state.options) continue;
    // Sliders store a plain number; the unit comes back from the control on load
    params.set(
      key,
      controls.get(key)?.type === "slider" ? String(Number.parseFloat(value)) : value,
    );
  }
  return params.toString();
}

/** Parses one option value against its initial type and (when present) its control */
function readOption(raw: string, initial: OptionValue, control?: Control): OptionValue | undefined {
  if (typeof initial === "boolean") return raw === "1" ? true : raw === "0" ? false : undefined;
  if (raw.length > MAX_TEXT) return undefined;
  if (control?.type === "select" && !control.choices.some((choice) => choice.value === raw))
    return undefined;
  if (control?.type === "color" && !isCssColor(raw)) return undefined;
  return raw;
}

/** Parses one token override; only keys that have a token control are accepted */
function readToken(raw: string, control: Control): string | undefined {
  switch (control.type) {
    case "slider": {
      const num = Number.parseFloat(raw);
      if (!Number.isFinite(num)) return undefined;
      return `${Math.min(control.max, Math.max(control.min, num))}${control.unit}`;
    }
    case "select":
      return control.choices.some((choice) => choice.value === raw) ? raw : undefined;
    case "color":
      return isCssColor(raw) ? raw : undefined;
    default:
      return raw.length <= MAX_TEXT ? raw : undefined;
  }
}

/** Unknown keys and invalid values are ignored, so a hand-edited or stale link never breaks the page */
export function decodeStudio(entry: RegistryEntry, params: URLSearchParams): StudioUrlState {
  const initial = entry.initialState();
  const controls = controlsOf(entry);
  const options = { ...initial.options };
  const tokens: Record<string, string> = {};

  for (const [key, raw] of params) {
    if (key === FRAMEWORK || key === TAB) continue;
    const control = controls.get(key);
    if (key in initial.options) {
      const value = readOption(raw, initial.options[key], control);
      if (value !== undefined) options[key] = value;
      continue;
    }
    if (control?.target !== "token") continue;
    const value = readToken(raw, control);
    if (value !== undefined) tokens[key] = value;
  }

  return {
    state: { options, tokens },
    framework: params.get(FRAMEWORK) === "vanilla" ? "vanilla" : "react",
    tab: params.get(TAB) === "code" ? "code" : "preview",
  };
}

/** Replaces the current URL's query without a navigation (Next.js syncs useSearchParams with it) */
export function replaceQuery(query: string) {
  const url = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
  if (url !== `${window.location.pathname}${window.location.search}${window.location.hash}`)
    window.history.replaceState(null, "", url);
}
