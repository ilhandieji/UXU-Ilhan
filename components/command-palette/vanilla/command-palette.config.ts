// CommandPalette settings, types, search and hotkey helpers — names must match the React version.
// Styling is Tailwind-only: token values live here and are set as CSS variables
// (`--ux-command-palette-*`) on the panel / overlay; the static classes below consume them.

export type CommandPaletteThemeName = "dark" | "light" | "terminal";
/** dialog: centered modal opened with the hotkey · inline: rendered in place, always open */
export type CommandPaletteVariant = "dialog" | "inline";
export type CommandPaletteSize = "sm" | "md" | "lg";

/** Token keys without the --ux-command-palette- prefix, e.g. { bg: '#000' } */
export type CommandPaletteTokens = Record<string, string>;

export interface CommandPaletteItem {
  id: string;
  label: string;
  /** Group heading the item is listed under */
  group?: string;
  /** Emoji or short text shown before the label */
  icon?: string;
  /** Keys shown on the right, e.g. ["⌘", "K"] */
  shortcut?: string[];
  /** Extra words the search matches (not highlighted) */
  keywords?: string[];
  /** Navigated to with location.assign when onSelect does not handle the item */
  href?: string;
  disabled?: boolean;
}

/** Interface texts (override for translation) */
export interface CommandPaletteLabels {
  /** Accessible name of the dialog / listbox */
  title: string;
  navigate: string;
  select: string;
  close: string;
}

export interface CommandPaletteOptions {
  items?: CommandPaletteItem[];
  /** Controlled open state (dialog variant) */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Return `false` to fall back to the default `href` navigation */
  onSelect?: (item: CommandPaletteItem) => boolean | void;
  /** e.g. "mod+k", "ctrl+shift+p"; mod = Cmd on macOS, Ctrl elsewhere; "" disables */
  hotkey?: string;
  placeholder?: string;
  emptyText?: string;
  closeOnSelect?: boolean;
  maxResults?: number;
  showGroups?: boolean;
  /** Keyboard hints under the list */
  footer?: boolean;
  labels?: Partial<CommandPaletteLabels>;
  theme?: CommandPaletteThemeName | CommandPaletteTokens;
  variant?: CommandPaletteVariant;
  size?: CommandPaletteSize;
}

export const defaults = {
  items: [] as CommandPaletteItem[],
  defaultOpen: false,
  hotkey: "mod+k",
  placeholder: "Type a command or search…",
  emptyText: "No results found.",
  closeOnSelect: true,
  maxResults: 50,
  showGroups: true,
  footer: true,
  labels: {
    title: "Command palette",
    navigate: "navigate",
    select: "select",
    close: "close",
  },
  theme: "dark",
  variant: "dialog",
  size: "md",
} satisfies CommandPaletteOptions;

/** Tokens every theme shares */
const common: CommandPaletteTokens = {
  /** Distance of the dialog from the top of the viewport */
  offset: "12vh",
  z: "50",
};

export const themes: Record<CommandPaletteThemeName, CommandPaletteTokens> = {
  dark: {
    ...common,
    bg: "#111114",
    fg: "#ededf0",
    muted: "#8b8b96",
    accent: "#26262f",
    "accent-fg": "#ffffff",
    border: "#2a2a33",
    overlay: "rgba(0, 0, 0, 0.6)",
    highlight: "#8ab4ff",
    shadow: "0 24px 64px -12px rgba(0, 0, 0, 0.7)",
    radius: "14px",
    "item-radius": "8px",
    "font-family": "system-ui, sans-serif",
  },
  light: {
    ...common,
    bg: "#ffffff",
    fg: "#17171c",
    muted: "#6b6b76",
    accent: "#eef0f5",
    "accent-fg": "#17171c",
    border: "#e2e2e9",
    overlay: "rgba(15, 15, 20, 0.35)",
    highlight: "#2f62e0",
    shadow: "0 24px 64px -16px rgba(0, 0, 0, 0.25)",
    radius: "14px",
    "item-radius": "8px",
    "font-family": "system-ui, sans-serif",
  },
  terminal: {
    ...common,
    bg: "#050805",
    fg: "#b6ffb6",
    muted: "#4f9a5c",
    accent: "#0f2a14",
    "accent-fg": "#d7ffd7",
    border: "#1d4d26",
    overlay: "rgba(0, 8, 0, 0.75)",
    highlight: "#39ff6a",
    shadow: "0 0 32px rgba(57, 255, 106, 0.18)",
    radius: "4px",
    "item-radius": "2px",
    "font-family": "ui-monospace, 'SFMono-Regular', Menlo, monospace",
  },
};

