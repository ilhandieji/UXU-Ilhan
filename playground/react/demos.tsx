// فهرست دموها؛ `pnpm new` خودکار زیر خطوط نشانه اضافه می‌کند.
import type { ReactNode } from 'react'
import { Terminal } from '../../components/terminal/react/Terminal'
// @new-import

export const demos: Record<string, () => ReactNode> = {
  terminal: () => <Terminal commands={{ echo: (args) => args.join(' '), whoami: () => 'guest' }} />,
  // @new-demo
}
