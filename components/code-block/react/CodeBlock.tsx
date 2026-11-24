"use client";

import {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type Ref,
} from "react";
import {
  classes,
  COPIED_MS,
  copyText,
  icons,
  resolveSettings,
  resolveTokens,
  tokenClasses,
  type CodeBlockOptions,
} from "./code-block.config";
import { splitLines, tokenize } from "./code-block.highlight";

export interface CodeBlockHandle {
  /** Copies the code; resolves to false when the clipboard is unavailable */
  copy(): Promise<boolean>;
}

export type CodeBlockProps = CodeBlockOptions & {
  className?: string;
  style?: CSSProperties;
  ref?: Ref<CodeBlockHandle>;
};

function Icon({ paths }: { paths: string[] }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={classes.copyIcon}
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

export function CodeBlock({ className, style, ref, ...options }: CodeBlockProps) {
  const s = resolveSettings(options);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const latest = useRef(s);
  latest.current = s;

  // A trailing newline does not produce an extra empty line
  const code = s.code.endsWith("\n") ? s.code.slice(0, -1) : s.code;
  const lines = useMemo(
    () => (s.highlight ? [] : splitLines(tokenize(code, s.language))),
    [code, s.language, s.highlight],
  );
  const html = useMemo(
    () => (s.highlight ? s.highlight(code, s.language) : ""),
    [code, s.language, s.highlight],
  );

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy(): Promise<boolean> {
    const current = latest.current;
    const ok = await copyText(current.code);
    if (!ok) return false;
    current.onCopy?.(current.code);
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPIED_MS);
    return true;
  }

  useImperativeHandle(ref, () => ({ copy }), []);

  const tokens = resolveTokens(s, lines.length || code.split("\n").length) as CSSProperties;
  const label = copied ? s.copiedLabel : s.copyLabel;
  const copyButton = s.copy ? (
    <button
      type="button"
      className={s.variant === "minimal" ? classes.copyFloating : classes.copyButton}
      aria-label={label}
      data-copied={copied}
      onClick={() => void copy()}
    >
      <Icon paths={copied ? icons.check : icons.copy} />
      <span aria-hidden="true">{label}</span>
    </button>
  ) : null;

  const showDots = s.variant === "window" || s.windowControls;
  const hasHeader =
    s.variant === "window" ||
    (s.variant === "default" && (!!s.title || s.showLanguage || s.copy || s.windowControls));

  return (
    <div
      className={className ? `${classes.root} ${className}` : classes.root}
      style={{ ...tokens, ...style }}
    >
      {hasHeader ? (
        <div className={classes.header}>
          {showDots ? (
            <span className={classes.dots} aria-hidden="true">
              <span className={classes.dotClose} />
              <span className={classes.dotMinimize} />
              <span className={classes.dotMaximize} />
            </span>
          ) : null}
          <span className={s.variant === "window" ? classes.titleCentered : classes.title}>
            {s.title}
          </span>
          <span className={classes.actions}>
            {s.showLanguage ? <span className={classes.language}>{s.language}</span> : null}
            {copyButton}
          </span>
        </div>
      ) : (
        copyButton
      )}
      <span className={classes.srOnly} aria-live="polite">
        {copied ? s.copiedLabel : ""}
      </span>
      <pre
        className={classes.pre}
        tabIndex={0}
        role="region"
        aria-label={s.ariaLabel || s.title || "Code"}
      >
        {s.highlight ? (
          <code
            className={s.wrap ? classes.codeHtmlWrap : classes.codeHtml}
            // Trusted HTML from the user's own highlighter (see `highlight` option)
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <code className={s.wrap ? classes.codeWrap : classes.code}>
            {lines.map((line, index) => {
              const number = s.startLine + index;
              return (
                <span
                  key={index}
                  className={s.highlightLines.has(number) ? classes.lineHighlighted : classes.line}
                >
                  {s.showLineNumbers ? (
                    <span className={classes.lineNumber} aria-hidden="true">
                      {number}
                    </span>
                  ) : null}
                  <span className={s.wrap ? classes.lineContentWrap : classes.lineContent}>
                    {line.length
                      ? line.map((token, i) =>
                          token.kind ? (
                            <span key={i} className={tokenClasses[token.kind]}>
                              {token.text}
                            </span>
                          ) : (
                            token.text
                          ),
                        )
                      : " "}
                  </span>
                </span>
              );
            })}
          </code>
        )}
      </pre>
    </div>
  );
}

export default CodeBlock;
