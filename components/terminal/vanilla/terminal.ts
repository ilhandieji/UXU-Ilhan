import {
  complete,
  createKeySound,
  executeLine,
  playBootSequence,
  tildePath,
  type Output,
  type Tone,
} from "./terminal.commands";
import {
  classes,
  defaults,
  resolveTokens,
  type TerminalOptions,
  type TerminalSettings,
} from "./terminal.config";

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

/** Nested option objects are merged with their defaults so partial values work */
const merge = (base: TerminalSettings, partial: TerminalOptions): TerminalSettings => ({
  ...base,
  ...partial,
  sound: { ...base.sound, ...partial.sound },
  bootSequence: { ...base.bootSequence, ...partial.bootSequence },
});

const abortError = () => new DOMException("Aborted", "AbortError");

export function createTerminal(
  container: HTMLElement,
  options: TerminalOptions = {},
): TerminalInstance {
  let current = merge(defaults, options);
  const past: string[] = [];
  let cursor = 0;
  let running: AbortController | null = null;
  /** Interactive commands waiting for a typed line or a single key */
  let pendingRead: { prompt: string; resolve: (line: string) => void } | null = null;
  let pendingKey: ((key: string) => void) | null = null;
  let booting: AbortController | null = null;
  const sound = createKeySound(() => current.sound);

  const root = el("div", classes.root);
  const bar = el("div", classes.bar);
  const screen = el("div", classes.screen);
  const bootLog = el("div", "");
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
  screen.append(bootLog, intro, log, row);
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

  function renderOutput(out: Output): HTMLElement {
    if (typeof out === "string")
      return el("div", `${classes.line} ${classes.bright}`, out || "\u00a0");
    if (Array.isArray(out)) {
      const line = el("div", classes.line);
      for (const { text, tone } of out)
        line.append(el("span", tone ? toneClass[tone] : classes.bright, text));
      return line;
    }
    const block = el("div", classes.fetch);
    const info = el("div", "");
    for (const segments of out.lines) {
      const line = el("div", classes.line);
      for (const { text, tone } of segments)
        line.append(el("span", tone ? toneClass[tone] : classes.bright, text));
      info.append(line);
    }
    block.append(el("div", classes.fetchArt, out.art.join("\n")), info);
    return block;
  }

  const print = (out: Output) => log.append(renderOutput(out));

  const scrollDown = () => (screen.scrollTop = screen.scrollHeight);

  async function run(line: string) {
    const echo = el("div", classes.line, `${promptText()} `);
    echo.append(el("span", classes.bright, line));
    log.append(echo);
    if (line.trim()) past.push(line);
    cursor = past.length;
    current.onCommand?.(line);
    const controller = new AbortController();
    running = controller;
    row.className = classes.rowBusy;
    const wait = <T>(register: (resolve: (value: T) => void) => void) =>
      new Promise<T>((resolve, reject) => {
        if (controller.signal.aborted) return reject(abortError());
        controller.signal.addEventListener("abort", () => reject(abortError()), { once: true });
        register(resolve);
      });
    await executeLine(line, {
      options: current,
      history: past,
      root,
      signal: controller.signal,
      print: (out) => (print(out), scrollDown()),
      clear: () => log.replaceChildren(),
      read: (prompt = ">") =>
        wait<string>((resolve) => {
          pendingRead = { prompt, resolve };
          promptEl.textContent = prompt;
          input.placeholder = "";
          row.className = classes.row;
          input.focus();
          scrollDown();
        }),
      readKey: () => wait<string>((resolve) => (pendingKey = resolve)),
      live: (out) => {
        const holder = el("div", "");
        holder.append(renderOutput(out));
        log.append(holder);
        scrollDown();
        return (next) => {
          holder.replaceChildren(renderOutput(next));
          scrollDown();
        };
      },
    });
    running = null;
    pendingRead = null;
    pendingKey = null;
    input.placeholder = current.placeholder;
    row.className = classes.row;
    renderBar();
    promptEl.textContent = promptText();
    scrollDown();
  }

  /** Answers an interactive command's read() with the typed line */
  function submitRead() {
    if (!pendingRead) return;
    const { prompt, resolve } = pendingRead;
    const echo = el("div", classes.line, `${prompt} `);
    echo.append(el("span", classes.bright, input.value));
    log.append(echo);
    pendingRead = null;
    row.className = classes.rowBusy;
    const value = input.value;
    input.value = "";
    resolve(value);
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key.length === 1 || event.key === "Backspace") sound.play("key");
    else if (event.key === "Enter") sound.play("enter");
    if (event.ctrlKey && event.key === "c") {
      event.preventDefault();
      if (running) return running.abort();
      log.append(el("div", classes.line, `${promptText()} ${input.value}^C`));
      input.value = "";
    } else if (running && pendingKey) {
      event.preventDefault();
      const resolve = pendingKey;
      pendingKey = null;
      resolve(event.key);
    } else if (running && pendingRead) {
      if (event.key === "Enter") {
        event.preventDefault();
        submitRead();
      }
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

  /** Boot lines first, then the banner/intro; a key press or click skips it when allowed */
  async function boot() {
    const sequence = current.bootSequence;
    if (!sequence.lines.length) return;
    booting = new AbortController();
    intro.hidden = true;
    row.hidden = true;
    const skip = () => sequence.skippable && booting?.abort();
    root.addEventListener("keydown", skip);
    root.addEventListener("pointerdown", skip);
    await playBootSequence(sequence, {
      print: (out) => (bootLog.append(renderOutput(out)), scrollDown()),
      signal: booting.signal,
    });
    root.removeEventListener("keydown", skip);
    root.removeEventListener("pointerdown", skip);
    if (!booting) return; // destroyed meanwhile
    booting = null;
    if (current.bootSequence.clearAfter) bootLog.replaceChildren();
    intro.hidden = false;
    row.hidden = false;
    input.focus({ preventScroll: true });
  }

  input.addEventListener("keydown", onKeyDown);
  screen.addEventListener("click", focusInput);
  render();
  void boot();

  return {
    update(partial) {
      current = merge(current, partial);
      render();
    },
    run,
    clear: () => log.replaceChildren(),
    focus: () => input.focus(),
    destroy() {
      running?.abort();
      const bootRun = booting;
      booting = null;
      bootRun?.abort();
      sound.close();
      input.removeEventListener("keydown", onKeyDown);
      screen.removeEventListener("click", focusInput);
      root.remove();
    },
  };
}
