// Terminal settings and types — names must match the React version. Spec: ../README.md
import type { CommandDef, TerminalCommand } from "./terminal.commands";
// Styling is Tailwind-only: token values live here and are set as CSS variables on the root.

export type TerminalThemeName = "matrix" | "classic-black" | "amber" | "light";
export type TerminalVariant = "window" | "fullscreen" | "minimal";
export type TerminalSize = "sm" | "md" | "lg";

/** Token keys without the --ux-terminal- prefix, e.g. { bg: '#000', accent: '#0f0' } */
export type TerminalTokens = Record<string, string>;

export interface TerminalPage {
  /** Page path, e.g. '/blog' */
  path: string;
  title: string;
}

export interface TerminalOptions {
  theme?: TerminalThemeName | TerminalTokens;
  variant?: TerminalVariant;
  size?: TerminalSize;
  /** Text glow (green glow) */
  glow?: boolean;
  user?: string;
  host?: string;
  /** Path shown in the prompt; empty = derived from the page URL (~/blog) */
  cwd?: string;
  /** Logged-in user (whoami / prompt); null = guest */
  currentUser?: string | null;
  /** Window title bar text; defaults to user@host:cwd */
  title?: string;
  /** ASCII banner shown on start and by the `banner` command; false = no banner */
  banner?: string[] | false;
  subtitle?: string;
  /** Status lines below the banner */
  boot?: { label: string; value: string }[];
  /** Short help list below the banner */
  help?: { name: string; description: string }[];
  placeholder?: string;
  /** Static site info (version / fastfetch) */
  site?: { name: string; version: string; language: string };
  /** Navigable pages (cd / ls / sitemap) */
  pages?: TerminalPage[];
  /** SPA navigation (e.g. router.push in Next.js); defaults to location.assign */
  navigate?: (path: string) => void;
  /** `back` command handler; defaults to history.back() */
  onBack?: () => void;
  /** ASCII logo on the left of fastfetch */
  fastfetchArt?: string[];
  /** Showcase data for ifconfig and nmap */
  showcase?: {
    ifconfig: string[];
    wifi: { essid: string; power: string; security: string }[];
    hosts: { ip: string; mac: string; host: string; ports: string }[];
  };
  /** Custom commands or overrides of built-in ones */
  commands?: Record<string, TerminalCommand | CommandDef>;
  /** Built-in games: typing, guess, quest */
  games?: boolean;
  /** Hidden fun commands (sudo, rm -rf /, matrix) */
  easterEggs?: boolean;
  /** Synthesized key click sounds (Web Audio, off by default) */
  sound?: { enabled: boolean; volume: number; profile: TerminalSoundProfile };
  /** Lines printed one by one before the banner; empty = no boot sequence */
  bootSequence?: {
    lines: TerminalBootLine[];
    /** Speed multiplier (2 = twice as fast) */
    speed: number;
    /** A key press or click skips the sequence */
    skippable: boolean;
    /** Remove the boot lines once the banner appears */
    clearAfter: boolean;
  };
  /** ASCII animations for the `play` command: frames of lines + frames per second */
  animations?: Record<string, { frames: string[][]; fps: number }>;
  onCommand?: (line: string) => void;
}

export type TerminalSoundProfile = "mechanical" | "soft" | "retro";
export interface TerminalBootLine {
  text: string;
  status?: "ok" | "fail" | "warn" | "info";
  /** Delay before this line in ms (default 120) */
  delay?: number;
}

type Optional = "currentUser" | "navigate" | "onBack" | "onCommand";
export type TerminalSettings = Required<Omit<TerminalOptions, Optional>> &
  Pick<TerminalOptions, Optional>;

