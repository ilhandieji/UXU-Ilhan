// ScrambleText settings and types — names must match the React version.
// Styling is Tailwind-only: token values live here and are set as CSS variables
// `--ux-scramble-text-*` on the root element, consumed by the static classes below.

export type ScrambleTextThemeName = "matrix" | "cyber" | "plain" | "amber";
/** How not-yet-revealed characters look: full color, dimmed or faint */
export type ScrambleTextVariant = "solid" | "dim" | "ghost";
export type ScrambleTextSize = "sm" | "md" | "lg";
export type ScrambleTextTag = "span" | "p" | "h1" | "h2" | "h3" | "div";
export type ScrambleTextCharset =
  "symbols" | "hex" | "binary" | "katakana" | "alphanumeric" | "blocks" | "custom";
/** mount: once on mount · hover: on pointer enter · inView: once when visible · loop: forever · manual: only via play()/replay() */
export type ScrambleTextTrigger = "mount" | "hover" | "inView" | "loop" | "manual";
/** Which characters reveal first */
export type ScrambleTextDirection = "start" | "end" | "center" | "random";

/** Token keys without the --ux-scramble-text- prefix, e.g. { fg: '#0f0' } */
export type ScrambleTextTokens = Record<string, string>;

export interface ScrambleTextOptions {
  /** Final text; may contain spaces and newlines */
  text?: string;
  as?: ScrambleTextTag;
  theme?: ScrambleTextThemeName | ScrambleTextTokens;
  variant?: ScrambleTextVariant;
  size?: ScrambleTextSize;
  charset?: ScrambleTextCharset;
  /** Characters used when charset is "custom" */
  customChars?: string;
  /** Milliseconds between random character changes */
  speed?: number;
  /** Milliseconds each character scrambles before it is revealed */
  scrambleDuration?: number;
  /** Milliseconds between the start of consecutive characters */
  stagger?: number;
  trigger?: ScrambleTextTrigger;
  /** Pause between loop cycles (trigger "loop") in ms */
  loopDelay?: number;
  direction?: ScrambleTextDirection;
  /** Whitespace never scrambles */
  preserveSpaces?: boolean;
  /** Uses the mono-font token so the width does not jitter */
  monospace?: boolean;
  /** Applies the glow token as text-shadow */
  glow?: boolean;
  respectReducedMotion?: boolean;
  /** Called every time an animation run finishes */
  onComplete?: () => void;
}

export const defaults = {
  text: "DECRYPTING THE FUTURE",
  as: "span",
  theme: "matrix",
  variant: "solid",
  size: "md",
  charset: "symbols",
  customChars: "",
  speed: 40,
  scrambleDuration: 600,
  stagger: 40,
  trigger: "mount",
  loopDelay: 2000,
  direction: "start",
  preserveSpaces: true,
  monospace: true,
  glow: true,
  respectReducedMotion: true,
} satisfies ScrambleTextOptions;

export const charsets: Record<Exclude<ScrambleTextCharset, "custom">, string> = {
  symbols: "!<>-_\\/[]{}—=+*^?#",
  hex: "0123456789ABCDEF",
  binary: "01",
  katakana:
    "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン",
  alphanumeric: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
  blocks: "░▒▓█",
};

const common: ScrambleTextTokens = {
  "font-family": "system-ui, sans-serif",
  "mono-font": "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  "font-weight": "700",
  "letter-spacing": "1px",
  "line-height": "1.2",
};

export const themes: Record<ScrambleTextThemeName, ScrambleTextTokens> = {
  matrix: {
    ...common,
    fg: "#d1ffd6",
    scrambled: "#00ff41",
    glow: "0 0 12px rgb(0 255 65 / 0.55)",
  },
  cyber: {
    ...common,
    fg: "#5ff4ff",
    scrambled: "#ff3df2",
    glow: "0 0 14px rgb(255 61 242 / 0.5)",
  },
  plain: {
    ...common,
    fg: "currentColor",
    scrambled: "currentColor",
    glow: "none",
  },
  amber: {
    ...common,
    fg: "#ffd38a",
    scrambled: "#ff9f1a",
    glow: "0 0 12px rgb(255 159 26 / 0.5)",
  },
};

export const sizes: Record<ScrambleTextSize, ScrambleTextTokens> = {
  sm: { "font-size": "16px" },
  md: { "font-size": "28px" },
  lg: { "font-size": "48px" },
};

export const variants: Record<ScrambleTextVariant, ScrambleTextTokens> = {
  solid: { "scrambled-opacity": "1" },
  dim: { "scrambled-opacity": "0.6" },
  ghost: { "scrambled-opacity": "0.3" },
};

/** Tailwind v4 classes — complete, static strings (so the scanner can see them) */
export const classes = {
  root: "whitespace-pre-wrap break-words tabular-nums text-(color:--ux-scramble-text-fg) text-(length:--ux-scramble-text-font-size) font-(--ux-scramble-text-font-weight) tracking-(--ux-scramble-text-letter-spacing) leading-(--ux-scramble-text-line-height)",
  font: "font-(family-name:--ux-scramble-text-font-family)",
  mono: "font-(family-name:--ux-scramble-text-mono-font)",
  glow: "[text-shadow:var(--ux-scramble-text-glow)]",
  /** Copy of the final text for screen readers */
  srOnly: "sr-only",
  /** Not-yet-revealed character */
  scrambled:
    "text-(color:--ux-scramble-text-scrambled) opacity-(--ux-scramble-text-scrambled-opacity)",
};

