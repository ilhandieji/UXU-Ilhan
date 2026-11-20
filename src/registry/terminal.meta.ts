import type { ComponentMeta } from './types';

export const terminalMeta: ComponentMeta = {
  slug: 'terminal',
  name: 'Terminal',
  description: 'Client-side web terminal with 27 Linux-style commands, an ASCII banner and a matrix theme.',
  files: {
    react: ['Terminal.tsx', 'terminal.config.ts', 'terminal.commands.ts'],
    vanilla: ['terminal.ts', 'terminal.config.ts', 'terminal.commands.ts'],
  },
  configFile: 'terminal.config.ts',
  requirements: [
    'Tailwind CSS v4. If the folder you copy into is not scanned automatically, add `@source "./path/to/folder";` to your CSS.',
    'React version: react 19+, client component (works in Next.js as is).',
    'Pass `pages` and `navigate` (e.g. `router.push`) so `cd`, `ls` and `sitemap` know your routes.',
    'A non-system font (e.g. Fira Code) must be loaded in your project.',
  ],
};
