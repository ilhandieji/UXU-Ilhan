// Patches literal values inside a component's `<name>.config.ts` source text,
// so the copied file keeps its comments/formatting and only the chosen values change.
// Paths: ['defaults'] = `const defaults = {…}`, ['themes', 'matrix'] = key `matrix` inside `const themes = {…}`.

type Range = { open: number; close: number };
type Prop = { valueStart: number; valueEnd: number };
export type Literal = string | number | boolean;

function skipString(src: string, i: number): number {
  const quote = src[i];
  for (i++; i < src.length && src[i] !== quote; i++) if (src[i] === '\\') i++;
  return i;
}

/** Index of the bracket that closes the one at `open` (strings and line comments skipped) */
function matchBracket(src: string, open: number): number {
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    const c = src[i];
    if (c === '"' || c === "'" || c === '`') i = skipString(src, i);
    else if (c === '/' && src[i + 1] === '/') i = src.indexOf('\n', i);
    else if ('{[('.includes(c)) depth++;
    else if ('}])'.includes(c) && --depth === 0) return i;
    if (i < 0) break;
  }
  return -1;
}

/** Finds `key: value` at the top level of the object in `range` */
function findProp(src: string, range: Range, key: string): Prop | null {
  let depth = 0;
  let expectKey = true;
  for (let i = range.open + 1; i < range.close; i++) {
    const c = src[i];
    if (/\s/.test(c)) continue;
    if (c === '/' && src[i + 1] === '/') {
      i = src.indexOf('\n', i);
      continue;
    }
    if (depth === 0 && expectKey) {
      expectKey = false;
      if (c === '.') continue; // spread `...common`
      let name: string;
      let end: number;
      if (c === '"' || c === "'") {
        end = skipString(src, i);
        name = src.slice(i + 1, end);
        end++;
      } else {
        const m = /^[A-Za-z_$][\w$]*/.exec(src.slice(i));
        if (!m) continue;
        name = m[0];
        end = i + name.length;
      }
      const colon = /^\s*:/.exec(src.slice(end));
      if (colon && name === key) {
        let valueStart = end + colon[0].length;
        while (/\s/.test(src[valueStart])) valueStart++;
        return { valueStart, valueEnd: valueEnd(src, valueStart, range.close) };
      }
      i = end - 1;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') i = skipString(src, i);
    else if ('{[('.includes(c)) depth++;
    else if ('}])'.includes(c)) depth--;
    else if (c === ',' && depth === 0) expectKey = true;
  }
  return null;
}

function valueEnd(src: string, start: number, limit: number): number {
  let depth = 0;
  let i = start;
  for (; i < limit; i++) {
    const c = src[i];
    if (c === '"' || c === "'" || c === '`') i = skipString(src, i);
    else if ('{[('.includes(c)) depth++;
    else if ('}])'.includes(c)) depth--;
    else if (c === ',' && depth === 0) break;
  }
  while (/\s/.test(src[i - 1])) i--;
  return i;
}

function locate(src: string, path: string[]): Range | null {
  const decl = new RegExp(`(?:export\\s+)?const\\s+${path[0]}\\b[^=]*=\\s*\\{`).exec(src);
  if (!decl) return null;
  let open = decl.index + decl[0].length - 1;
  let range: Range = { open, close: matchBracket(src, open) };
  for (const key of path.slice(1)) {
    const prop = findProp(src, range, key);
    if (!prop || src[prop.valueStart] !== '{') return null;
    open = prop.valueStart;
    range = { open, close: matchBracket(src, open) };
  }
  return range;
}

const usesDoubleQuotes = (src: string) => (src.match(/: "/g)?.length ?? 0) >= (src.match(/: '/g)?.length ?? 0);

function literal(value: Literal, src: string): string {
  if (typeof value !== 'string') return String(value);
  if (usesDoubleQuotes(src)) return JSON.stringify(value);
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function keyLiteral(key: string, src: string): string {
  return /^[A-Za-z_$][\w$]*$/.test(key) ? key : literal(key, src);
}

export function hasKey(src: string, path: string[], key: string): boolean {
  const range = locate(src, path);
  return !!range && !!findProp(src, range, key);
}

/** Replaces the value of `key` in the object at `path`; adds the key if missing. Unknown path = unchanged. */
export function setValue(src: string, path: string[], key: string, value: Literal): string {
  const range = locate(src, path);
  if (!range) return src;
  const prop = findProp(src, range, key);
  if (prop) return src.slice(0, prop.valueStart) + literal(value, src) + src.slice(prop.valueEnd);
  let last = range.close - 1;
  while (/\s/.test(src[last])) last--;
  const entry = `${keyLiteral(key, src)}: ${literal(value, src)}`;
  const body = src.slice(range.open, range.close);
  if (!body.includes('\n')) {
    const sep = src[last] === '{' ? ' ' : src[last] === ',' ? ' ' : ', ';
    return `${src.slice(0, last + 1)}${sep}${entry} ${src.slice(range.close)}`;
  }
  const indent = /\n([ \t]*)[^\n]*$/.exec(src.slice(range.open, last + 1))?.[1] ?? '  ';
  const comma = src[last] === ',' || src[last] === '{' ? '' : ',';
  return `${src.slice(0, last + 1)}${comma}\n${indent}${entry},${src.slice(last + 1)}`;
}
