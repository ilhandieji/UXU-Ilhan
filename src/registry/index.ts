"use client";

// Client registry (controls, previews). `pnpm new` adds entries below the markers.
import { terminal } from "./terminal";
import { glowCursor } from "./glow-cursor";
import { orbitImages } from "./orbit-images";
import { commandPalette } from "./command-palette";
import { scrambleText } from "./scramble-text";
import { matrixRain } from "./matrix-rain";
import { asciiRenderer } from "./ascii-renderer";
import { interactiveCard } from "./interactive-card";
import { magneticButton } from "./magnetic-button";
import { dock } from "./dock";
import { marquee } from "./marquee";
import { countUp } from "./count-up";
import { codeBlock } from "./code-block";
// @new-import
import type { RegistryEntry } from "./types";

export const registry: RegistryEntry[] = [
  terminal,
  glowCursor,
  orbitImages,
  commandPalette,
  scrambleText,
  matrixRain,
  asciiRenderer,
  interactiveCard,
  magneticButton,
  dock,
  marquee,
  countUp,
  codeBlock,
  // @new-entry
];

export const getEntry = (slug: string) => registry.find((entry) => entry.slug === slug);
