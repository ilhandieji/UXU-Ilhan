import type { ComponentMeta } from "./types";

export const dockMeta: ComponentMeta = {
  slug: "dock",
  name: "Dock",
  description:
    "App-dock style icon toolbar with smooth cosine magnification, tooltips, badges, active dots, click bounce and full keyboard navigation.",
  files: {
    react: ["Dock.tsx", "dock.config.ts"],
    vanilla: ["dock.ts", "dock.config.ts"],
  },
  configFile: "dock.config.ts",
  requirements: ["Tailwind CSS v4.", "React version: react 19.3+ (latest stable: 19.3.1)."],
};
