import {
  classes,
  COPIED_MS,
  copyText,
  icons,
  resolveSettings,
  resolveTokens,
  tokenClasses,
  type CodeBlockOptions,
  type CodeBlockSettings,
} from "./code-block.config";
import { splitLines, tokenize, type Token } from "./code-block.highlight";

export interface CodeBlockInstance {
  update(partial: CodeBlockOptions): void;
  /** Copies the code; resolves to false when the clipboard is unavailable */
  copy(): Promise<boolean>;
  /** The root element */
  readonly element: HTMLElement;
  destroy(): void;
}

const SVG_NS = "http://www.w3.org/2000/svg";

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className = "") {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

function icon(paths: string[]): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, "svg");
  const attrs: Record<string, string> = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "2",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    "aria-hidden": "true",
    class: classes.copyIcon,
  };
  for (const [name, value] of Object.entries(attrs)) svg.setAttribute(name, value);
  for (const d of paths) {
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", d);
    svg.append(path);
  }
  return svg;
}

const trimTrailingNewline = (code: string) => (code.endsWith("\n") ? code.slice(0, -1) : code);

function renderLine(line: Token[], number: number, s: CodeBlockSettings): HTMLElement {
  const row = el("span", s.highlightLines.has(number) ? classes.lineHighlighted : classes.line);
  if (s.showLineNumbers) {
    const gutter = el("span", classes.lineNumber);
    gutter.setAttribute("aria-hidden", "true");
    gutter.textContent = String(number);
    row.append(gutter);
  }
  const content = el("span", s.wrap ? classes.lineContentWrap : classes.lineContent);
  if (!line.length) content.textContent = " ";
  for (const token of line) {
    if (!token.kind) {
      content.append(token.text);
      continue;
    }
    const span = el("span", tokenClasses[token.kind]);
    span.textContent = token.text;
    content.append(span);
  }
  row.append(content);
  return row;
}

export function createCodeBlock(
  container: HTMLElement,
  options: CodeBlockOptions = {},
): CodeBlockInstance {
  let current: CodeBlockOptions = { ...options };
  let s = resolveSettings(current);
  let copied = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let cache: { code: string; language: string; lines: Token[][] } | null = null;

  const root = el("div", classes.root);
  const header = el("div", classes.header);
  const dots = el("span", classes.dots);
  dots.setAttribute("aria-hidden", "true");
  dots.append(
    el("span", classes.dotClose),
    el("span", classes.dotMinimize),
    el("span", classes.dotMaximize),
  );
  const title = el("span");
  const actions = el("span", classes.actions);
  const language = el("span", classes.language);
  const button = el("button");
  button.type = "button";
  const buttonText = el("span");
  buttonText.setAttribute("aria-hidden", "true");
  const live = el("span", classes.srOnly);
  live.setAttribute("aria-live", "polite");
  const pre = el("pre", classes.pre);
  pre.tabIndex = 0;
  pre.setAttribute("role", "region");
  const codeEl = el("code");
  pre.append(codeEl);
  root.append(live, pre);
  container.append(root);

  async function copy(): Promise<boolean> {
    const ok = await copyText(s.code);
    if (!ok) return false;
    s.onCopy?.(s.code);
    copied = true;
    renderCopy();
    clearTimeout(timer);
    timer = setTimeout(() => {
      copied = false;
      renderCopy();
    }, COPIED_MS);
    return true;
  }
  const onClick = () => void copy();
  button.addEventListener("click", onClick);

  function renderCopy() {
    const label = copied ? s.copiedLabel : s.copyLabel;
    button.className = s.variant === "minimal" ? classes.copyFloating : classes.copyButton;
    button.setAttribute("aria-label", label);
    button.dataset.copied = String(copied);
    buttonText.textContent = label;
    button.replaceChildren(icon(copied ? icons.check : icons.copy), buttonText);
    live.textContent = copied ? s.copiedLabel : "";
  }

  function renderHeader() {
    const hasHeader =
      s.variant === "window" ||
      (s.variant === "default" && (!!s.title || s.showLanguage || s.copy || s.windowControls));
    header.remove();
    button.remove();
    if (hasHeader) {
      title.className = s.variant === "window" ? classes.titleCentered : classes.title;
      title.textContent = s.title;
      language.textContent = s.language;
      actions.replaceChildren(...(s.showLanguage ? [language] : []), ...(s.copy ? [button] : []));
      const showDots = s.variant === "window" || s.windowControls;
      header.replaceChildren(...(showDots ? [dots] : []), title, actions);
      root.prepend(header);
    } else if (s.copy) root.prepend(button);
  }

  /** Returns the number of rendered lines */
  function renderCode(): number {
    const code = trimTrailingNewline(s.code);
    pre.setAttribute("aria-label", s.ariaLabel || s.title || "Code");
    if (s.highlight) {
      codeEl.className = s.wrap ? classes.codeHtmlWrap : classes.codeHtml;
      // Trusted HTML from the user's own highlighter (see `highlight` option)
      codeEl.innerHTML = s.highlight(code, s.language);
      return code.split("\n").length;
    }
    if (!cache || cache.code !== code || cache.language !== s.language)
      cache = { code, language: s.language, lines: splitLines(tokenize(code, s.language)) };
    codeEl.className = s.wrap ? classes.codeWrap : classes.code;
    codeEl.replaceChildren(...cache.lines.map((line, i) => renderLine(line, s.startLine + i, s)));
    return cache.lines.length;
  }

  function render() {
    renderHeader();
    renderCopy();
    const lineCount = renderCode();
    root.removeAttribute("style");
    for (const [name, value] of Object.entries(resolveTokens(s, lineCount)))
      root.style.setProperty(name, value);
  }

  render();

  return {
    element: root,
    update(partial) {
      current = { ...current, ...partial };
      s = resolveSettings(current);
      render();
    },
    copy,
    destroy() {
      clearTimeout(timer);
      button.removeEventListener("click", onClick);
      root.remove();
    },
  };
}
