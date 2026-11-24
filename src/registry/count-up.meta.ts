import type { ComponentMeta } from "./types";

export const countUpMeta: ComponentMeta = {
  slug: "count-up",
  name: "Count Up",
  description:
    "Animated number that counts to its value with rAF easing, Intl.NumberFormat locales (Persian digits), compact/currency formats and in-view triggering.",
  files: {
    react: ["CountUp.tsx", "count-up.config.ts"],
    vanilla: ["count-up.ts", "count-up.config.ts"],
  },
  configFile: "count-up.config.ts",
  requirements: [
    "Tailwind CSS v4.",
    "React version: react 19.3+ (latest stable: 19.3.1).",
    "Intl.NumberFormat with `notation` support (all modern browsers); inView uses IntersectionObserver (starts immediately without it).",
  ],
};
