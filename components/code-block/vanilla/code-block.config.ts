// CodeBlock settings and types — names must match the other version (React / Vanilla).
// Styling is Tailwind-only: token values live here and are set as `--ux-code-block-*` CSS variables on the root.

import type { TokenKind } from "./code-block.highlight";

export type CodeBlockThemeName = "midnight" | "vampire" | "paper" | "terminal";
/** default: header bar · minimal: no header (floating copy button) · window: macOS-like window */
export type CodeBlockVariant = "default" | "minimal" | "window";
export type CodeBlockSize = "sm" | "md" | "lg";

/** Token keys without the --ux-code-block- prefix, e.g. { bg: '#000', keyword: '#f0f' } */
export type CodeBlockTokens = Record<string, string>;

export interface CodeBlockOptions {
  code?: string;
  /** ts, tsx, js, jsx, json, css, bash/sh, html/xml, text (unknown = text) */
  language?: string;
  /** File name shown in the header */
  title?: string;
  showLineNumbers?: boolean;
  /** First line number */
  startLine?: number;
  /** "1,3-5" or [1, 3, 4, 5] — the displayed line numbers (startLine counts) */
  highlightLines?: string | number[];
  /** Soft wrap long lines instead of scrolling horizontally */
  wrap?: boolean;
  /** Show the copy button */
  copy?: boolean;
  copyLabel?: string;
  copiedLabel?: string;
  /** CSS length, e.g. "320px"; "none" = no limit (content scrolls beyond it) */
  maxHeight?: string;
  /** Language badge in the header */
  showLanguage?: boolean;
  /** Three window dots in the header (always on in the `window` variant) */
  windowControls?: boolean;
  /** Accessible name of the code region; empty = title or "Code" */
  ariaLabel?: string;
  theme?: CodeBlockThemeName | CodeBlockTokens;
  variant?: CodeBlockVariant;
  size?: CodeBlockSize;
  /**
   * Escape hatch for a real highlighter (shiki, prism, …). The returned string is inserted
   * as HTML AS-IS — it must come from a trusted highlighter that escapes the code itself.
   * Line numbers and highlighted lines are not applied to custom HTML.
   */
  highlight?: (code: string, language: string) => string;
  /** Called after the code was copied successfully */
  onCopy?: (code: string) => void;
}

export const defaults = {
  code: "",
  language: "ts",
  title: "",
  showLineNumbers: true,
  startLine: 1,
  highlightLines: "",
  wrap: false,
  copy: true,
  copyLabel: "Copy",
  copiedLabel: "Copied",
  maxHeight: "none",
  showLanguage: true,
  windowControls: false,
  ariaLabel: "",
  theme: "midnight",
  variant: "default",
  size: "md",
} satisfies CodeBlockOptions;

/** How long the "Copied" state stays visible */
export const COPIED_MS = 1500;

const mono = "ui-monospace, SFMono-Regular, 'JetBrains Mono', Menlo, Consolas, monospace";

