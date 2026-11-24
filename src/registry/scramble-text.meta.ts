import type { ComponentMeta } from "./types";

export const scrambleTextMeta: ComponentMeta = {
  slug: "scramble-text",
  name: "Scramble Text",
  description:
    "Decrypting text effect that scrambles random characters before revealing the final text, with split-flap transitions between texts.",
  files: {
    react: ["ScrambleText.tsx", "scramble-text.config.ts", "scramble-text.engine.ts"],
    vanilla: ["scramble-text.ts", "scramble-text.config.ts", "scramble-text.engine.ts"],
  },
  configFile: "scramble-text.config.ts",
  requirements: ["Tailwind CSS v4.", "React version: react 19.3+ (latest stable: 19.3.1)."],
};
