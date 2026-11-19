import { complete, executeLine, tildePath, type Output, type Tone } from "./terminal.commands";
import { classes, defaults, resolveTokens, type TerminalOptions } from "./terminal.config";

export interface TerminalInstance {
  update(partial: TerminalOptions): void;
  /** Runs a command line as if typed */
  run(line: string): Promise<void>;
  clear(): void;
  focus(): void;
  destroy(): void;
}

const toneClass: Record<Tone, string> = {
  accent: classes.accent,
  bright: classes.bright,
  dim: classes.dim,
  error: classes.error,
};

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

export function createTerminal(
  container: HTMLElement,
  options: TerminalOptions = {},
): TerminalInstance {
  let current = { ...defaults, ...options };
  const past: string[] = [];
  let cursor = 0;
  let running: AbortController | null = null;

  const root = el("div", classes.root);
  const bar = el("div", classes.bar);
  const screen = el("div", classes.screen);
  const intro = el("div", "");
  const log = el("div", "");
  const row = el("label", classes.row);
  const promptEl = el("span", classes.prompt);
  const input = el("input", classes.input);

  root.setAttribute("role", "application");
  root.setAttribute("aria-label", "Terminal");
  log.setAttribute("role", "log");
  log.setAttribute("aria-live", "polite");
  input.spellcheck = false;
  input.autocomplete = "off";
  input.setAttribute("aria-label", "Terminal input");
  row.append(promptEl, input);
  screen.append(intro, log, row);
  root.append(bar, screen);
  container.append(root);

  const cwd = () => current.cwd || tildePath(location.pathname);
  const userName = () => current.currentUser || current.user;
  const promptText = () => `${userName()}@${current.host}:${cwd()}$`;

  function renderIntro() {
    intro.replaceChildren();
    if (current.banner) intro.append(el("div", classes.banner, current.banner.join("\n")));
    if (current.subtitle) intro.append(el("div", classes.dim, current.subtitle));
    intro.append(el("div", classes.gap));
    for (const { label, value } of current.boot) {
      const line = el("div", classes.dim, `${label} : `);
      line.append(el("span", "", value));
      intro.append(line);
    }
    intro.append(el("div", classes.gap));
    for (const { name, description } of current.help) {
      const item = el("div", classes.helpRow);
      item.append(el("span", classes.helpName, name), el("span", classes.dim, description));
      intro.append(item);
    }
    intro.append(el("div", classes.gap));
  }

  function renderBar() {
    bar.replaceChildren();
    const dots = el("div", classes.dots);
    for (const dotClass of classes.dot) dots.append(el("span", dotClass));
    bar.append(
      dots,
      el("div", classes.title, current.title || `${userName()}@${current.host}:${cwd()}`),
    );
  }

  function render() {
    root.removeAttribute("style");
    const { theme, size, variant, glow } = current;
    for (const [name, value] of Object.entries(resolveTokens({ theme, size, variant, glow })))
      root.style.setProperty(name, value);
    if (variant === "minimal") bar.remove();
    else root.prepend(bar);
    renderBar();
    renderIntro();
    promptEl.textContent = promptText();
    input.placeholder = current.placeholder;
  }

  function print(out: Output) {
    if (typeof out === "string")
      return log.append(el("div", `${classes.line} ${classes.bright}`, out || "\u00a0"));
    if (Array.isArray(out)) {
      const line = el("div", classes.line);
      for (const { text, tone } of out)
        line.append(el("span", tone ? toneClass[tone] : classes.bright, text));
      return log.append(line);
    }
    {
      const block = el("div", classes.fetch);
      const info = el("div", "");
      for (const segments of out.lines) {
        const line = el("div", classes.line);
        for (const { text, tone } of segments)
          line.append(el("span", tone ? toneClass[tone] : classes.bright, text));
        info.append(line);
      }
      block.append(el("div", classes.fetchArt, out.art.join("\n")), info);
      log.append(block);
    }
  }

  const scrollDown = () => (screen.scrollTop = screen.scrollHeight);

  async function run(line: string) {
    const echo = el("div", classes.line, `${promptText()} `);
    echo.append(el("span", classes.bright, line));
    log.append(echo);
    if (line.trim()) past.push(line);
    cursor = past.length;
    current.onCommand?.(line);
    running = new AbortController();
    row.className = classes.rowBusy;
    await executeLine(line, {
      options: current,
      history: past,
      root,
      signal: running.signal,
      print: (out) => (print(out), scrollDown()),
      clear: () => log.replaceChildren(),
    });
    running = null;
    row.className = classes.row;
    renderBar();
    promptEl.textContent = promptText();
    scrollDown();
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.ctrlKey && event.key === "c") {
      event.preventDefault();
      if (running) return running.abort();
      log.append(el("div", classes.line, `${promptText()} ${input.value}^C`));
      input.value = "";
    } else if (running) {
      event.preventDefault();
    } else if (event.ctrlKey && event.key === "l") {
      event.preventDefault();
      log.replaceChildren();
    } else if (event.key === "Enter") {
      const line = input.value;
      input.value = "";
      void run(line);
    } else if (event.key === "Tab") {
      event.preventDefault();
      input.value = complete(input.value, current);
    } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      cursor = Math.min(past.length, Math.max(0, cursor + (event.key === "ArrowUp" ? -1 : 1)));
      input.value = past[cursor] ?? "";
    }
  }

  const focusInput = () => {
    if (!getSelection()?.toString()) input.focus();
  };

  input.addEventListener("keydown", onKeyDown);
  screen.addEventListener("click", focusInput);
  render();

  return {
    update(partial) {
      current = { ...current, ...partial };
      render();
    },
    run,
    clear: () => log.replaceChildren(),
    focus: () => input.focus(),
    destroy() {
      running?.abort();
      input.removeEventListener("keydown", onKeyDown);
      screen.removeEventListener("click", focusInput);
      root.remove();
    },
  };
}