export const themes: Record<CodeBlockThemeName, CodeBlockTokens> = {
  midnight: {
    bg: "#0d1117",
    fg: "#e6edf3",
    "header-bg": "#161b22",
    "header-fg": "#8b949e",
    border: "#30363d",
    "line-number": "#6e7681",
    "line-highlight": "#388bfd26",
    selection: "#264f78",
    comment: "#8b949e",
    string: "#a5d6ff",
    keyword: "#ff7b72",
    number: "#79c0ff",
    function: "#d2a8ff",
    type: "#ffa657",
    operator: "#ff7b72",
    punctuation: "#c9d1d9",
    tag: "#7ee787",
    attribute: "#79c0ff",
    property: "#79c0ff",
    variable: "#e6edf3",
    accent: "#58a6ff",
    "dot-close": "#ff5f57",
    "dot-minimize": "#febc2e",
    "dot-maximize": "#28c840",
    "font-family": mono,
    radius: "10px",
  },
  vampire: {
    bg: "#282a36",
    fg: "#f8f8f2",
    "header-bg": "#21222c",
    "header-fg": "#9ea8c7",
    border: "#44475a",
    "line-number": "#6272a4",
    "line-highlight": "#44475a99",
    selection: "#44475a",
    comment: "#6272a4",
    string: "#f1fa8c",
    keyword: "#ff79c6",
    number: "#bd93f9",
    function: "#50fa7b",
    type: "#8be9fd",
    operator: "#ff79c6",
    punctuation: "#f8f8f2",
    tag: "#ff79c6",
    attribute: "#50fa7b",
    property: "#ffb86c",
    variable: "#f8f8f2",
    accent: "#bd93f9",
    "dot-close": "#ff5555",
    "dot-minimize": "#f1fa8c",
    "dot-maximize": "#50fa7b",
    "font-family": mono,
    radius: "12px",
  },
  paper: {
    bg: "#ffffff",
    fg: "#1f2328",
    "header-bg": "#f6f8fa",
    "header-fg": "#59636e",
    border: "#d1d9e0",
    "line-number": "#8c959f",
    "line-highlight": "#fff8c5",
    selection: "#b6d7ff",
    comment: "#59636e",
    string: "#0a3069",
    keyword: "#cf222e",
    number: "#0550ae",
    function: "#8250df",
    type: "#953800",
    operator: "#cf222e",
    punctuation: "#1f2328",
    tag: "#116329",
    attribute: "#0550ae",
    property: "#0550ae",
    variable: "#1f2328",
    accent: "#0969da",
    "dot-close": "#ff5f57",
    "dot-minimize": "#febc2e",
    "dot-maximize": "#28c840",
    "font-family": mono,
    radius: "10px",
  },
  terminal: {
    bg: "#050a05",
    fg: "#b8f5b8",
    "header-bg": "#0a140a",
    "header-fg": "#5fd35f",
    border: "#1f4d1f",
    "line-number": "#2f6f2f",
    "line-highlight": "#123312",
    selection: "#1f5c1f",
    comment: "#3f7f3f",
    string: "#d4ff8a",
    keyword: "#39ff14",
    number: "#7dffb2",
    function: "#a8ff60",
    type: "#00e08a",
    operator: "#5fff5f",
    punctuation: "#6fbf6f",
    tag: "#39ff14",
    attribute: "#a8ff60",
    property: "#7dffb2",
    variable: "#b8f5b8",
    accent: "#39ff14",
    "dot-close": "#39ff14",
    "dot-minimize": "#2fbf2f",
    "dot-maximize": "#1f7f1f",
    "font-family": mono,
    radius: "4px",
  },
};

export const sizes: Record<CodeBlockSize, CodeBlockTokens> = {
  sm: { "font-size": "12px", "header-font-size": "11px", "line-height": "1.6", padding: "12px" },
  md: { "font-size": "14px", "header-font-size": "12px", "line-height": "1.65", padding: "16px" },
  lg: { "font-size": "16px", "header-font-size": "13px", "line-height": "1.7", padding: "20px" },
};

export const variants: Record<CodeBlockVariant, CodeBlockTokens> = {
  default: { shadow: "none" },
  minimal: { shadow: "none" },
  window: { shadow: "0 24px 60px -16px rgb(0 0 0 / 0.6)" },
};