export const sizes: Record<CommandPaletteSize, CommandPaletteTokens> = {
  sm: {
    "font-size": "13px",
    "small-size": "10px",
    padding: "10px",
    gap: "4px",
    "item-height": "32px",
    "input-height": "42px",
    "icon-size": "16px",
    width: "480px",
    "max-height": "260px",
  },
  md: {
    "font-size": "14px",
    "small-size": "11px",
    padding: "12px",
    gap: "6px",
    "item-height": "38px",
    "input-height": "50px",
    "icon-size": "18px",
    width: "560px",
    "max-height": "340px",
  },
  lg: {
    "font-size": "16px",
    "small-size": "12px",
    padding: "14px",
    gap: "8px",
    "item-height": "44px",
    "input-height": "58px",
    "icon-size": "20px",
    width: "680px",
    "max-height": "420px",
  },
};

/** Tailwind v4 classes — complete, static strings (so the scanner can see them) */
const panel =
  "flex w-full max-w-(--ux-command-palette-width) flex-col overflow-hidden rounded-(--ux-command-palette-radius) border border-(color:--ux-command-palette-border) bg-(color:--ux-command-palette-bg) text-(color:--ux-command-palette-fg) font-(family-name:--ux-command-palette-font-family) text-(length:--ux-command-palette-font-size) [box-shadow:var(--ux-command-palette-shadow)]";

/** Panel classes per variant (structure only; tokens are the same) */
export const variants: Record<CommandPaletteVariant, string> = {
  dialog: `${panel} max-h-full`,
  inline: `${panel} relative`,
};

export const classes = {
  overlay:
    "fixed inset-0 z-(--ux-command-palette-z) flex items-start justify-center bg-(color:--ux-command-palette-overlay) px-(--ux-command-palette-padding) pt-(--ux-command-palette-offset)",
  inputRow:
    "flex shrink-0 items-center gap-(--ux-command-palette-padding) border-b border-(color:--ux-command-palette-border) px-(--ux-command-palette-padding)",
  searchIcon:
    "size-(--ux-command-palette-icon-size) shrink-0 text-(color:--ux-command-palette-muted)",
  input:
    "h-(--ux-command-palette-input-height) w-full min-w-0 bg-transparent text-(color:--ux-command-palette-fg) outline-none placeholder:text-(color:--ux-command-palette-muted) [&::-webkit-search-cancel-button]:hidden",
  list: "max-h-(--ux-command-palette-max-height) overflow-y-auto overscroll-contain p-(--ux-command-palette-gap) scroll-py-(--ux-command-palette-gap)",
  group: "pb-(--ux-command-palette-gap) last:pb-0",
  heading:
    "px-(--ux-command-palette-padding) pt-(--ux-command-palette-gap) pb-(--ux-command-palette-gap) text-(length:--ux-command-palette-small-size) font-medium tracking-wide text-(color:--ux-command-palette-muted) uppercase",
  option:
    "flex h-(--ux-command-palette-item-height) cursor-pointer items-center gap-(--ux-command-palette-padding) rounded-(--ux-command-palette-item-radius) px-(--ux-command-palette-padding) select-none transition-colors motion-reduce:transition-none data-[active=true]:bg-(color:--ux-command-palette-accent) data-[active=true]:text-(color:--ux-command-palette-accent-fg) aria-disabled:cursor-not-allowed aria-disabled:opacity-50",
  icon: "inline-flex size-(--ux-command-palette-icon-size) shrink-0 items-center justify-center leading-none",
  label: "min-w-0 flex-1 truncate",
  mark: "bg-transparent font-semibold text-(color:--ux-command-palette-highlight)",
  shortcut: "ml-auto flex shrink-0 items-center gap-(--ux-command-palette-gap)",
  kbd: "inline-flex min-w-(--ux-command-palette-icon-size) items-center justify-center rounded-(--ux-command-palette-item-radius) border border-(color:--ux-command-palette-border) px-(--ux-command-palette-gap) font-(family-name:--ux-command-palette-font-family) text-(length:--ux-command-palette-small-size) leading-(--ux-command-palette-icon-size) text-(color:--ux-command-palette-muted)",
  empty:
    "px-(--ux-command-palette-padding) py-(--ux-command-palette-input-height) text-center text-(color:--ux-command-palette-muted)",
  footer:
    "flex shrink-0 flex-wrap items-center gap-x-(--ux-command-palette-padding) gap-y-(--ux-command-palette-gap) border-t border-(color:--ux-command-palette-border) px-(--ux-command-palette-padding) py-(--ux-command-palette-gap) text-(length:--ux-command-palette-small-size) text-(color:--ux-command-palette-muted)",
  hint: "inline-flex items-center gap-(--ux-command-palette-gap)",
  /** Added to <html> while the dialog is open */
  scrollLock: "overflow-hidden",
};

