// Tiny framework-free tokenizer for CodeBlock (identical copy in the React and Vanilla folders).
// It returns plain token arrays; the component renders them as <span> elements with textContent,
// so code text is never parsed as HTML. Accuracy goal: "looks right" for everyday snippets, not a full parser.

export type TokenKind =
  | "comment"
  | "string"
  | "keyword"
  | "number"
  | "function"
  | "type"
  | "operator"
  | "punctuation"
  | "tag"
  | "attribute"
  | "property"
  | "variable";

export interface Token {
  /** null = plain text (rendered with the foreground color) */
  kind: TokenKind | null;
  text: string;
}

export type HighlightLanguage = "ts" | "js" | "json" | "css" | "bash" | "html" | "text";

/** Accepted language names → tokenizer */
export const LANGUAGE_ALIASES: Record<string, HighlightLanguage> = {
  ts: "ts",
  tsx: "ts",
  typescript: "ts",
  js: "js",
  jsx: "js",
  javascript: "js",
  mjs: "js",
  cjs: "js",
  json: "json",
  jsonc: "json",
  css: "css",
  bash: "bash",
  sh: "bash",
  shell: "bash",
  zsh: "bash",
  html: "html",
  xml: "html",
  svg: "html",
  text: "text",
  txt: "text",
  plain: "text",
};

const JSX_LANGUAGES = new Set(["tsx", "jsx", "js", "javascript", "mjs", "cjs"]);

const JS_KEYWORDS = new Set(
  (
    "as async await break case catch class const continue debugger default delete do else enum export " +
    "extends false finally for from function get if implements import in instanceof interface let new null " +
    "of package private protected public readonly return satisfies set static super switch this throw true " +
    "try type typeof undefined var void while with yield declare namespace module keyof infer is abstract override"
  ).split(" "),
);
const TS_TYPES = new Set(
  "string number boolean any unknown never object symbol bigint void".split(" "),
);
const BASH_KEYWORDS = new Set(
  "if then else elif fi for in do done case esac while until function return select time local export readonly declare unset shift break continue".split(
    " ",
  ),
);

class Scanner {
  i = 0;
  tokens: Token[] = [];
  /** Last significant (non-space, non-comment) token */
  prev: Token | null = null;

  readonly src: string;

  constructor(src: string) {
    this.src = src;
  }

  done() {
    return this.i >= this.src.length;
  }
  peek(offset = 0) {
    return this.src[this.i + offset] ?? "";
  }
  /** Matches a sticky regex at the cursor without consuming it */
  match(re: RegExp): string | null {
    re.lastIndex = this.i;
    const m = re.exec(this.src);
    return m && m.index === this.i && m[0].length ? m[0] : null;
  }
  push(kind: TokenKind | null, text: string) {
    if (!text) return;
    this.i += text.length;
    const last = this.tokens[this.tokens.length - 1];
    if (last && last.kind === kind) last.text += text;
    else this.tokens.push({ kind, text });
    if (kind !== "comment" && text.trim()) this.prev = { kind, text };
  }
  /** Consumes a regex match as one token; true if something matched */
  take(re: RegExp, kind: TokenKind | null): boolean {
    const text = this.match(re);
    if (text === null) return false;
    this.push(kind, text);
    return true;
  }
  /** Appends tokens produced by another tokenizer (embedded languages) */
  embed(text: string, language: string) {
    for (const token of tokenize(text, language)) this.push(token.kind, token.text);
  }
}

const re = (source: string) => new RegExp(source, "y");

