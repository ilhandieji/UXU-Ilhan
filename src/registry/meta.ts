// Server-safe list of components (sidebar, routes, sources). `pnpm new` adds entries below the markers.
import { terminalMeta } from './terminal.meta';
// @new-meta-import
import type { ComponentMeta } from './types';

export const components: ComponentMeta[] = [
  terminalMeta,
  // @new-meta
];

/** Site routes, used by previews so `cd` / `ls` / `sitemap` navigate inside the playground */
export function sitePages() {
  return [{ path: '/', title: 'home' }, ...components.map((c) => ({ path: `/components/${c.slug}`, title: c.name }))];
}
