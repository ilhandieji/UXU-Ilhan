// فهرست دموها؛ `pnpm new` خودکار زیر خطوط نشانه اضافه می‌کند.
import { createTerminal } from '../../components/terminal/vanilla/terminal';
// @new-import

export const demos: Record<string, (el: HTMLElement) => void> = {
  terminal: (el) => {
    createTerminal(el, { commands: { echo: (args) => args.join(' '), whoami: () => 'guest' } });
  },
  // @new-demo
};