const SPACE = re("\\s+");
const LINE_COMMENT = re("//.*");
const BLOCK_COMMENT = re("/\\*[\\s\\S]*?(?:\\*/|$)");
const DQ_STRING = re('"(?:\\\\.|[^"\\\\\\n])*"?');
const SQ_STRING = re("'(?:\\\\.|[^'\\\\\\n])*'?");
const NUMBER = re(
  "(?:0[xX][\\da-fA-F_]+|0[bB][01_]+|0[oO][0-7_]+|(?:\\d[\\d_]*\\.?[\\d_]*|\\.\\d[\\d_]*)(?:[eE][+-]?\\d+)?)n?",
);
const IDENT = re("[A-Za-z_$][\\w$]*");
const JS_REGEX = re("/(?![*/])(?:\\\\.|\\[(?:\\\\.|[^\\]\\\\\\n])*\\]|[^/\\\\\\n[])+/[dgimsuyv]*");
const JS_OPERATOR = re(
  "=>|\\.\\.\\.|\\?\\?=?|\\?\\.|&&=?|\\|\\|=?|\\*\\*=?|[+\\-*/%&|^!=<>~]=?=?|[?:]",
);
const PUNCTUATION = re("[{}()[\\];,.]");
const DECORATOR = re("@[A-Za-z_$][\\w$]*");
const CALL_AHEAD = re("\\s*(?:<[\\w\\s,.[\\]|&]*>)?\\s*\\(");
const COLON_AHEAD = re("\\s*\\??:");

/** Can a `/` or `<` at this point start a regex / JSX tag (instead of being an operator)? */
function expressionStart(s: Scanner): boolean {
  const p = s.prev;
  if (!p) return true;
  if (p.kind === "keyword")
    return !["this", "super", "true", "false", "null", "undefined"].includes(p.text);
  if (p.kind === "operator") return true;
  if (p.kind === "punctuation") return !p.text.endsWith(")") && !p.text.endsWith("]");
  return false;
}

function lookahead(s: Scanner, regex: RegExp, from: number): boolean {
  regex.lastIndex = from;
  const m = regex.exec(s.src);
  return !!m && m.index === from;
}

function jsIdentifier(s: Scanner, word: string) {
  const end = s.i + word.length;
  const afterDot = s.prev?.text.endsWith(".") || s.prev?.text.endsWith("?.");
  if (!afterDot && JS_KEYWORDS.has(word)) return s.push("keyword", word);
  if (lookahead(s, CALL_AHEAD, end)) return s.push("function", word);
  if (afterDot) return s.push("property", word);
  const keyPosition = s.prev?.text.endsWith("{") || s.prev?.text.endsWith(",");
  if (keyPosition && lookahead(s, COLON_AHEAD, end)) return s.push("property", word);
  if (TS_TYPES.has(word) || /^[A-Z]/.test(word)) return s.push("type", word);
  s.push("variable", word);
}

function templateLiteral(s: Scanner, jsx: boolean) {
  s.push("string", "`");
  let start = s.i;
  while (!s.done()) {
    const c = s.peek();
    if (c === "\\") {
      s.i += 2;
      continue;
    }
    if (c === "`" || (c === "$" && s.peek(1) === "{")) {
      const text = s.src.slice(start, s.i);
      s.i = start;
      s.push("string", text);
      if (c === "`") return s.push("string", "`");
      s.push("punctuation", "${");
      js(s, jsx, true);
      if (s.peek() === "}") s.push("punctuation", "}");
      start = s.i;
      continue;
    }
    s.i++;
  }
  const rest = s.src.slice(start, s.i);
  s.i = start;
  s.push("string", rest);
}

/** Embedded `{ … }` expression inside JSX; the cursor is on `{` */
function jsxExpression(s: Scanner) {
  s.push("punctuation", "{");
  js(s, true, true);
  if (s.peek() === "}") s.push("punctuation", "}");
}

const JSX_NAME = re("[A-Za-z_$][\\w$.:-]*");
const JSX_ATTR = re("[A-Za-z_$][\\w$:-]*");
const JSX_TEXT = re("[^<{]+");

/** One JSX tag; the cursor is on `<`. Returns what kind of tag it was. */
function jsxTag(s: Scanner): "open" | "close" | "self" {
  s.push("punctuation", "<");
  const closing = s.peek() === "/";
  if (closing) s.push("punctuation", "/");
  s.take(JSX_NAME, "tag");
  while (!s.done()) {
    if (s.take(SPACE, null)) continue;
    if (s.peek() === "/" && s.peek(1) === ">") {
      s.push("punctuation", "/>");
      return "self";
    }
    if (s.peek() === ">") {
      s.push("punctuation", ">");
      return closing ? "close" : "open";
    }
    if (s.peek() === "{") jsxExpression(s);
    else if (s.peek() === "=") s.push("operator", "=");
    else if (
      !s.take(DQ_STRING, "string") &&
      !s.take(SQ_STRING, "string") &&
      !s.take(JSX_ATTR, "attribute")
    )
      s.push(null, s.peek());
  }
  return "self";
}

