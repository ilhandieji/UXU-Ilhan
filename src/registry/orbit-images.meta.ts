import type { ComponentMeta } from "./types";

export const orbitImagesMeta: ComponentMeta = {
  slug: "orbit-images",
  name: "Orbit Images",
  description:
    "Images that travel along a path with depth, drag/fling, mouse-wheel spin, scroll link, 3D tilt and 11 presets.",
  files: {
    react: ["OrbitImages.tsx", "orbit-images.config.ts", "orbit-images.engine.ts"],
    vanilla: ["orbit-images.ts", "orbit-images.config.ts", "orbit-images.engine.ts"],
  },
  configFile: "orbit-images.config.ts",
  requirements: [
    'Tailwind CSS v4. If the folder you copy into is not scanned automatically, add `@source "./path/to/folder";` to your CSS.',
    "React version: react 19.3+ (latest stable: 19.3.1), client component (works in Next.js as is).",
    "Replace the sample `images` in the config (picsum.photos) with your own.",
  ],
};
