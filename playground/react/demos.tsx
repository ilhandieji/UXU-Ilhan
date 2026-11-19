// فهرست دموها؛ `pnpm new` خودکار زیر خطوط نشانه اضافه می‌کند.
import type { ReactNode } from "react";
import { Terminal } from "../../components/terminal/react/Terminal";
// @new-import

const pages = [
  { path: "/", title: "home" },
  { path: "/about", title: "about us" },
  { path: "/blog", title: "articles" },
  { path: "/contact", title: "contact" },
];

export const demos: Record<string, () => ReactNode> = {
  terminal: () => (
    <Terminal pages={pages} navigate={(path) => location.assign(`${path}${location.search}`)} />
  ),
  // @new-demo
};
