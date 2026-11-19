'use client'

import { useImperativeHandle, useRef, useState, type CSSProperties, type KeyboardEvent, type Ref } from 'react'
import { classes, defaults, resolveTokens, type TerminalOptions } from './terminal.config'

export type TerminalProps = TerminalOptions & { className?: string; ref?: Ref<TerminalHandle> }

export interface TerminalHandle {
  clear(): void
  focus(): void
}

type Line = { kind: 'cmd' | 'out' | 'err'; text: string; prompt?: string }

export function Terminal({ className, ref, onCommand, commands = defaults.commands, ...rest }: TerminalProps) {
  const o = { ...defaults, ...rest }
  const [lines, setLines] = useState<Line[]>([])
  const [value, setValue] = useState('')
  const past = useRef<string[]>([])
  const cursor = useRef(0)
  const input = useRef<HTMLInputElement>(null)
  const screen = useRef<HTMLDivElement>(null)

  const promptText = `${o.user}@${o.host}:${o.cwd}$`
  const style = resolveTokens({ theme: o.theme, size: o.size, variant: o.variant, glow: o.glow }) as CSSProperties

  useImperativeHandle(ref, () => ({ clear: () => setLines([]), focus: () => input.current?.focus() }))

  function run(line: string) {
    const [name = '', ...args] = line.trim().split(/\s+/)
    const next: Line[] = [{ kind: 'cmd', text: line, prompt: promptText }]
    onCommand?.(line)
    if (name === 'clear') return setLines([])
    if (name === 'help') {
      for (const { name: cmd, description } of o.help) next.push({ kind: 'out', text: `${cmd.padEnd(12)}${description}` })
    } else if (name) {
      const command = commands[name]
      if (!command) next.push({ kind: 'err', text: `${name}: command not found` })
      else {
        try {
          const out = command(args)
          if (out) for (const text of Array.isArray(out) ? out : [out]) next.push({ kind: 'out', text })
        } catch (error) {
          next.push({ kind: 'err', text: `${name}: ${error instanceof Error ? error.message : 'error'}` })
        }
      }
    }
    setLines((prev) => [...prev, ...next])
    requestAnimationFrame(() => screen.current?.scrollTo({ top: screen.current.scrollHeight }))
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      if (value.trim()) past.current.push(value)
      cursor.current = past.current.length
      setValue('')
      run(value)
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault()
      cursor.current = Math.min(past.current.length, Math.max(0, cursor.current + (event.key === 'ArrowUp' ? -1 : 1)))
      setValue(past.current[cursor.current] ?? '')
    }
  }

  return (
    <div className={className ? `${classes.root} ${className}` : classes.root} style={style} role="application" aria-label="Terminal">
      {o.variant !== 'minimal' && (
        <div className={classes.bar}>
          <div className={classes.dots}>
            {classes.dot.map((dotClass) => (
              <span key={dotClass} className={dotClass} />
            ))}
          </div>
          <div className={classes.title}>{o.title || `${o.user}@${o.host}:${o.cwd}`}</div>
        </div>
      )}
      <div ref={screen} className={classes.screen} onClick={() => !getSelection()?.toString() && input.current?.focus()}>
        {o.banner && <div className={classes.banner}>{o.banner}</div>}
        {o.subtitle && <div className={classes.dim}>{o.subtitle}</div>}
        <div className={classes.gap} />
        {o.boot.map(({ label, value: status }) => (
          <div key={label} className={classes.dim}>
            {label} : <span>{status}</span>
          </div>
        ))}
        <div className={classes.gap} />
        {o.help.map(({ name, description }) => (
          <div key={name} className={classes.helpRow}>
            <span className={classes.helpName}>{name}</span>
            <span className={classes.dim}>{description}</span>
          </div>
        ))}
        <div className={classes.gap} />
        <div role="log" aria-live="polite">
          {lines.map((line, index) => (
            <div key={index} className={`${classes.line} ${line.kind === 'err' ? classes.error : line.kind === 'out' ? classes.bright : ''}`}>
              {line.kind === 'cmd' ? (
                <>
                  {line.prompt} <span className={classes.bright}>{line.text}</span>
                </>
              ) : (
                line.text
              )}
            </div>
          ))}
        </div>
        <label className={classes.row}>
          <span className={classes.prompt}>{promptText}</span>
          <input
            ref={input}
            className={classes.input}
            value={value}
            placeholder={o.placeholder}
            spellCheck={false}
            autoComplete="off"
            aria-label="Terminal input"
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={onKeyDown}
          />
        </label>
      </div>
    </div>
  )
}