/** Children of an open JSX element until its closing tag */
function jsxChildren(s: Scanner) {
  let depth = 1;
  while (!s.done() && depth > 0) {
    if (s.take(JSX_TEXT, null)) continue;
    if (s.peek() === "{") jsxExpression(s);
    else {
      const kind = jsxTag(s);
      if (kind === "open") depth++;
      else if (kind === "close") depth--;
    }
  }
}

function jsStep(s: Scanner, jsx: boolean) {
  const c = s.peek();
  if (s.take(SPACE, null) || s.take(LINE_COMMENT, "comment") || s.take(BLOCK_COMMENT, "comment"))
    return;
  if (s.take(DQ_STRING, "string") || s.take(SQ_STRING, "string")) return;
  if (c === "`") return templateLiteral(s, jsx);
  if (/\d/.test(c) || (c === "." && /\d/.test(s.peek(1)))) {
    if (s.take(NUMBER, "number")) return;
  }
  const word = s.match(IDENT);
  if (word) return jsIdentifier(s, word);
  if (c === "/" && expressionStart(s) && s.take(JS_REGEX, "string")) return;
  if (jsx && c === "<" && /[A-Za-z>]/.test(s.peek(1)) && expressionStart(s)) {
    if (jsxTag(s) === "open") jsxChildren(s);
    return;
  }
  if (
    s.take(DECORATOR, "function") ||
    s.take(JS_OPERATOR, "operator") ||
    s.take(PUNCTUATION, "punctuation")
  )
    return;
  s.push(null, c);
}

/** JavaScript / TypeScript; `untilBrace` stops before the `}` that closes an embedded expression */
function js(s: Scanner, jsx: boolean, untilBrace = false) {
  let depth = 0;
  while (!s.done()) {
    const c = s.peek();
    if (untilBrace && c === "{") depth++;
    if (untilBrace && c === "}") {
      if (depth === 0) return;
      depth--;
    }
    jsStep(s, jsx);
  }
}

const JSON_KEY_AHEAD = re("\\s*:");
const JSON_LITERAL = re("(?:true|false|null)\\b");
const JSON_PUNCT = re("[{}[\\],:]");

function json(s: Scanner) {
  while (!s.done()) {
    if (s.take(SPACE, null) || s.take(LINE_COMMENT, "comment") || s.take(BLOCK_COMMENT, "comment"))
      continue;
    const str = s.match(DQ_STRING);
    if (str) {
      s.push(lookahead(s, JSON_KEY_AHEAD, s.i + str.length) ? "property" : "string", str);
      continue;
    }
    if (s.take(re("-?" + NUMBER.source), "number") || s.take(JSON_LITERAL, "keyword")) continue;
    if (s.take(JSON_PUNCT, "punctuation")) continue;
    s.push(null, s.peek());
  }
}

const CSS_AT = re("@[\\w-]+");
const CSS_CUSTOM_PROP = re("--[\\w-]+");
const CSS_HEX = re("#[\\da-fA-F]{3,8}\\b");
const CSS_NUMBER = re("-?(?:\\d+\\.?\\d*|\\.\\d+)(?:[a-zA-Z%]+)?");
const CSS_IDENT = re("-?[A-Za-z_][\\w-]*");
const CSS_CLASS = re("[.#][\\w-]+");
const CSS_PSEUDO = re("::?[\\w-]+");
const CSS_ATTR = re("\\[[^\\]]*\\]?");
const CSS_IMPORTANT = re("!important\\b");
const CSS_OPERATOR = re("[>+~*=/,]");
const CSS_PUNCT = re("[{}();:]");

/** Is the statement starting at the cursor a selector (`{` comes before `;` / `}`)? */
function cssSelectorAhead(s: Scanner): boolean {
  for (let i = s.i; i < s.src.length; i++) {
    const c = s.src[i];
    if (c === "{") return true;
    if (c === ";" || c === "}") return false;
  }
  return false;
}