/** Tailwind v4 classes — complete, static strings (so the scanner can see them) */
export const classes = {
  root: "group/code-block relative flex w-full min-w-0 flex-col overflow-hidden border border-(color:--ux-code-block-border) rounded-(--ux-code-block-radius) bg-(color:--ux-code-block-bg) text-(color:--ux-code-block-fg) font-(family-name:--ux-code-block-font-family) text-(length:--ux-code-block-font-size) [box-shadow:var(--ux-code-block-shadow)] selection:bg-(color:--ux-code-block-selection)",
  header:
    "flex min-h-10 shrink-0 items-center gap-3 border-b border-(color:--ux-code-block-border) bg-(color:--ux-code-block-header-bg) px-(--ux-code-block-padding) py-2 text-(color:--ux-code-block-header-fg) text-(length:--ux-code-block-header-font-size)",
  dots: "flex shrink-0 items-center gap-1.5",
  dotClose: "size-3 rounded-full bg-(color:--ux-code-block-dot-close)",
  dotMinimize: "size-3 rounded-full bg-(color:--ux-code-block-dot-minimize)",
  dotMaximize: "size-3 rounded-full bg-(color:--ux-code-block-dot-maximize)",
  title: "min-w-0 flex-1 truncate font-medium",
  /** Window variant: title centered between the dots and the actions */
  titleCentered: "min-w-0 flex-1 truncate text-center font-medium",
  actions: "ml-auto flex shrink-0 items-center gap-2",
  language:
    "rounded-full border border-(color:--ux-code-block-border) px-2 py-0.5 uppercase tracking-wide",
  copyButton:
    "inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-(color:--ux-code-block-header-fg) transition-colors hover:bg-(color:--ux-code-block-line-highlight) hover:text-(color:--ux-code-block-fg) focus-visible:outline-2 focus-visible:outline-(color:--ux-code-block-accent) data-[copied=true]:text-(color:--ux-code-block-accent)",
  /** Minimal variant: the button floats over the code */
  copyFloating:
    "absolute top-2 right-2 z-10 inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-(color:--ux-code-block-border) bg-(color:--ux-code-block-header-bg) px-2 py-1 text-(color:--ux-code-block-header-fg) text-(length:--ux-code-block-header-font-size) opacity-0 transition-opacity group-hover/code-block:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-(color:--ux-code-block-accent) data-[copied=true]:opacity-100 data-[copied=true]:text-(color:--ux-code-block-accent) [@media(hover:none)]:opacity-100",
  copyIcon: "size-3.5 shrink-0",
  srOnly: "sr-only",
  pre: "m-0 min-h-0 flex-1 overflow-auto py-(--ux-code-block-padding) leading-(--ux-code-block-line-height) max-h-(--ux-code-block-max-height) focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(color:--ux-code-block-accent)",
  code: "block min-w-full w-max",
  codeWrap: "block w-full",
  /** Custom highlighter HTML */
  codeHtml: "block min-w-full w-max px-(--ux-code-block-padding)",
  codeHtmlWrap: "block w-full px-(--ux-code-block-padding) whitespace-pre-wrap break-words",
  line: "flex px-(--ux-code-block-padding)",
  lineHighlighted: "flex px-(--ux-code-block-padding) bg-(color:--ux-code-block-line-highlight)",
  lineNumber:
    "mr-4 inline-block w-(--ux-code-block-gutter) shrink-0 select-none text-right text-(color:--ux-code-block-line-number)",
  lineContent: "whitespace-pre",
  lineContentWrap: "min-w-0 flex-1 whitespace-pre-wrap break-words",
} as const;

/** Static class per token kind (consumes the color tokens) */
export const tokenClasses: Record<TokenKind, string> = {
  comment: "text-(color:--ux-code-block-comment) italic",
  string: "text-(color:--ux-code-block-string)",
  keyword: "text-(color:--ux-code-block-keyword)",
  number: "text-(color:--ux-code-block-number)",
  function: "text-(color:--ux-code-block-function)",
  type: "text-(color:--ux-code-block-type)",
  operator: "text-(color:--ux-code-block-operator)",
  punctuation: "text-(color:--ux-code-block-punctuation)",
  tag: "text-(color:--ux-code-block-tag)",
  attribute: "text-(color:--ux-code-block-attribute)",
  property: "text-(color:--ux-code-block-property)",
  variable: "text-(color:--ux-code-block-variable)",
};

/** Lucide-style icon paths (24×24, stroke) — static markup built with createElementNS / JSX */
export const icons = {
  copy: ["M8 8h12v12H8z", "M16 8V4H4v12h4"],
  check: ["M20 6 9 17l-5-5"],
};

export type CodeBlockSettings = Required<
  Omit<CodeBlockOptions, "theme" | "highlight" | "onCopy" | "highlightLines">
> & {
  theme: CodeBlockThemeName | CodeBlockTokens;
  highlightLines: Set<number>;
  highlight?: (code: string, language: string) => string;
  onCopy?: (code: string) => void;
};

const warned = new Set<string>();
function warn(message: string) {
  if (warned.has(message)) return;
  warned.add(message);
  console.warn(`[CodeBlock] ${message}`);
}

function oneOf<T extends string>(value: unknown, list: readonly T[], fallback: T, name: string): T {
  if (value === undefined) return fallback;
  if (list.includes(value as T)) return value as T;
  warn(`invalid ${name}: ${String(value)}, using ${fallback}`);
  return fallback;
}

function bool(value: unknown, fallback: boolean, name: string): boolean {
  if (value === undefined || typeof value === "boolean") return value ?? fallback;
  warn(`invalid ${name}: ${String(value)}, using ${fallback}`);
  return fallback;
}

function str(value: unknown, fallback: string, name: string): string {
  if (value === undefined || typeof value === "string") return value ?? fallback;
  warn(`invalid ${name}: ${String(value)}, using "${fallback}"`);
  return fallback;
}

