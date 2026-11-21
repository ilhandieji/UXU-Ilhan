// FIGlet fonts for text → ASCII. Core fonts load synchronously (Terminal banner + editor);
// extra fonts are imported on demand by the editor so they never enter the Terminal page bundle.
import figlet from "figlet";
import ansiShadow from "figlet/importable-fonts/ANSI Shadow.js";
import banner3 from "figlet/importable-fonts/Banner3.js";
import big from "figlet/importable-fonts/Big.js";
import block from "figlet/importable-fonts/Block.js";
import calvinS from "figlet/importable-fonts/Calvin S.js";
import colossal from "figlet/importable-fonts/Colossal.js";
import doom from "figlet/importable-fonts/Doom.js";
import slant from "figlet/importable-fonts/Slant.js";
import small from "figlet/importable-fonts/Small.js";
import standard from "figlet/importable-fonts/Standard.js";

const CORE: Record<string, string> = {
  "ANSI Shadow": ansiShadow,
  Standard: standard,
  Big: big,
  Slant: slant,
  Small: small,
  Block: block,
  Doom: doom,
  Banner3: banner3,
  Colossal: colossal,
  "Calvin S": calvinS,
};

const EXTRA: Record<string, () => Promise<{ default: string }>> = {
  "ANSI Regular": () => import("figlet/importable-fonts/ANSI Regular.js"),
  "3D-ASCII": () => import("figlet/importable-fonts/3D-ASCII.js"),
  "Big Money-ne": () => import("figlet/importable-fonts/Big Money-ne.js"),
  Bigfig: () => import("figlet/importable-fonts/Bigfig.js"),
  Bloody: () => import("figlet/importable-fonts/Bloody.js"),
  "Delta Corps Priest 1": () => import("figlet/importable-fonts/Delta Corps Priest 1.js"),
  "DOS Rebel": () => import("figlet/importable-fonts/DOS Rebel.js"),
  Electronic: () => import("figlet/importable-fonts/Electronic.js"),
  Elite: () => import("figlet/importable-fonts/Elite.js"),
  Fraktur: () => import("figlet/importable-fonts/Fraktur.js"),
  Graffiti: () => import("figlet/importable-fonts/Graffiti.js"),
  Isometric1: () => import("figlet/importable-fonts/Isometric1.js"),
  Lean: () => import("figlet/importable-fonts/Lean.js"),
  Mini: () => import("figlet/importable-fonts/Mini.js"),
  Ogre: () => import("figlet/importable-fonts/Ogre.js"),
  Poison: () => import("figlet/importable-fonts/Poison.js"),
  Rectangles: () => import("figlet/importable-fonts/Rectangles.js"),
  Shadow: () => import("figlet/importable-fonts/Shadow.js"),
  "Small Slant": () => import("figlet/importable-fonts/Small Slant.js"),
  Speed: () => import("figlet/importable-fonts/Speed.js"),
  "Star Wars": () => import("figlet/importable-fonts/Star Wars.js"),
  "Sub-Zero": () => import("figlet/importable-fonts/Sub-Zero.js"),
  Univers: () => import("figlet/importable-fonts/Univers.js"),
};

export const CORE_FONTS = Object.keys(CORE);
export const ALL_FONTS = [...CORE_FONTS, ...Object.keys(EXTRA)];
export const DEFAULT_FONT = "ANSI Shadow";

export type AsciiLayout = "default" | "fitted" | "full" | "smushed";
export type AsciiAlign = "left" | "center" | "right";

const KERNING: Record<AsciiLayout, "default" | "fitted" | "full" | "universal smushing"> = {
  default: "default",
  fitted: "fitted",
  full: "full",
  smushed: "universal smushing",
};

const parsed = new Set<string>();

function ensureParsed(font: string): boolean {
  if (parsed.has(font)) return true;
  const data = CORE[font];
  if (!data) return false;
  figlet.parseFont(font, data);
  parsed.add(font);
  return true;
}

export const isFontReady = (font: string) => parsed.has(font) || font in CORE;

/** Loads an extra font (no-op for core fonts); resolves false for unknown names */
export async function loadFont(font: string): Promise<boolean> {
  if (ensureParsed(font)) return true;
  const loader = EXTRA[font];
  if (!loader) return false;
  const { default: data } = await loader();
  figlet.parseFont(font, data);
  parsed.add(font);
  return true;
}

export interface TextOptions {
  font?: string;
  layout?: AsciiLayout;
  align?: AsciiAlign;
  /** Wrap width in columns (0 = no wrap) */
  width?: number;
}

/**
 * Text → ASCII lines. Each input line is rendered separately, so multi-line text stacks.
 * Falls back to the default font while an extra font is still loading.
 */
export function renderText(
  text: string,
  { font = DEFAULT_FONT, layout = "default", align = "left", width = 0 }: TextOptions = {},
): string[] {
  const name = isFontReady(font) ? font : DEFAULT_FONT;
  ensureParsed(name);
  const blocks = text.split(/\r?\n/).map((line) =>
    line.trim()
      ? figlet
          .textSync(line, {
            font: name,
            horizontalLayout: KERNING[layout],
            width: width > 0 ? width : undefined,
            whitespaceBreak: width > 0,
          })
          .split("\n")
      : [""],
  );
  const lines = blocks.flat().map((l) => l.replace(/\s+$/u, ""));
  while (lines.length && !lines[lines.length - 1]) lines.pop();
  while (lines.length && !lines[0]) lines.shift();
  const max = Math.max(0, ...lines.map((l) => Array.from(l).length));
  return lines.map((line) => {
    if (!line) return line;
    const pad = max - Array.from(line).length;
    if (align === "center") return " ".repeat(Math.floor(pad / 2)) + line;
    if (align === "right") return " ".repeat(pad) + line;
    return line;
  });
}