/** Footer hint keys (not translatable text, just symbols) */
export const hintKeys = { navigate: ["↑", "↓"], select: ["↵"], close: ["esc"] };

// ---------------------------------------------------------------------------
// Validation

export interface CommandPaletteSettings {
  items: CommandPaletteItem[];
  defaultOpen: boolean;
  hotkey: string;
  placeholder: string;
  emptyText: string;
  closeOnSelect: boolean;
  maxResults: number;
  showGroups: boolean;
  footer: boolean;
  labels: CommandPaletteLabels;
  variant: CommandPaletteVariant;
  size: CommandPaletteSize;
}

const warned = new Set<string>();
function warn(message: string) {
  if (warned.has(message)) return;
  warned.add(message);
  console.warn(`[CommandPalette] ${message}`);
}

function oneOf<T extends string>(value: unknown, list: readonly T[], fallback: T, name: string): T {
  if (value === undefined) return fallback;
  if (list.includes(value as T)) return value as T;
  warn(`invalid ${name}: ${String(value)}, using ${fallback}`);
  return fallback;
}

const bool = (value: unknown, fallback: boolean) => (typeof value === "boolean" ? value : fallback);
const str = (value: unknown, fallback: string) => (typeof value === "string" ? value : fallback);

function isItem(value: unknown): value is CommandPaletteItem {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.id === "string" && typeof v.label === "string";
}

/** Drops invalid entries (with a warning) */
export function normalizeItems(items: unknown): CommandPaletteItem[] {
  if (items === undefined) return [];
  if (!Array.isArray(items)) {
    warn("items must be an array");
    return [];
  }
  const valid = items.filter(isItem);
  if (valid.length !== items.length) warn("items without a string id/label were ignored");
  return valid;
}

export function resolveSettings(options: CommandPaletteOptions = {}): CommandPaletteSettings {
  const o = options;
  let maxResults = defaults.maxResults;
  if (o.maxResults !== undefined) {
    if (typeof o.maxResults === "number" && o.maxResults >= 1)
      maxResults = Math.floor(o.maxResults);
    else warn(`invalid maxResults: ${String(o.maxResults)}, using ${defaults.maxResults}`);
  }
  const hotkey = str(o.hotkey, defaults.hotkey);
  if (hotkey && !parseHotkey(hotkey)) warn(`invalid hotkey: ${hotkey}`);
  const labels = o.labels ?? {};
  return {
    items: normalizeItems(o.items),
    defaultOpen: bool(o.defaultOpen, defaults.defaultOpen),
    hotkey,
    placeholder: str(o.placeholder, defaults.placeholder),
    emptyText: str(o.emptyText, defaults.emptyText),
    closeOnSelect: bool(o.closeOnSelect, defaults.closeOnSelect),
    maxResults,
    showGroups: bool(o.showGroups, defaults.showGroups),
    footer: bool(o.footer, defaults.footer),
    labels: {
      title: str(labels.title, defaults.labels.title),
      navigate: str(labels.navigate, defaults.labels.navigate),
      select: str(labels.select, defaults.labels.select),
      close: str(labels.close, defaults.labels.close),
    },
    variant: oneOf(o.variant, ["dialog", "inline"] as const, defaults.variant, "variant"),
    size: oneOf(o.size, ["sm", "md", "lg"] as const, defaults.size, "size"),
  };
}

