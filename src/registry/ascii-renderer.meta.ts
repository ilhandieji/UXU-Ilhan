import type { ComponentMeta } from "./types";

export const asciiRendererMeta: ComponentMeta = {
  slug: "ascii-renderer",
  name: "ASCII Renderer",
  description:
    "Renders an image or video as live ASCII art on a HiDPI canvas or as selectable text, with charsets, dithering and terminal color modes.",
  files: {
    react: ["AsciiRenderer.tsx", "ascii-renderer.config.ts", "ascii-renderer.engine.ts"],
    vanilla: ["ascii-renderer.ts", "ascii-renderer.config.ts", "ascii-renderer.engine.ts"],
  },
  configFile: "ascii-renderer.config.ts",
  requirements: [
    "Tailwind CSS v4.",
    "React version: react 19.3+ (latest stable: 19.3.1).",
    'Cross-origin images/videos must be served with CORS headers (crossOrigin defaults to "anonymous").',
  ],
};
