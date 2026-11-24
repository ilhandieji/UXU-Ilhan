import type { ComponentMeta } from "./types";

export const interactiveCardMeta: ComponentMeta = {
  slug: "interactive-card",
  name: "Interactive Card",
  description: "Card wrapper with a pointer-following spotlight, 3D tilt, glare and border glow.",
  files: {
    react: ["InteractiveCard.tsx", "interactive-card.config.ts"],
    vanilla: ["interactive-card.ts", "interactive-card.config.ts"],
  },
  configFile: "interactive-card.config.ts",
  requirements: ["Tailwind CSS v4.", "React version: react 19.3+ (latest stable: 19.3.1)."],
};