/** Token merge order: theme ← size ← user override (when theme is an object) */
export function resolveTokens({
  theme = defaults.theme,
  size = defaults.size,
}: Pick<CommandPaletteOptions, "theme" | "size">): Record<string, string> {
  const named = typeof theme === "string";
  if (named && !(theme in themes)) warn(`unknown theme: ${theme}, using ${defaults.theme}`);
  const base = (named ? themes[theme as CommandPaletteThemeName] : undefined) ?? themes.dark;
  const scale = sizes[size] ?? sizes.md;
  const tokens = { ...base, ...scale, ...(named ? {} : theme) };
  return Object.fromEntries(
    Object.entries(tokens).map(([key, value]) => [`--ux-command-palette-${key}`, value]),
  );
}

// ---------------------------------------------------------------------------
// Fuzzy search (subsequence match with scoring)

export interface FuzzyMatch {
  score: number;
  /** Indices of matched characters in the text */
  indices: number[];
}

const WORD_START = /[\s\-_/.:]/;

/** Greedy subsequence match of `q` in `t` starting at `start` */
function matchFrom(q: string, t: string, start: number): FuzzyMatch | null {
  const indices: number[] = [];
  let score = 0;
  let from = start;
  for (const char of q) {
    const at = t.indexOf(char, from);
    if (at < 0) return null;
    const prev = indices[indices.length - 1];
    if (prev !== undefined && at === prev + 1) score += 5;
    else if (prev !== undefined) score -= Math.min(at - prev - 1, 5);
    if (at === 0 || WORD_START.test(t[at - 1])) score += 3;
    score += 1;
    indices.push(at);
    from = at + 1;
  }
  score -= Math.min(indices[0], 10) * 0.5;
  if (t.startsWith(q)) score += 6;
  return { score, indices };
}

/** Subsequence match; rewards consecutive runs, word starts and an early first match */
export function fuzzyMatch(query: string, text: string): FuzzyMatch | null {
  const q = query.toLowerCase().replace(/\s+/g, "");
  if (!q) return { score: 0, indices: [] };
  const t = text.toLowerCase();
  let best: FuzzyMatch | null = null;
  // Try every occurrence of the first character, keep the best-scoring alignment
  for (let at = t.indexOf(q[0]); at >= 0; at = t.indexOf(q[0], at + 1)) {
    const m = matchFrom(q, t, at);
    if (!m) break;
    if (!best || m.score > best.score) best = m;
  }
  return best;
}

export interface CommandPaletteResult {
  item: CommandPaletteItem;
  /** Matched label characters (empty when matched by keywords or no query) */
  indices: number[];
}

export interface CommandPaletteSection {
  /** Empty string = no heading */
  group: string;
  results: CommandPaletteResult[];
}

function score(query: string, item: CommandPaletteItem): (FuzzyMatch & { label: boolean }) | null {
  const byLabel = fuzzyMatch(query, item.label);
  const byKeyword = (item.keywords ?? [])
    .map((word) => fuzzyMatch(query, word))
    .reduce<FuzzyMatch | null>(
      (best, m) => (m && (!best || m.score > best.score) ? m : best),
      null,
    );
  if (byLabel && (!byKeyword || byLabel.score >= byKeyword.score * 0.8))
    return { ...byLabel, label: true };
  return byKeyword ? { score: byKeyword.score * 0.8, indices: [], label: false } : null;
}

