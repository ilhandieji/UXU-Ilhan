"use client";

// Client registry (controls, previews). `pnpm new` adds entries below the markers.
import { terminal } from "./terminal";
import { glowCursor } from "./glow-cursor";
// @new-import
import type { RegistryEntry } from "./types";

export const registry: RegistryEntry[] = [
  terminal,
  glowCursor,
  // @new-entry
];

export const getEntry = (slug: string) => registry.find((entry) => entry.slug === slug);
