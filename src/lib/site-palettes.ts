// Site-wide palettes; every registry entry maps them onto its own tokens via `entry.palette`.
import type { SitePalette } from "@/registry/types";

export const SITE_PALETTES: SitePalette[] = [
  // The UXU-Ilhan brand palette (public/brand/uxu-ilhan-brand-reference.svg)
  { name: "UXU", bg: "#101412", fg: "#F0F4F1", accent: "#3BDF89", muted: "#65736B" },
  { name: "Midnight", bg: "#0b1020", fg: "#d7e0ff", accent: "#7aa2ff", muted: "#4b5a8a" },
  { name: "Sunset", bg: "#1a0b12", fg: "#ffd9c7", accent: "#ff6b4a", muted: "#9a4a5a" },
  { name: "Ocean", bg: "#031a22", fg: "#c9f3ff", accent: "#22d3ee", muted: "#2f6f80" },
  { name: "Forest", bg: "#08140c", fg: "#d6f5dc", accent: "#4ade80", muted: "#3f7a4d" },
  { name: "Candy", bg: "#1b0a1f", fg: "#ffe1fb", accent: "#ff4fd8", muted: "#8a4a99" },
  { name: "Mono", bg: "#0a0a0a", fg: "#ededed", accent: "#ffffff", muted: "#6b6b6b" },
  { name: "Paper", bg: "#f7f3ea", fg: "#2b2620", accent: "#c2410c", muted: "#8c8273" },
];

const hsl = (h: number, s: number, l: number) =>
  `hsl(${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%)`;

/** A harmonious random palette: dark background, light text, saturated accent on a nearby hue */
export function randomPalette(random = Math.random): SitePalette {
  const hue = random() * 360;
  const accentHue = (hue + 20 + random() * 140) % 360;
  return {
    name: "Random",
    bg: hsl(hue, 30 + random() * 30, 4 + random() * 6),
    fg: hsl(hue, 30 + random() * 40, 86 + random() * 8),
    accent: hsl(accentHue, 75 + random() * 25, 55 + random() * 12),
    muted: hsl(hue, 20 + random() * 30, 35 + random() * 12),
  };
}