/** Filters, ranks and groups items; the flat order of the sections is the navigation order */
export function searchItems(
  items: CommandPaletteItem[],
  query: string,
  { maxResults, showGroups }: { maxResults: number; showGroups: boolean },
): CommandPaletteSection[] {
  const q = query.trim();
  const ranked: CommandPaletteResult[] = q
    ? items
        .map((item, index) => ({ item, index, match: score(q, item) }))
        .filter((r) => r.match !== null)
        .sort((a, b) => b.match!.score - a.match!.score || a.index - b.index)
        .map((r) => ({ item: r.item, indices: r.match!.label ? r.match!.indices : [] }))
    : items.map((item) => ({ item, indices: [] }));
  const limited = ranked.slice(0, maxResults);
  if (!showGroups) return limited.length ? [{ group: "", results: limited }] : [];
  // Groups keep the order in which their best result appears
  const sections = new Map<string, CommandPaletteResult[]>();
  for (const result of limited) {
    const group = result.item.group ?? "";
    sections.set(group, [...(sections.get(group) ?? []), result]);
  }
  return [...sections].map(([group, results]) => ({ group, results }));
}

/** Splits a label into plain / matched parts for highlighting */
export function highlightParts(
  label: string,
  indices: number[],
): { text: string; match: boolean }[] {
  const set = new Set(indices);
  const parts: { text: string; match: boolean }[] = [];
  for (let i = 0; i < label.length; i++) {
    const match = set.has(i);
    const last = parts[parts.length - 1];
    if (last && last.match === match) last.text += label[i];
    else parts.push({ text: label[i], match });
  }
  return parts;
}

// ---------------------------------------------------------------------------
// Hotkey

export interface ParsedHotkey {
  key: string;
  mod: boolean;
  ctrl: boolean;
  meta: boolean;
  shift: boolean;
  alt: boolean;
}

export function parseHotkey(hotkey: string): ParsedHotkey | null {
  const parts = hotkey
    .toLowerCase()
    .split("+")
    .map((p) => p.trim());
  const key = parts.pop();
  if (!key) return null;
  const known = new Set(["mod", "ctrl", "control", "meta", "cmd", "shift", "alt", "option"]);
  if (parts.some((p) => !known.has(p))) return null;
  return {
    key,
    mod: parts.includes("mod"),
    ctrl: parts.includes("ctrl") || parts.includes("control"),
    meta: parts.includes("meta") || parts.includes("cmd"),
    shift: parts.includes("shift"),
    alt: parts.includes("alt") || parts.includes("option"),
  };
}

/** Call only in the browser */
export function isMacPlatform(): boolean {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  const platform = nav.userAgentData?.platform ?? nav.platform ?? "";
  return /mac|iphone|ipad|ipod/i.test(platform);
}

export function matchesHotkey(event: KeyboardEvent, hotkey: ParsedHotkey, mac: boolean): boolean {
  const ctrl = hotkey.ctrl || (hotkey.mod && !mac);
  const meta = hotkey.meta || (hotkey.mod && mac);
  return (
    event.key.toLowerCase() === hotkey.key &&
    event.ctrlKey === ctrl &&
    event.metaKey === meta &&
    event.shiftKey === hotkey.shift &&
    event.altKey === hotkey.alt
  );
}

/** Next enabled index in `direction`, wrapping around; -1 when nothing is enabled */
export function stepIndex(
  results: CommandPaletteResult[],
  from: number,
  direction: 1 | -1,
): number {
  const n = results.length;
  for (let step = 1; step <= n; step++) {
    const i = (((from + direction * step) % n) + n) % n;
    if (!results[i].item.disabled) return i;
  }
  return -1;
}

export function firstEnabled(results: CommandPaletteResult[]): number {
  return results.findIndex((r) => !r.item.disabled);
}

export function lastEnabled(results: CommandPaletteResult[]): number {
  for (let i = results.length - 1; i >= 0; i--) if (!results[i].item.disabled) return i;
  return -1;
}

/** Default action after onSelect: navigate when the item has an href and was not handled */
export function runSelect(
  item: CommandPaletteItem,
  onSelect: CommandPaletteOptions["onSelect"],
): void {
  const handled = onSelect ? onSelect(item) !== false : false;
  if (!handled && item.href) window.location.assign(item.href);
}
