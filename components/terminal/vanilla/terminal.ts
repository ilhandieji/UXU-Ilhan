import { classes, defaults, resolveTokens, type TerminalOptions } from './terminal.config';

export interface TerminalInstance {
  update(partial: TerminalOptions): void;
  clear(): void;
  focus(): void;
  destroy(): void;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function createTerminal(container: HTMLElement, options: TerminalOptions = {}): TerminalInstance {
  let current = { ...defaults, ...options };
  const past: string[] = [];
  let cursor = 0;

  const root = el('div', classes.root);
  const bar = el('div', classes.bar);
  const screen = el('div', classes.screen);
  const intro = el('div', '');
  const log = el('div', '');
  const row = el('label', classes.row);
  const promptEl = el('span', classes.prompt);
  const input = el('input', classes.input);

  root.setAttribute('role', 'application');
  root.setAttribute('aria-label', 'Terminal');
  log.setAttribute('role', 'log');
  log.setAttribute('aria-live', 'polite');
  input.spellcheck = false;
  input.autocomplete = 'off';
  input.setAttribute('aria-label', 'Terminal input');
  row.append(promptEl, input);
  screen.append(intro, log, row);
  root.append(bar, screen);
  container.append(root);

  const promptText = () => `${current.user}@${current.host}:${current.cwd}$`;

  function renderIntro() {
    intro.replaceChildren();
    if (current.banner) intro.append(el('div', classes.banner, current.banner));
    if (current.subtitle) intro.append(el('div', classes.dim, current.subtitle));
    intro.append(el('div', classes.gap));
    for (const { label, value } of current.boot) {
      const line = el('div', classes.dim, `${label} : `);
      line.append(el('span', '', value));
      intro.append(line);
    }
    intro.append(el('div', classes.gap));
    for (const { name, description } of current.help) {
      const item = el('div', classes.helpRow);
      item.append(el('span', classes.helpName, name), el('span', classes.dim, description));
      intro.append(item);
    }
    intro.append(el('div', classes.gap));
  }

  function renderBar() {
    bar.replaceChildren();
    const dots = el('div', classes.dots);
    for (const dotClass of classes.dot) dots.append(el('span', dotClass));
    bar.append(dots, el('div', classes.title, current.title || `${current.user}@${current.host}:${current.cwd}`));
  }

  function render() {
    root.removeAttribute('style');
    const { theme, size, variant, glow } = current;
    for (const [name, value] of Object.entries(resolveTokens({ theme, size, variant, glow }))) root.style.setProperty(name, value);
    if (variant === 'minimal') bar.remove();
    else root.prepend(bar);
    renderBar();
    renderIntro();
    promptEl.textContent = promptText();
    input.placeholder = current.placeholder;
  }

  function print(text: string, className = classes.line) {
    log.append(el('div', `${classes.line} ${className}`, text));
  }

  function run(line: string) {
    const [name = '', ...args] = line.trim().split(/\s+/);
    const echo = el('div', classes.line, `${promptText()} `);
    echo.append(el('span', classes.bright, line));
    log.append(echo);
    current.onCommand?.(line);
    if (!name) return;
    if (name === 'clear') return log.replaceChildren();
    if (name === 'help') {
      for (const { name: cmd, description } of current.help) print(`${cmd.padEnd(12)}${description}`, classes.bright);
      return;
    }
    const command = current.commands[name];
    if (!command) return print(`${name}: command not found`, classes.error);
    try {
      const out = command(args);
      if (out) for (const text of Array.isArray(out) ? out : [out]) print(text, classes.bright);
    } catch (error) {
      print(`${name}: ${error instanceof Error ? error.message : 'error'}`, classes.error);
    }
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      const line = input.value;
      if (line.trim()) past.push(line);
      cursor = past.length;
      input.value = '';
      run(line);
      screen.scrollTop = screen.scrollHeight;
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      cursor = Math.min(past.length, Math.max(0, cursor + (event.key === 'ArrowUp' ? -1 : 1)));
      input.value = past[cursor] ?? '';
    }
  }

  const focusInput = () => {
    if (!getSelection()?.toString()) input.focus();
  };

  input.addEventListener('keydown', onKeyDown);
  screen.addEventListener('click', focusInput);
  render();

  return {
    update(partial) {
      current = { ...current, ...partial };
      render();
    },
    clear: () => log.replaceChildren(),
    focus: () => input.focus(),
    destroy() {
      input.removeEventListener('keydown', onKeyDown);
      screen.removeEventListener('click', focusInput);
      root.remove();
    },
  };
}
