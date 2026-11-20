'use client';

// Client registry (controls, previews). `pnpm new` adds entries below the markers.
import { terminal } from './terminal';
// @new-import
import type { RegistryEntry } from './types';

export const registry: RegistryEntry[] = [
  terminal,
  // @new-entry
];

export const getEntry = (slug: string) => registry.find((entry) => entry.slug === slug);