export const defaults: TerminalSettings = {
  theme: "matrix",
  variant: "window",
  size: "md",
  glow: true,
  user: "guest",
  host: "portal",
  cwd: "",
  title: "",
  banner: [
    "██╗   ██╗██╗  ██╗██╗   ██╗      ██╗██╗     ██╗  ██╗ █████╗ ███╗   ██╗",
    "██║   ██║╚██╗██╔╝██║   ██║      ██║██║     ██║  ██║██╔══██╗████╗  ██║",
    "██║   ██║ ╚███╔╝ ██║   ██║█████╗██║██║     ███████║███████║██╔██╗ ██║",
    "██║   ██║ ██╔██╗ ██║   ██║╚════╝██║██║     ██╔══██║██╔══██║██║╚██╗██║",
    "╚██████╔╝██╔╝ ██╗╚██████╔╝      ██║███████╗██║  ██║██║  ██║██║ ╚████║",
    " ╚═════╝ ╚═╝  ╚═╝ ╚═════╝       ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝",
  ],
  subtitle: "UXU-Ilhan v1.01.1 — web terminal",
  boot: [
    { label: "session", value: "ready" },
    { label: "filesystem", value: "mounted" },
  ],
  help: [
    { name: "help", description: "list all commands" },
    { name: "fastfetch", description: "system information" },
    { name: "cd <page>", description: "go to a page" },
  ],
  placeholder: "help · ls · fastfetch",
  site: { name: "UXU-Ilhan", version: "v1.01.1", language: "TypeScript" },
  pages: [{ path: "/", title: "home" }],
  fastfetchArt: [
    "██╗   ██╗██╗  ██╗██╗   ██╗",
    "██║   ██║╚██╗██╔╝██║   ██║",
    "██║   ██║ ╚███╔╝ ██║   ██║",
    "██║   ██║ ██╔██╗ ██║   ██║",
    "╚██████╔╝██╔╝ ██╗╚██████╔╝",
    " ╚═════╝ ╚═╝  ╚═╝ ╚═════╝",
  ],
  showcase: {
    ifconfig: [
      "wlan0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500",
      "        inet 192.168.1.42  netmask 255.255.255.0",
      "        ether b8:27:eb:c4:f1:2a  txqueuelen 1000",
      "        RX 84291 packets / 112 MB      TX 41033 packets / 6.2 MB",
      "",
      "uxu0:  flags=4163<UP,RUNNING>  mtu 1420   (UXU-Ilhan virtual interface)",
      "        inet 10.66.0.2  netmask 255.255.255.0",
      "",
      "lo:    flags=73<UP,LOOPBACK,RUNNING>  mtu 65536",
      "        inet 127.0.0.1",
    ],
    wifi: [
      { essid: "UXU_LAB", power: "-44 dBm", security: "WPA3" },
      { essid: "HOME-WIFI-4C", power: "-71 dBm", security: "WPA2" },
      { essid: "Guest_Network", power: "-78 dBm", security: "OPEN" },
    ],
    hosts: [
      { ip: "192.168.1.1", mac: "b8:27:eb:c4:f1:2a", host: "router", ports: "80,443,22" },
      { ip: "192.168.1.5", mac: "d4:5d:df:44:ea:01", host: "DESKTOP-UXU", ports: "3389,135" },
      { ip: "192.168.1.9", mac: "a4:c3:f0:85:13:4d", host: "android-phone", ports: "62078" },
      { ip: "192.168.1.37", mac: "dc:a6:32:9f:d1:be", host: "uxu-pi", ports: "22,8080" },
    ],
  },
  commands: {},
  games: true,
  easterEggs: true,
  sound: { enabled: false, volume: 0.4, profile: "mechanical" },
  bootSequence: { lines: [], speed: 1, skippable: true, clearAfter: false },
  animations: {},
};

// ---- Tokens ----

const common: TerminalTokens = {
  "font-family": "ui-monospace, 'JetBrains Mono', 'Fira Code', Menlo, Consolas, monospace",
  "line-height": "1.6",
  "letter-spacing": "0em",
  "banner-size": "0.85em",
  "banner-line-height": "1.15",
  radius: "10px",
  shadow: "0 12px 36px rgb(0 0 0 / 0.45)",
  width: "100%",
  height: "420px",
  "dot-1": "#ff5f57",
  "dot-2": "#febc2e",
  "dot-3": "#28c840",
};

export const themes: Record<TerminalThemeName, TerminalTokens> = {
  matrix: {
    ...common,
    bg: "#000000",
    fg: "#b6ffc8",
    dim: "#3fbf63",
    accent: "#00ff41",
    cursor: "#00ff41",
    selection: "rgb(0 255 65 / 0.25)",
    error: "#ff4d4d",
    "titlebar-bg": "#050a06",
    "titlebar-fg": "#2c8f47",
    border: "#0f3a1c",
    glow: "0 0 1px rgb(0 255 65 / 0.35)",
    "glow-strong": "0 0 6px rgb(0 255 65 / 0.45)",
  },
  "classic-black": {
    ...common,
    bg: "#000000",
    fg: "#e6e6e6",
    dim: "#7a7a7a",
    accent: "#ffffff",
    cursor: "#ffffff",
    selection: "rgb(255 255 255 / 0.2)",
    error: "#ff4d4d",
    "titlebar-bg": "#111111",
    "titlebar-fg": "#7a7a7a",
    border: "#2a2a2a",
    glow: "none",
    "glow-strong": "0 0 6px rgb(255 255 255 / 0.25)",
  },
  amber: {
    ...common,
    bg: "#0b0700",
    fg: "#ffd9a0",
    dim: "#8a6a2a",
    accent: "#ffb000",
    cursor: "#ffb000",
    selection: "rgb(255 176 0 / 0.25)",
    error: "#ff5a4d",
    "titlebar-bg": "#150e02",
    "titlebar-fg": "#8a6a2a",
    border: "#3a2a08",
    glow: "0 0 1px rgb(255 176 0 / 0.35)",
    "glow-strong": "0 0 6px rgb(255 176 0 / 0.45)",
  },
  light: {
    ...common,
    bg: "#f6faf6",
    fg: "#1b2a1f",
    dim: "#6b8a73",
    accent: "#0a7d2c",
    cursor: "#0a7d2c",
    selection: "rgb(10 125 44 / 0.2)",
    error: "#c62828",
    "titlebar-bg": "#e6f0e8",
    "titlebar-fg": "#6b8a73",
    border: "#cfe3d4",
    shadow: "0 8px 24px rgb(0 0 0 / 0.12)",
    glow: "none",
    "glow-strong": "none",
  },
};