/** Validated options without the callback */
export type ScrambleTextSettings = Required<Omit<ScrambleTextOptions, "onComplete" | "theme">> & {
  theme: ScrambleTextThemeName | ScrambleTextTokens;
  /** Characters actually used for scrambling */
  chars: string;
};

const warned = new Set<string>();
function warn(message: string) {
  if (warned.has(message)) return;
  warned.add(message);
  console.warn(`[ScrambleText] ${message}`);
}

function num(value: unknown, fallback: number, min: number, max: number, name: string): number {
  if (value === undefined) return fallback;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    warn(`invalid ${name}: ${String(value)}, using ${fallback}`);
    return fallback;
  }
  return Math.min(max, Math.max(min, value));
}

function oneOf<T extends string>(value: unknown, list: readonly T[], fallback: T, name: string): T {
  if (value === undefined) return fallback;
  if (list.includes(value as T)) return value as T;
  warn(`invalid ${name}: ${String(value)}, using ${fallback}`);
  return fallback;
}

const bool = (value: unknown, fallback: boolean) => (typeof value === "boolean" ? value : fallback);
const str = (value: unknown, fallback: string) => (typeof value === "string" ? value : fallback);

const TAGS = ["span", "p", "h1", "h2", "h3", "div"] as const;
const CHARSETS = [
  "symbols",
  "hex",
  "binary",
  "katakana",
  "alphanumeric",
  "blocks",
  "custom",
] as const;
const TRIGGERS = ["mount", "hover", "inView", "loop", "manual"] as const;
const DIRECTIONS = ["start", "end", "center", "random"] as const;

function resolveChars(charset: ScrambleTextCharset, customChars: string): string {
  if (charset !== "custom") return charsets[charset];
  const chars = Array.from(customChars.replace(/\s/g, "")).join("");
  if (chars) return chars;
  warn(`charset "custom" needs customChars, using ${defaults.charset}`);
  return charsets[defaults.charset];
}

export function resolveSettings(options: ScrambleTextOptions = {}): ScrambleTextSettings {
  const o = { ...defaults, ...options };
  const named = typeof o.theme === "string";
  if (named && !((o.theme as string) in themes))
    warn(`unknown theme: ${String(o.theme)}, using ${defaults.theme}`);
  const charset = oneOf(o.charset, CHARSETS, defaults.charset, "charset");
  const customChars = str(o.customChars, defaults.customChars);
  return {
    text: str(o.text, defaults.text),
    as: oneOf(o.as, TAGS, defaults.as, "as"),
    theme: named && (o.theme as string) in themes ? o.theme : named ? defaults.theme : o.theme,
    variant: oneOf(o.variant, ["solid", "dim", "ghost"] as const, defaults.variant, "variant"),
    size: oneOf(o.size, ["sm", "md", "lg"] as const, defaults.size, "size"),
    charset,
    customChars,
    chars: resolveChars(charset, customChars),
    speed: num(o.speed, defaults.speed, 10, 1000, "speed"),
    scrambleDuration: num(
      o.scrambleDuration,
      defaults.scrambleDuration,
      0,
      10000,
      "scrambleDuration",
    ),
    stagger: num(o.stagger, defaults.stagger, 0, 2000, "stagger"),
    trigger: oneOf(o.trigger, TRIGGERS, defaults.trigger, "trigger"),
    loopDelay: num(o.loopDelay, defaults.loopDelay, 0, 60000, "loopDelay"),
    direction: oneOf(o.direction, DIRECTIONS, defaults.direction, "direction"),
    preserveSpaces: bool(o.preserveSpaces, defaults.preserveSpaces),
    monospace: bool(o.monospace, defaults.monospace),
    glow: bool(o.glow, defaults.glow),
    respectReducedMotion: bool(o.respectReducedMotion, defaults.respectReducedMotion),
  };
}

/** Token merge order: theme ← size ← variant ← user override (when theme is an object) */
export function resolveTokens({
  theme,
  size,
  variant,
}: Pick<ScrambleTextSettings, "theme" | "size" | "variant">): Record<string, string> {
  const named = typeof theme === "string";
  const base = (named ? themes[theme] : undefined) ?? themes[defaults.theme];
  const tokens = { ...base, ...sizes[size], ...variants[variant], ...(named ? {} : theme) };
  return Object.fromEntries(
    Object.entries(tokens).map(([key, value]) => [`--ux-scramble-text-${key}`, value]),
  );
}

/** Root class list for the resolved settings */
export function rootClassName(settings: Pick<ScrambleTextSettings, "monospace" | "glow">): string {
  return [
    classes.root,
    settings.monospace ? classes.mono : classes.font,
    settings.glow && classes.glow,
  ]
    .filter(Boolean)
    .join(" ");
}