function cssValue(s: Scanner) {
  const c = s.peek();
  if (s.take(DQ_STRING, "string") || s.take(SQ_STRING, "string")) return;
  if (s.take(CSS_IMPORTANT, "keyword") || s.take(CSS_HEX, "number")) return;
  if (s.take(CSS_CUSTOM_PROP, "variable")) return;
  if (
    (/\d/.test(c) || ((c === "-" || c === ".") && /[\d.]/.test(s.peek(1)))) &&
    s.take(CSS_NUMBER, "number")
  )
    return;
  const word = s.match(CSS_IDENT);
  if (word) return s.push(s.peek(word.length) === "(" ? "function" : "variable", word);
  if (s.take(CSS_OPERATOR, "operator") || s.take(CSS_PUNCT, "punctuation")) return;
  s.push(null, c);
}

function cssSelector(s: Scanner) {
  const c = s.peek();
  if (s.take(CSS_AT, "keyword") || s.take(CSS_CLASS, "type") || s.take(CSS_PSEUDO, "attribute"))
    return;
  if (c === "[" && s.take(CSS_ATTR, "attribute")) return;
  if (s.take(DQ_STRING, "string") || s.take(SQ_STRING, "string")) return;
  if (/\d/.test(c) && s.take(CSS_NUMBER, "number")) return;
  const word = s.match(CSS_IDENT);
  if (word) return s.push(s.prev?.kind === "keyword" ? "variable" : "tag", word);
  if (s.take(CSS_OPERATOR, "operator") || s.take(CSS_PUNCT, "punctuation")) return;
  s.push(null, c);
}

function css(s: Scanner) {
  let statementStart = true;
  let selector = false;
  let declarationKey = false;
  while (!s.done()) {
    if (s.take(SPACE, null) || s.take(BLOCK_COMMENT, "comment")) continue;
    const c = s.peek();
    if (statementStart) {
      selector = cssSelectorAhead(s) || c === "@";
      declarationKey = !selector;
      statementStart = false;
    }
    if (c === "{" || c === "}" || c === ";") {
      s.push("punctuation", c);
      statementStart = true;
      continue;
    }
    if (selector) {
      cssSelector(s);
      continue;
    }
    if (declarationKey) {
      if (s.take(CSS_CUSTOM_PROP, "property") || s.take(CSS_IDENT, "property")) continue;
      if (c === ":") {
        s.push("punctuation", ":");
        declarationKey = false;
        continue;
      }
    }
    cssValue(s);
  }
}

const BASH_COMMENT = re("#.*");
const BASH_VAR = re("\\$\\{[^}\\n]*\\}?|\\$[\\w@#?$!*-]");
const BASH_ASSIGN = re("[A-Za-z_]\\w*(?==)");
const BASH_FLAG = re("--?[\\w-]+");
const BASH_WORD = re("[^\\s|&;<>()$`\"'=]+");
const BASH_OPERATOR = re("&&|\\|\\||[|&;<>]+|=");
const BASH_PUNCT = re("[()[\\]{}]");
const BASH_DQ = re('"(?:\\\\.|[^"\\\\])*"?');
const BASH_SQ = re("'[^']*'?");

function bash(s: Scanner) {
  let commandStart = true;
  while (!s.done()) {
    const c = s.peek();
    const atWordStart = s.i === 0 || /\s/.test(s.src[s.i - 1] ?? "");
    if (c === "\n") commandStart = true;
    if (s.take(SPACE, null)) continue;
    if (c === "#" && atWordStart && s.take(BASH_COMMENT, "comment")) continue;
    if (s.take(BASH_DQ, "string") || s.take(BASH_SQ, "string") || s.take(BASH_VAR, "variable")) {
      commandStart = false;
      continue;
    }
    if (s.take(BASH_OPERATOR, "operator") || s.take(BASH_PUNCT, "punctuation")) {
      commandStart = c !== ">" && c !== "<" && c !== "=";
      continue;
    }
    // `NAME=value cmd`: the assignment does not end the command position
    if (commandStart && s.take(BASH_ASSIGN, "variable")) {
      s.push("operator", "=");
      if (!s.take(BASH_DQ, "string") && !s.take(BASH_SQ, "string")) s.take(BASH_WORD, "string");
      continue;
    }
    if (atWordStart && s.take(BASH_FLAG, "attribute")) continue;
    const word = s.match(BASH_WORD);
    if (!word) {
      s.push(null, c);
      continue;
    }
    if (BASH_KEYWORDS.has(word)) {
      s.push("keyword", word);
      commandStart = true;
    } else if (/^\d+(?:\.\d+)?$/.test(word)) s.push("number", word);
    else {
      s.push(commandStart ? "function" : null, word);
      commandStart = false;
    }
  }
}

