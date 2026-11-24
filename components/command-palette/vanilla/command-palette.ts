import {
  classes,
  firstEnabled,
  highlightParts,
  hintKeys,
  isMacPlatform,
  lastEnabled,
  matchesHotkey,
  normalizeItems,
  parseHotkey,
  resolveSettings,
  resolveTokens,
  runSelect,
  searchItems,
  stepIndex,
  variants,
  type CommandPaletteItem,
  type CommandPaletteOptions,
  type CommandPaletteResult,
  type CommandPaletteSettings,
} from "./command-palette.config";

export interface CommandPaletteInstance {
  update(partial: CommandPaletteOptions): void;
  open(): void;
  close(): void;
  toggle(): void;
  /** Replaces the items until `update({ items })` is called again */
  setItems(items: CommandPaletteItem[]): void;
  focus(): void;
  readonly isOpen: boolean;
  destroy(): void;
}

const SVG_NS = "http://www.w3.org/2000/svg";
let instances = 0;

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function searchIcon(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", classes.searchIcon);
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("aria-hidden", "true");
  const circle = document.createElementNS(SVG_NS, "circle");
  circle.setAttribute("cx", "11");
  circle.setAttribute("cy", "11");
  circle.setAttribute("r", "7");
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", "m20 20-3.5-3.5");
  svg.append(circle, path);
  return svg;
}

function keys(list: string[]): HTMLElement[] {
  return list.map((key) => el("kbd", classes.kbd, key));
}

function label(result: CommandPaletteResult): HTMLElement {
  const span = el("span", classes.label);
  for (const part of highlightParts(result.item.label, result.indices))
    span.append(
      part.match ? el("mark", classes.mark, part.text) : document.createTextNode(part.text),
    );
  return span;
}

/**
 * Renders the palette. `inline`: inside `container`, always open.
 * `dialog`: a modal on document.body, opened with the hotkey or open().
 */
