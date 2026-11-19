// فهرست دموها؛ `pnpm new` خودکار زیر خطوط نشانه اضافه می‌کند.
import { createTerminal } from "../../components/terminal/vanilla/terminal";
// @new-import

const pages = [
  { path: "/", title: "home" },
  { path: "/about", title: "about us" },
  { path: "/blog", title: "articles" },
  { path: "/contact", title: "contact" },
];

export const demos: Record<string, (el: HTMLElement) => void> = {
  terminal: (el) => {
    createTerminal(el, { pages, navigate: (path) => location.assign(`${path}${location.search}`) });
  },
  // @new-demo
};