export const sizes: Record<TerminalSize, TerminalTokens> = {
  sm: { "font-size": "12px", padding: "12px" },
  md: { "font-size": "14px", padding: "18px" },
  lg: { "font-size": "17px", padding: "22px" },
};

export const variants: Record<TerminalVariant, TerminalTokens> = {
  window: {},
  fullscreen: { radius: "0px", width: "100vw", height: "100vh" },
  minimal: { shadow: "none", radius: "4px" },
};

/** Tailwind v4 classes — complete, static strings (so the scanner can see them) */
export const classes = {
  root: "relative box-border flex flex-col overflow-hidden border border-(color:--ux-terminal-border) bg-(color:--ux-terminal-bg) text-(color:--ux-terminal-accent) font-(family-name:--ux-terminal-font-family) text-(length:--ux-terminal-font-size) leading-(--ux-terminal-line-height) tracking-(--ux-terminal-letter-spacing) rounded-(--ux-terminal-radius) w-(--ux-terminal-width) [box-shadow:var(--ux-terminal-shadow)] selection:bg-(color:--ux-terminal-selection)",
  bar: "relative flex h-10 shrink-0 items-center border-b border-(color:--ux-terminal-border) bg-(color:--ux-terminal-titlebar-bg) px-3.5",
  dots: "flex gap-2",
  dot: [
    "size-3 rounded-full bg-(color:--ux-terminal-dot-1)",
    "size-3 rounded-full bg-(color:--ux-terminal-dot-2)",
    "size-3 rounded-full bg-(color:--ux-terminal-dot-3)",
  ],
  title:
    "pointer-events-none absolute inset-x-0 truncate px-20 text-center text-[0.9em] text-(color:--ux-terminal-titlebar-fg)",
  screen:
    "h-(--ux-terminal-height) cursor-text overflow-y-auto [scrollbar-width:thin] [scrollbar-color:var(--ux-terminal-dim)_transparent] p-(--ux-terminal-padding) [text-shadow:var(--ux-terminal-glow)]",
  banner:
    "overflow-x-auto whitespace-pre text-(length:--ux-terminal-banner-size) leading-(--ux-terminal-banner-line-height) tracking-normal [text-shadow:var(--ux-terminal-glow-strong)]",
  dim: "text-(color:--ux-terminal-dim)",
  bright: "text-(color:--ux-terminal-fg)",
  accent: "text-(color:--ux-terminal-accent)",
  error: "text-(color:--ux-terminal-error)",
  gap: "h-3",
  line: "whitespace-pre-wrap break-words",
  fetch: "flex flex-wrap items-start gap-x-6 gap-y-2 py-1",
  fetchArt:
    "whitespace-pre leading-(--ux-terminal-banner-line-height) text-(color:--ux-terminal-accent) [text-shadow:var(--ux-terminal-glow-strong)]",
  rowBusy: "flex items-center gap-2 opacity-0",
  helpRow: "flex gap-6",
  helpName: "w-28 shrink-0 text-(color:--ux-terminal-fg)",
  row: "flex items-center gap-2",
  prompt: "shrink-0 whitespace-pre [text-shadow:var(--ux-terminal-glow-strong)]",
  input:
    "min-w-0 flex-1 border-0 bg-transparent p-0 font-[inherit] text-[inherit] text-(color:--ux-terminal-fg) outline-none caret-(color:--ux-terminal-cursor) [text-shadow:inherit] placeholder:text-(color:--ux-terminal-dim)",
};

/** Token merge order: theme ← size ← variant ← glow ← user override (when theme is an object) */
export function resolveTokens({
  theme,
  size,
  variant,
  glow,
}: Required<Pick<TerminalOptions, "theme" | "size" | "variant" | "glow">>): Record<string, string> {
  const named = typeof theme === "string";
  const base = (named ? themes[theme] : undefined) ?? themes.matrix;
  const tokens = {
    ...base,
    ...sizes[size],
    ...variants[variant],
    ...(glow ? {} : { glow: "none", "glow-strong": "none" }),
    ...(named ? {} : theme),
  };
  return Object.fromEntries(
    Object.entries(tokens).map(([key, value]) => [`--ux-terminal-${key}`, value]),
  );
}
