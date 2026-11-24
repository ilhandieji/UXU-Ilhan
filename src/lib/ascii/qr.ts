// Text → QR code as a compact character grid: two modules per character using ▀ ▄ █.
import qrcode from "qrcode-generator";
import { BLANK, type Cell, type Grid } from "./grid";

export type QrLevel = "L" | "M" | "Q" | "H";
export const QR_LEVELS: QrLevel[] = ["L", "M", "Q", "H"];

export interface QrOptions {
  level: QrLevel;
  /**
   * Draw the light modules instead of the dark ones. Needed on dark backgrounds: scanners expect
   * dark modules on a light field, so on a dark page the "ink" has to be the light part.
   */
  invert: boolean;
  /** Quiet zone in modules (the spec asks for 4; 2 usually scans fine) */
  margin: number;
}

const MAX_TEXT = 1200;

// The library encodes Latin-1 by default; UTF-8 keeps Persian text and emoji scannable
qrcode.stringToBytes = (text: string) => Array.from(new TextEncoder().encode(text));

/** Returns null when the text does not fit in a QR code at this level */
export function qrGrid(
  text: string,
  { level, invert, margin }: QrOptions,
  fg?: string,
): Grid | null {
  const qr = qrcode(0, level);
  try {
    qr.addData(text.slice(0, MAX_TEXT) || " ");
    qr.make();
  } catch {
    return null;
  }
  const count = qr.getModuleCount();
  const size = count + margin * 2;
  // Modules outside the code (quiet zone) are light
  const ink = (row: number, col: number) => {
    const r = row - margin;
    const c = col - margin;
    const dark = r >= 0 && c >= 0 && r < count && c < count && qr.isDark(r, c);
    return invert ? !dark : dark;
  };
  const rows = Math.ceil(size / 2);
  const cells: Cell[] = [];
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < size; x++) {
      const top = ink(y * 2, x);
      const bottom = y * 2 + 1 < size ? ink(y * 2 + 1, x) : invert;
      const ch = top && bottom ? "█" : top ? "▀" : bottom ? "▄" : " ";
      cells.push(ch === " " ? BLANK : fg ? { ch, fg } : { ch });
    }
  return { width: size, height: rows, cells };
}
