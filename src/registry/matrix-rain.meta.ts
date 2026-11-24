import type { ComponentMeta } from "./types";

export const matrixRainMeta: ComponentMeta = {
  slug: "matrix-rain",
  name: "Matrix Rain",
  description:
    "Falling-character canvas background with glowing heads, 5 presets, 6 charsets, pointer interaction, bursts and a click-through fullscreen variant.",
  files: {
    react: ["MatrixRain.tsx", "matrix-rain.config.ts", "matrix-rain.engine.ts"],
    vanilla: ["matrix-rain.ts", "matrix-rain.config.ts", "matrix-rain.engine.ts"],
  },
  configFile: "matrix-rain.config.ts",
  requirements: ["Tailwind CSS v4.", "React version: react 19.3+ (latest stable: 19.3.1)."],
};
