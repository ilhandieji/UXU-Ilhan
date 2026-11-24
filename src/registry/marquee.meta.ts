import type { ComponentMeta } from "./types";

export const marqueeMeta: ComponentMeta = {
  slug: "marquee",
  name: "Marquee",
  description:
    "Infinite, seamless scrolling strip of text or elements with pause controls, edge fade, drag to scrub and multi-row mode.",
  files: {
    react: ["Marquee.tsx", "marquee.config.ts", "marquee.engine.ts"],
    vanilla: ["marquee.ts", "marquee.config.ts", "marquee.engine.ts"],
  },
  configFile: "marquee.config.ts",
  requirements: ["Tailwind CSS v4.", "React version: react 19.3+ (latest stable: 19.3.1)."],
};
