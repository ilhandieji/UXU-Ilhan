import type { ComponentMeta } from "./types";

export const magneticButtonMeta: ComponentMeta = {
  slug: "magnetic-button",
  name: "Magnetic Button",
  description:
    "A native button or link that is pulled toward the pointer with a springy lerp, label parallax, hover scale and click ripple.",
  files: {
    react: ["MagneticButton.tsx", "magnetic-button.config.ts"],
    vanilla: ["magnetic-button.ts", "magnetic-button.config.ts"],
  },
  configFile: "magnetic-button.config.ts",
  requirements: ["Tailwind CSS v4.", "React version: react 19.3+ (latest stable: 19.3.1)."],
};
