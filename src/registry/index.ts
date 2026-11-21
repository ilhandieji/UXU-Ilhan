"use client";

// Client registry (controls, previews). `pnpm new` adds entries below the markers.
import { terminal } from "./terminal";
import { glowCursor } from "./glow-cursor";
import { orbitImages } from "./orbit-images";
// @new-import
import type { RegistryEntry } from "./types";

export const registry: RegistryEntry[] = [
  terminal,
  glowCursor,
  orbitImages,
  // @new-entry
];

export const getEntry = (slug: string) => registry.find((entry) => entry.slug === slug);
