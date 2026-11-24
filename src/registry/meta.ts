// Server-safe list of components (sidebar, routes, sources). `pnpm new` adds entries below the markers.
import { terminalMeta } from "./terminal.meta";
import { glowCursorMeta } from "./glow-cursor.meta";
import { orbitImagesMeta } from "./orbit-images.meta";
import { commandPaletteMeta } from "./command-palette.meta";
import { scrambleTextMeta } from "./scramble-text.meta";
import { matrixRainMeta } from "./matrix-rain.meta";
import { asciiRendererMeta } from "./ascii-renderer.meta";
import { interactiveCardMeta } from "./interactive-card.meta";
import { magneticButtonMeta } from "./magnetic-button.meta";
import { dockMeta } from "./dock.meta";
import { marqueeMeta } from "./marquee.meta";
import { countUpMeta } from "./count-up.meta";
import { codeBlockMeta } from "./code-block.meta";
// @new-meta-import
import type { ComponentMeta } from "./types";

export const components: ComponentMeta[] = [
  terminalMeta,
  glowCursorMeta,
  orbitImagesMeta,
  commandPaletteMeta,
  scrambleTextMeta,
  matrixRainMeta,
  asciiRendererMeta,
  interactiveCardMeta,
  magneticButtonMeta,
  dockMeta,
  marqueeMeta,
  countUpMeta,
  codeBlockMeta,
  // @new-meta
];

/** Site routes, used by previews so `cd` / `ls` / `sitemap` navigate inside the playground */
export function sitePages() {
  return [
    { path: "/", title: "home" },
    ...components.map((c) => ({ path: `/components/${c.slug}`, title: c.name })),
  ];
}
