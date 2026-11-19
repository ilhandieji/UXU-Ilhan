import { defaults, resolveTokens, rootClass, type __Name__Options } from "./__name__.config";

export interface __Name__Instance {
  update(partial: __Name__Options): void;
  destroy(): void;
}

export function create__Name__(
  container: HTMLElement,
  options: __Name__Options = {},
): __Name__Instance {
  const el = document.createElement("div");
  el.className = rootClass;
  container.append(el);

  let current = { ...defaults, ...options };

  function render() {
    el.textContent = current.label;
    el.removeAttribute("style");
    for (const [name, value] of Object.entries(resolveTokens(current)))
      el.style.setProperty(name, value);
  }

  render();

  return {
    update(partial) {
      current = { ...current, ...partial };
      render();
    },
    destroy() {
      el.remove();
    },
  };
}