/** "1,3-5" / [1, 3, 4, 5] → Set of line numbers; invalid parts are skipped with a warning */
export function parseLineRanges(value: unknown): Set<number> {
  const lines = new Set<number>();
  if (value === undefined || value === "") return lines;
  const parts = Array.isArray(value)
    ? value.map(String)
    : typeof value === "string"
      ? value.split(",")
      : null;
  if (!parts) {
    warn(`invalid highlightLines: ${String(value)}`);
    return lines;
  }
  for (const part of parts) {
    const m = /^\s*(\d+)\s*(?:-\s*(\d+)\s*)?$/.exec(part);
    if (!m) {
      if (part.trim()) warn(`invalid highlightLines part: "${part}"`);
      continue;
    }
    const from = Number(m[1]);
    const to = Math.min(Number(m[2] ?? m[1]), from + 10_000);
    for (let n = from; n <= to; n++) lines.add(n);
  }
  return lines;
}

/** Validated settings with defaults applied */
export function resolveSettings(options: CodeBlockOptions = {}): CodeBlockSettings {
  const o = options;
  const named = typeof o.theme === "string";
  let theme: CodeBlockThemeName | CodeBlockTokens = defaults.theme;
  if (named && (o.theme as string) in themes) theme = o.theme as CodeBlockThemeName;
  else if (named) warn(`unknown theme: ${String(o.theme)}, using ${defaults.theme}`);
  else if (o.theme && typeof o.theme === "object") theme = o.theme;
  const startLine = o.startLine ?? defaults.startLine;
  const validStart = Number.isInteger(startLine) && startLine >= 0;
  if (!validStart) warn(`invalid startLine: ${String(startLine)}, using ${defaults.startLine}`);

  return {
    code: str(o.code, defaults.code, "code"),
    language:
      str(o.language, defaults.language, "language").trim().toLowerCase() || defaults.language,
    title: str(o.title, defaults.title, "title"),
    showLineNumbers: bool(o.showLineNumbers, defaults.showLineNumbers, "showLineNumbers"),
    startLine: validStart ? startLine : defaults.startLine,
    highlightLines: parseLineRanges(o.highlightLines),
    wrap: bool(o.wrap, defaults.wrap, "wrap"),
    copy: bool(o.copy, defaults.copy, "copy"),
    copyLabel: str(o.copyLabel, defaults.copyLabel, "copyLabel") || defaults.copyLabel,
    copiedLabel: str(o.copiedLabel, defaults.copiedLabel, "copiedLabel") || defaults.copiedLabel,
    maxHeight: str(o.maxHeight, defaults.maxHeight, "maxHeight").trim() || defaults.maxHeight,
    showLanguage: bool(o.showLanguage, defaults.showLanguage, "showLanguage"),
    windowControls: bool(o.windowControls, defaults.windowControls, "windowControls"),
    ariaLabel: str(o.ariaLabel, defaults.ariaLabel, "ariaLabel"),
    theme,
    variant: oneOf(
      o.variant,
      ["default", "minimal", "window"] as const,
      defaults.variant,
      "variant",
    ),
    size: oneOf(o.size, ["sm", "md", "lg"] as const, defaults.size, "size"),
    highlight: typeof o.highlight === "function" ? o.highlight : undefined,
    onCopy: typeof o.onCopy === "function" ? o.onCopy : undefined,
  };
}

/** Token merge order: theme ← size ← variant ← user override (when theme is an object) */
export function resolveTokens(
  settings: CodeBlockSettings,
  lineCount: number,
): Record<string, string> {
  const { theme, size, variant } = settings;
  const named = typeof theme === "string";
  const base = (named ? themes[theme] : undefined) ?? themes[defaults.theme];
  const tokens: CodeBlockTokens = {
    ...base,
    ...sizes[size],
    ...variants[variant],
    ...(named ? {} : theme),
    "max-height": settings.maxHeight,
    // Gutter fits the widest line number
    gutter: `${String(settings.startLine + Math.max(lineCount, 1) - 1).length}ch`,
  };
  return Object.fromEntries(
    Object.entries(tokens).map(([key, value]) => [`--ux-code-block-${key}`, value]),
  );
}

/** Copies text with the async Clipboard API, falling back to a hidden textarea + execCommand */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Permission denied or unsupported: try the legacy path below
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.className = "fixed top-0 left-0 opacity-0 pointer-events-none";
  document.body.append(area);
  area.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  area.remove();
  return ok;
}