const HTML_COMMENT = re("<!--[\\s\\S]*?(?:-->|$)");
const HTML_DOCTYPE = re("<![^>]*>?");
const HTML_TEXT = re("[^<&]+");
const HTML_ENTITY = re("&#?\\w+;?");
const HTML_NAME = re("[A-Za-z][\\w:.-]*");
const HTML_ATTR = re("[^\\s\"'>/=]+");
const HTML_UNQUOTED = re("[^\\s\"'=<>`]+");

/** One HTML tag; the cursor is on `<`. Returns the lowercase name of an opening tag. */
function htmlTag(s: Scanner): string | null {
  s.push("punctuation", "<");
  const closing = s.peek() === "/";
  if (closing) s.push("punctuation", "/");
  const name = s.match(HTML_NAME) ?? "";
  s.push("tag", name);
  while (!s.done()) {
    if (s.take(SPACE, null)) continue;
    if (s.peek() === "/" && s.peek(1) === ">") {
      s.push("punctuation", "/>");
      return null;
    }
    if (s.peek() === ">") {
      s.push("punctuation", ">");
      return closing ? null : name.toLowerCase();
    }
    if (s.peek() === "=") {
      s.push("operator", "=");
      if (!s.take(DQ_STRING, "string") && !s.take(SQ_STRING, "string"))
        s.take(HTML_UNQUOTED, "string");
      continue;
    }
    if (!s.take(HTML_ATTR, "attribute")) s.push(null, s.peek());
  }
  return null;
}

function html(s: Scanner) {
  while (!s.done()) {
    if (s.take(HTML_COMMENT, "comment") || s.take(HTML_DOCTYPE, "keyword")) continue;
    if (s.take(HTML_TEXT, null) || s.take(HTML_ENTITY, "keyword")) continue;
    if (!/[A-Za-z/]/.test(s.peek(1))) {
      s.push(null, "<");
      continue;
    }
    const opened = htmlTag(s);
    if (opened !== "script" && opened !== "style") continue;
    // Raw text elements: highlight their body with the embedded language
    const end = s.src.toLowerCase().indexOf(`</${opened}`, s.i);
    const body = s.src.slice(s.i, end < 0 ? s.src.length : end);
    s.embed(body, opened === "script" ? "js" : "css");
  }
}

/** Normalized tokenizer name for a language string; unknown names → null */
export function resolveLanguage(language: string): HighlightLanguage | null {
  return LANGUAGE_ALIASES[language.trim().toLowerCase()] ?? null;
}

/** Splits code into tokens. Unknown languages and `text` return one plain token. */
export function tokenize(code: string, language: string): Token[] {
  const lang = resolveLanguage(language) ?? "text";
  if (!code) return [];
  if (lang === "text") return [{ kind: null, text: code }];
  const s = new Scanner(code);
  if (lang === "ts" || lang === "js")
    js(s, JSX_LANGUAGES.has(language.trim().toLowerCase()) || language === "tsx");
  else if (lang === "json") json(s);
  else if (lang === "css") css(s);
  else if (lang === "bash") bash(s);
  else html(s);
  return s.tokens;
}

/** Splits a token stream into lines (tokens never contain a newline afterwards) */
export function splitLines(tokens: Token[]): Token[][] {
  const lines: Token[][] = [[]];
  for (const token of tokens) {
    const parts = token.text.split("\n");
    parts.forEach((part, index) => {
      if (index > 0) lines.push([]);
      if (part) lines[lines.length - 1].push({ kind: token.kind, text: part });
    });
  }
  return lines;
}