export function createCommandPalette(
  container: HTMLElement,
  options: CommandPaletteOptions = {},
): CommandPaletteInstance {
  let current: CommandPaletteOptions = { ...options };
  let settings: CommandPaletteSettings = resolveSettings(current);
  let override: CommandPaletteItem[] | null = null;
  let isOpen = current.open ?? settings.defaultOpen;
  let query = "";
  let activeId: string | null = null;
  let flat: CommandPaletteResult[] = [];
  let active = -1;
  let previousFocus: HTMLElement | null = null;
  let lockedScroll = false;

  const baseId = `ux-command-palette-${++instances}`;
  const listId = `${baseId}-list`;
  const optionId = (index: number) => `${baseId}-o-${index}`;

  // Static skeleton, built once
  const overlay = el("div", classes.overlay);
  const panel = el("div", "");
  const inputRow = el("div", classes.inputRow);
  const input = el("input", classes.input);
  const list = el("div", classes.list);
  const footer = el("div", classes.footer);
  input.type = "text";
  input.autocomplete = "off";
  input.spellcheck = false;
  input.setAttribute("autocorrect", "off");
  input.setAttribute("role", "combobox");
  input.setAttribute("aria-controls", listId);
  input.setAttribute("aria-autocomplete", "list");
  list.id = listId;
  list.setAttribute("role", "listbox");
  footer.setAttribute("aria-hidden", "true");
  inputRow.append(searchIcon(), input);
  panel.append(inputRow, list, footer);

  const inline = () => settings.variant === "inline";
  const dialogOpen = () => !inline() && isOpen;

  function applyTokens(target: HTMLElement, other: HTMLElement) {
    other.removeAttribute("style");
    target.removeAttribute("style");
    for (const [name, value] of Object.entries(
      resolveTokens({ theme: current.theme, size: settings.size }),
    ))
      target.style.setProperty(name, value);
  }

  function renderFrame() {
    panel.className = variants[settings.variant];
    panel.setAttribute("aria-label", settings.labels.title);
    input.setAttribute("aria-label", settings.labels.title);
    list.setAttribute("aria-label", settings.labels.title);
    input.placeholder = settings.placeholder;
    if (inline()) {
      panel.removeAttribute("role");
      panel.removeAttribute("aria-modal");
      applyTokens(panel, overlay);
    } else {
      panel.setAttribute("role", "dialog");
      panel.setAttribute("aria-modal", "true");
      applyTokens(overlay, panel);
    }
    footer.replaceChildren();
    footer.hidden = !settings.footer;
    const hints: [string[], string][] = [
      [hintKeys.navigate, settings.labels.navigate],
      [hintKeys.select, settings.labels.select],
    ];
    if (!inline()) hints.push([hintKeys.close, settings.labels.close]);
    for (const [k, text] of hints) {
      const hint = el("span", classes.hint);
      hint.append(...keys(k), document.createTextNode(text));
      footer.append(hint);
    }
  }

  function renderList() {
    const sections = searchItems(override ?? settings.items, query, settings);
    flat = sections.flatMap((s) => s.results);
    list.replaceChildren();
    if (!flat.length) {
      const empty = el("div", classes.empty, settings.emptyText);
      empty.setAttribute("role", "presentation");
      list.append(empty);
    }
    let index = -1;
    for (const section of sections) {
      const group = el("div", classes.group);
      group.setAttribute("role", "group");
      if (section.group) {
        const heading = el("div", classes.heading, section.group);
        heading.id = `${baseId}-g-${list.childElementCount}`;
        heading.setAttribute("role", "presentation");
        group.setAttribute("aria-labelledby", heading.id);
        group.append(heading);
      }
      for (const result of section.results) group.append(renderOption(result, ++index));
      list.append(group);
    }
    input.setAttribute("aria-expanded", String(flat.length > 0));
    setActive(
      flat.findIndex((r) => r.item.id === activeId && !r.item.disabled),
      false,
    );
  }

  function renderOption(result: CommandPaletteResult, index: number): HTMLElement {
    const { item } = result;
    const option = el("div", classes.option);
    option.id = optionId(index);
    option.dataset.index = String(index);
    option.setAttribute("role", "option");
    if (item.disabled) option.setAttribute("aria-disabled", "true");
    if (item.icon) {
      const icon = el("span", classes.icon, item.icon);
      icon.setAttribute("aria-hidden", "true");
      option.append(icon);
    }
    option.append(label(result));
    if (item.shortcut?.length) {
      const shortcut = el("span", classes.shortcut);
      shortcut.setAttribute("aria-hidden", "true");
      shortcut.append(...keys(item.shortcut));
      option.append(shortcut);
    }
    return option;
  }

  /** -1 falls back to the first enabled option */
  function setActive(index: number, scroll: boolean) {
    active = index >= 0 ? index : firstEnabled(flat);
    activeId = active >= 0 ? flat[active].item.id : null;
    const options = list.querySelectorAll<HTMLElement>('[role="option"]');
    options.forEach((option, i) => {
      option.dataset.active = String(i === active);
      option.setAttribute("aria-selected", String(i === active));
    });
    if (active >= 0) input.setAttribute("aria-activedescendant", optionId(active));
    else input.removeAttribute("aria-activedescendant");
    if (scroll && active >= 0) options[active]?.scrollIntoView({ block: "nearest" });
  }

  function moveTo(index: number) {
    if (index >= 0) setActive(index, true);
  }

  function select(result: CommandPaletteResult | undefined) {
    if (!result || result.item.disabled) return;
    if (!inline() && settings.closeOnSelect) setOpen(false);
    runSelect(result.item, current.onSelect);
  }

  // Mounting -----------------------------------------------------------------

  function onFocusIn(event: FocusEvent) {
    if (!panel.contains(event.target as Node)) input.focus();
  }

  function mount() {
    if (inline()) {
      overlay.remove();
      container.append(panel);
      return;
    }
    if (!isOpen) {
      overlay.remove();
      return;
    }
    overlay.append(panel);
    if (!overlay.isConnected) document.body.append(overlay);
  }

  function lock(on: boolean) {
    const root = document.documentElement;
    if (on && !lockedScroll && !root.classList.contains(classes.scrollLock)) {
      root.classList.add(classes.scrollLock);
      lockedScroll = true;
    } else if (!on && lockedScroll) {
      root.classList.remove(classes.scrollLock);
      lockedScroll = false;
    }
  }

  function onDialogOpen() {
    previousFocus = document.activeElement as HTMLElement | null;
    query = "";
    input.value = "";
    activeId = null;
    renderList();
    mount();
    lock(true);
    document.addEventListener("focusin", onFocusIn);
    input.focus();
  }

  function onDialogClose() {
    const inside = panel.contains(document.activeElement);
    document.removeEventListener("focusin", onFocusIn);
    lock(false);
    overlay.remove();
    panel.remove();
    const now = document.activeElement;
    // Do not steal focus that onSelect moved somewhere on purpose
    if (previousFocus?.isConnected && (inside || !now || now === document.body))
      previousFocus.focus();
    previousFocus = null;
  }

  /** Changes state, side effects, and reports to onOpenChange */
  function setOpen(next: boolean, notify = true) {
    if (inline() || next === isOpen) return;
    isOpen = next;
    if (next) onDialogOpen();
    else onDialogClose();
    if (notify) current.onOpenChange?.(next);
  }

  // Events -------------------------------------------------------------------

  function onInput() {
    query = input.value;
    activeId = null;
    renderList();
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.isComposing) return;
    const actions: Record<string, () => void> = {
      ArrowDown: () => moveTo(stepIndex(flat, active, 1)),
      ArrowUp: () => moveTo(stepIndex(flat, active < 0 ? 0 : active, -1)),
      Home: () => moveTo(firstEnabled(flat)),
      End: () => moveTo(lastEnabled(flat)),
      Enter: () => select(flat[active]),
      Escape: () => {
        if (!inline()) return setOpen(false);
        input.value = "";
        onInput();
      },
      Tab: () => {}, // focus stays on the input (focus trap)
    };
    const run = actions[event.key];
    if (!run || (event.key === "Tab" && inline())) return;
    if (event.key === "Escape" && inline() && !query) return;
    event.preventDefault();
    event.stopPropagation();
    run();
  }

  function optionFrom(event: Event): number {
    const option = (event.target as Element).closest<HTMLElement>('[role="option"]');
    return option && list.contains(option) ? Number(option.dataset.index) : -1;
  }

  function onPointerMove(event: PointerEvent) {
    const i = optionFrom(event);
    if (i >= 0 && i !== active && !flat[i].item.disabled) setActive(i, false);
  }

  function onClick(event: MouseEvent) {
    const i = optionFrom(event);
    if (i >= 0) select(flat[i]);
  }

  const keepFocus = (event: MouseEvent) => event.preventDefault();

  function onOverlayDown(event: MouseEvent) {
    if (event.target === overlay) setOpen(false);
  }

  let parsedHotkey = settings.hotkey ? parseHotkey(settings.hotkey) : null;
  const mac = isMacPlatform();
  function onHotkey(event: KeyboardEvent) {
    if (!parsedHotkey || event.defaultPrevented || !matchesHotkey(event, parsedHotkey, mac)) return;
    event.preventDefault();
    if (inline()) input.focus();
    else setOpen(!isOpen);
  }

  input.addEventListener("input", onInput);
  input.addEventListener("keydown", onKeyDown);
  list.addEventListener("pointermove", onPointerMove);
  list.addEventListener("mousedown", keepFocus);
  list.addEventListener("click", onClick);
  overlay.addEventListener("mousedown", onOverlayDown);
  window.addEventListener("keydown", onHotkey);

  renderFrame();
  renderList();
  if (dialogOpen()) {
    isOpen = false;
    setOpen(true, false);
  } else mount();

  return {
    get isOpen() {
      return dialogOpen();
    },
    update(partial) {
      const wasInline = inline();
      const wasOpen = dialogOpen();
      if ("items" in partial) override = null;
      current = { ...current, ...partial };
      settings = resolveSettings(current);
      parsedHotkey = settings.hotkey ? parseHotkey(settings.hotkey) : null;
      renderFrame();
      renderList();
      if (wasInline !== inline()) {
        // Switching variants: tear down the old placement, keep query and items
        if (wasOpen) {
          document.removeEventListener("focusin", onFocusIn);
          lock(false);
        }
        panel.remove();
        overlay.remove();
        if (inline()) mount();
        else if (isOpen) {
          isOpen = false;
          setOpen(true, false);
        }
        return;
      }
      if (partial.open !== undefined) setOpen(partial.open, false);
    },
    open: () => setOpen(true),
    close: () => setOpen(false),
    toggle: () => setOpen(!isOpen),
    setItems(items) {
      override = normalizeItems(items);
      renderList();
    },
    focus: () => input.focus(),
    destroy() {
      if (dialogOpen()) onDialogClose();
      input.removeEventListener("input", onInput);
      input.removeEventListener("keydown", onKeyDown);
      list.removeEventListener("pointermove", onPointerMove);
      list.removeEventListener("mousedown", keepFocus);
      list.removeEventListener("click", onClick);
      overlay.removeEventListener("mousedown", onOverlayDown);
      window.removeEventListener("keydown", onHotkey);
      document.removeEventListener("focusin", onFocusIn);
      lock(false);
      panel.remove();
      overlay.remove();
    },
  };
}
