import type { ComponentMeta } from "./types";

export const glowCursorMeta: ComponentMeta = {
  slug: "glow-cursor",
  name: "Glow Cursor",
  description:
    "Light that pours from the cursor, drifts through a WebGL2 fluid simulation and cools as it fades. 11 presets, color modes, idle path and click bursts.",
  files: {
    react: ["GlowCursor.tsx", "glow-cursor.config.ts", "glow-cursor.engine.ts"],
    vanilla: ["glow-cursor.ts", "glow-cursor.config.ts", "glow-cursor.engine.ts"],
  },
  configFile: "glow-cursor.config.ts",
  requirements: [
    'Tailwind CSS v4. If the folder you copy into is not scanned automatically, add `@source "./path/to/folder";` to your CSS.',
    "React version: react 19.3+ (latest stable: 19.3.1), client component (works in Next.js as is).",
    "A browser with WebGL2 and EXT_color_buffer_float (all modern browsers). Use `fallback` / `onUnsupported` otherwise.",
    "The component fills its parent (h-full w-full): give the parent a height. The `fixed` variant covers the viewport.",
  ],
};
