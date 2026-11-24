"use client";

import {
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type Ref,
} from "react";
import { createPortal } from "react-dom";
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
} from "./command-palette.config";

export interface CommandPaletteHandle {
  open(): void;
  close(): void;
  toggle(): void;
  /** Replaces the items until the `items` prop changes again */
  setItems(items: CommandPaletteItem[]): void;
  focus(): void;
}

export type CommandPaletteProps = CommandPaletteOptions & {
  className?: string;
  ref?: Ref<CommandPaletteHandle>;
};

function SearchIcon() {
  return (
    <svg
      className={classes.searchIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function Keys({ keys }: { keys: string[] }) {
  return keys.map((key, i) => (
    <kbd key={i} className={classes.kbd}>
      {key}
    </kbd>
  ));
}

function Label({ result }: { result: CommandPaletteResult }) {
  return (
    <span className={classes.label}>
      {highlightParts(result.item.label, result.indices).map((part, i) =>
        part.match ? (
          <mark key={i} className={classes.mark}>
            {part.text}
          </mark>
        ) : (
          part.text
        ),
      )}
    </span>
  );
}

export function CommandPalette({ className, ref, ...options }: CommandPaletteProps) {
  const settings = resolveSettings(options);
  const { variant, labels } = settings;
  const inline = variant === "inline";
  const baseId = useId();
  const listId = `${baseId}-list`;

  const [override, setOverride] = useState<CommandPaletteItem[] | null>(null);
  const [internalOpen, setInternalOpen] = useState(settings.defaultOpen);
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollPending = useRef(false);

  const controlled = options.open !== undefined;
  const dialogOpen = !inline && (controlled ? Boolean(options.open) : internalOpen);
  const visible = inline || dialogOpen;

  // Imperative items win until the prop itself changes
  useEffect(() => setOverride(null), [options.items]);
  useEffect(() => setMounted(true), []);

  const items = override ?? settings.items;
  const { maxResults, showGroups } = settings;
  const sections = useMemo(
    () => searchItems(items, query, { maxResults, showGroups }),
    [items, query, maxResults, showGroups],
  );
  const flat = useMemo(() => sections.flatMap((s) => s.results), [sections]);
  const found = flat.findIndex((r) => r.item.id === activeId && !r.item.disabled);
  const active = found >= 0 ? found : firstEnabled(flat);
  const optionId = (index: number) => `${baseId}-o-${index}`;

  // Latest values for listeners registered once
  const latest = useRef({ dialogOpen, inline, settings, options, controlled });
  latest.current = { dialogOpen, inline, settings, options, controlled };

  const setOpen = (next: boolean) => {
    const l = latest.current;
    if (l.inline || next === l.dialogOpen) return;
    if (!l.controlled) setInternalOpen(next);
    l.options.onOpenChange?.(next);
  };
  const setOpenRef = useRef(setOpen);
  setOpenRef.current = setOpen;

  useImperativeHandle(
    ref,
    () => ({
      open: () => setOpenRef.current(true),
      close: () => setOpenRef.current(false),
      toggle: () => setOpenRef.current(!latest.current.dialogOpen),
      setItems: (next) => setOverride(normalizeItems(next)),
      focus: () => inputRef.current?.focus(),
    }),
    [],
  );

  // Global hotkey: toggles the dialog, focuses the inline palette
  const hotkey = settings.hotkey;
  useEffect(() => {
    const parsed = hotkey ? parseHotkey(hotkey) : null;
    if (!parsed) return;
    const mac = isMacPlatform();
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || !matchesHotkey(event, parsed, mac)) return;
      event.preventDefault();
      if (latest.current.inline) inputRef.current?.focus();
      else setOpenRef.current(!latest.current.dialogOpen);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hotkey]);

  // Dialog lifecycle: reset, focus, scroll lock, focus trap, focus restore
  useEffect(() => {
    if (!dialogOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    setQuery("");
    setActiveId(null);
    const root = document.documentElement;
    const locked = !root.classList.contains(classes.scrollLock);
    if (locked) root.classList.add(classes.scrollLock);
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    const onFocusIn = (event: FocusEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node))
        inputRef.current?.focus();
    };
    document.addEventListener("focusin", onFocusIn);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("focusin", onFocusIn);
      if (locked) root.classList.remove(classes.scrollLock);
      // Do not steal focus that onSelect moved somewhere on purpose
      const now = document.activeElement;
      if (
        previous?.isConnected &&
        (!now || now === document.body || panelRef.current?.contains(now))
      )
        previous.focus();
    };
  }, [dialogOpen]);

  useEffect(() => {
    if (!scrollPending.current) return;
    scrollPending.current = false;
    document.getElementById(optionId(active))?.scrollIntoView({ block: "nearest" });
  });

  const moveTo = (index: number) => {
    if (index < 0) return;
    scrollPending.current = true;
    setActiveId(flat[index].item.id);
  };

  const select = (result: CommandPaletteResult | undefined) => {
    if (!result || result.item.disabled) return;
    if (!inline && settings.closeOnSelect) setOpen(false);
    runSelect(result.item, options.onSelect);
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;
    const keys: Record<string, () => void> = {
      ArrowDown: () => moveTo(stepIndex(flat, active, 1)),
      ArrowUp: () => moveTo(stepIndex(flat, active < 0 ? 0 : active, -1)),
      Home: () => moveTo(firstEnabled(flat)),
      End: () => moveTo(lastEnabled(flat)),
      Enter: () => select(flat[active]),
      Escape: () => (inline ? setQuery("") : setOpen(false)),
      Tab: () => {}, // focus stays on the input (focus trap)
    };
    const run = keys[event.key];
    if (!run || (event.key === "Tab" && inline)) return;
    if (event.key === "Escape" && inline && !query) return;
    event.preventDefault();
    event.stopPropagation();
    run();
  };

  if (!visible) return null;

  const tokens = resolveTokens({ theme: options.theme, size: settings.size }) as CSSProperties;
  const panelClass = className ? `${variants[variant]} ${className}` : variants[variant];
  let index = -1;

  const panel = (
    <div
      ref={panelRef}
      className={panelClass}
      style={inline ? tokens : undefined}
      role={inline ? undefined : "dialog"}
      aria-modal={inline ? undefined : true}
      aria-label={labels.title}
    >
      <div className={classes.inputRow}>
        <SearchIcon />
        <input
          ref={inputRef}
          className={classes.input}
          type="text"
          role="combobox"
          aria-expanded={flat.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? optionId(active) : undefined}
          aria-label={labels.title}
          placeholder={settings.placeholder}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveId(null);
          }}
          onKeyDown={onKeyDown}
        />
      </div>
      <div id={listId} className={classes.list} role="listbox" aria-label={labels.title}>
        {flat.length === 0 ? (
          <div className={classes.empty} role="presentation">
            {settings.emptyText}
          </div>
        ) : (
          sections.map((section) => {
            const headingId = `${baseId}-g-${section.group}`;
            return (
              <div
                key={section.group}
                className={classes.group}
                role="group"
                aria-labelledby={section.group ? headingId : undefined}
              >
                {section.group ? (
                  <div id={headingId} className={classes.heading} role="presentation">
                    {section.group}
                  </div>
                ) : null}
                {section.results.map((result) => {
                  index++;
                  const i = index;
                  const { item } = result;
                  return (
                    <div
                      key={item.id}
                      id={optionId(i)}
                      className={classes.option}
                      role="option"
                      aria-selected={i === active}
                      aria-disabled={item.disabled || undefined}
                      data-active={i === active}
                      onPointerMove={() => {
                        if (!item.disabled && i !== active) setActiveId(item.id);
                      }}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => select(result)}
                    >
                      {item.icon ? (
                        <span className={classes.icon} aria-hidden="true">
                          {item.icon}
                        </span>
                      ) : null}
                      <Label result={result} />
                      {item.shortcut?.length ? (
                        <span className={classes.shortcut} aria-hidden="true">
                          <Keys keys={item.shortcut} />
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
      {settings.footer ? (
        <div className={classes.footer} aria-hidden="true">
          <span className={classes.hint}>
            <Keys keys={hintKeys.navigate} />
            {labels.navigate}
          </span>
          <span className={classes.hint}>
            <Keys keys={hintKeys.select} />
            {labels.select}
          </span>
          {inline ? null : (
            <span className={classes.hint}>
              <Keys keys={hintKeys.close} />
              {labels.close}
            </span>
          )}
        </div>
      ) : null}
    </div>
  );

  if (inline) return panel;
  if (!mounted) return null;
  return createPortal(
    <div
      className={classes.overlay}
      style={tokens}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setOpen(false);
      }}
    >
      {panel}
    </div>,
    document.body,
  );
}

export default CommandPalette;
