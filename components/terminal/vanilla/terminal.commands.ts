// Built-in commands + execution engine of Terminal — framework-free.
// Identical copy lives in react/ and vanilla/ (copy-paste: each version is self-contained).
import type { TerminalSettings } from "./terminal.config";

export type Tone = "accent" | "bright" | "dim" | "error";
export type Segment = { text: string; tone?: Tone };
/** A line of output: plain text, colored segments, a name/description grid, or ASCII art + info columns */
export type Output = string | Segment[] | { art: string[]; lines: Segment[][] };
export type CommandResult = Output | Output[] | void;

export interface CommandContext {
  print: (out: Output) => void;
  /** Abort-aware delay (rejects on Ctrl+C) */
  sleep: (ms: number) => Promise<void>;
  signal: AbortSignal;
  options: TerminalSettings;
  history: readonly string[];
  commands: Record<string, CommandDef>;
  /** The terminal element (excluded from `find`) */
  root: HTMLElement | null;
  clear: () => void;
}

export type TerminalCommand = (
  args: string[],
  ctx: CommandContext,
) => CommandResult | Promise<CommandResult>;
export type CommandGroup = "system" | "navigation" | "tools" | "network" | "custom";
export interface CommandDef {
  usage: string;
  description: string;
  group?: CommandGroup;
  run: TerminalCommand;
}

// ---------- helpers ----------

const GROUPS: CommandGroup[] = ["system", "navigation", "tools", "network", "custom"];
const RULE_WIDTH = 56;

/** Two aligned columns: left padded to the widest entry (monospace) */
function table(
  rows: [string, string][],
  indent = "  ",
  width = Math.max(0, ...rows.map(([left]) => left.length)) + 4,
): Segment[][] {
  return rows.map(([left, right]) => [
    seg(`${indent}${left.padEnd(width)}`, "bright"),
    seg(right, "dim"),
  ]);
}

/** Section header: ── TITLE ──────── */
const rule = (title: string): Segment[] => [
  seg("── ", "dim"),
  seg(title.toUpperCase(), "accent"),
  seg(` ${"─".repeat(Math.max(4, RULE_WIDTH - title.length - 4))}`, "dim"),
];

const seg = (text: string, tone?: Tone): Segment => ({ text, tone });
const utf8 = (text: string) => new TextEncoder().encode(text);
const isAbort = (error: unknown) => error instanceof DOMException && error.name === "AbortError";

export function parseArgs(line: string): string[] {
  return [...line.matchAll(/"([^"]*)"|'([^']*)'|(\S+)/g)].map((m) => m[1] ?? m[2] ?? m[3]);
}

function hash(text: string): number {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

function fakeIp(host: string): string {
  const h = hash(host);
  return `${(h % 200) + 20}.${(h >>> 8) & 255}.${(h >>> 16) & 255}.${((h >>> 24) & 254) + 1}`;
}

const time = () => new Date().toTimeString().slice(0, 8);

function linuxDate(d = new Date()): string {
  const day = d.toLocaleString("en-US", { weekday: "short" });
  const mon = d.toLocaleString("en-US", { month: "short" });
  const name =
    new Intl.DateTimeFormat("en-US", { timeZoneName: "short" })
      .formatToParts(d)
      .find((p) => p.type === "timeZoneName")?.value ?? "";
  const off = -d.getTimezoneOffset();
  const numeric = `${off >= 0 ? "+" : "-"}${String(Math.floor(Math.abs(off) / 60)).padStart(2, "0")}${String(Math.abs(off) % 60).padStart(2, "0")}`;
  const zone = /^[A-Z]{2,5}$/.test(name) ? name : numeric;
  return `${day} ${mon} ${String(d.getDate()).padStart(2)} ${time()} ${zone} ${d.getFullYear()}`;
}

export function sha256(text: string): string {
  const frac = (x: number) => ((x - Math.floor(x)) * 2 ** 32) >>> 0;
  const primes: number[] = [];
  for (let n = 2; primes.length < 64; n++) if (primes.every((p) => n % p)) primes.push(n);
  const K = primes.map((p) => frac(Math.pow(p, 1 / 3)));
  const H = primes.slice(0, 8).map((p) => frac(Math.sqrt(p)));
  const bytes = utf8(text);
  const bitLen = bytes.length * 8;
  const padded = new Uint8Array(Math.ceil((bytes.length + 9) / 64) * 64);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 8, Math.floor(bitLen / 2 ** 32));
  view.setUint32(padded.length - 4, bitLen >>> 0);
  const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n));
  const w = new Uint32Array(64);
  for (let off = 0; off < padded.length; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(off + i * 4);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const t1 =
        (h + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) >>> 0;
      const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
      [h, g, f, e, d, c, b, a] = [g, f, e, (d + t1) >>> 0, c, b, a, (t1 + t2) >>> 0];
    }
    [a, b, c, d, e, f, g, h].forEach((v, i) => (H[i] = (H[i] + v) >>> 0));
  }
  return H.map((v) => v.toString(16).padStart(8, "0")).join("");
}

/** Safe calculator (no eval): + - * / % ^, parentheses, pi, e, sqrt/abs/round/floor/ceil/sin/cos/tan/log/ln */
export function calc(input: string): number {
  const tokens = input.match(/\d*\.?\d+(?:e[+-]?\d+)?|[a-z]+|[-+*/%^()]/gi) ?? [];
  if (tokens.join("") !== input.replace(/\s+/g, "")) throw new Error("syntax error");
  const fns: Record<string, (x: number) => number> = {
    sqrt: Math.sqrt,
    abs: Math.abs,
    round: Math.round,
    floor: Math.floor,
    ceil: Math.ceil,
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    log: Math.log10,
    ln: Math.log,
  };
  let i = 0;
  const peek = () => tokens[i];
  const take = (t?: string) => {
    if (t && tokens[i] !== t) throw new Error(`expected '${t}'`);
    return tokens[i++];
  };
  const primary = (): number => {
    const t = take();
    if (t === undefined) throw new Error("unexpected end");
    if (t === "(") {
      const v = expr();
      take(")");
      return v;
    }
    if (t === "-") return -factor();
    if (t === "+") return factor();
    if (/^[\d.]/.test(t)) return Number(t);
    const name = t.toLowerCase();
    if (name === "pi") return Math.PI;
    if (name === "e") return Math.E;
    if (fns[name]) return fns[name](primary());
    throw new Error(`unknown token '${t}'`);
  };
  const factor = (): number => {
    const base = primary();
    if (peek() === "^") {
      take();
      return base ** factor();
    }
    return base;
  };
  const term = (): number => {
    let v = factor();
    while (peek() === "*" || peek() === "/" || peek() === "%") {
      const op = take();
      const r = factor();
      v = op === "*" ? v * r : op === "/" ? v / r : v % r;
    }
    return v;
  };
  const expr = (): number => {
    let v = term();
    while (peek() === "+" || peek() === "-") v = take() === "+" ? v + term() : v - term();
    return v;
  };
  const result = expr();
  if (i < tokens.length) throw new Error(`unexpected '${tokens[i]}'`);
  return result;
}

const rot13 = (text: string) =>
  text.replace(/[a-z]/gi, (c) =>
    String.fromCharCode(((c.toLowerCase().charCodeAt(0) - 97 + 13) % 26) + (c <= "Z" ? 65 : 97)),
  );

function xxd(text: string): string[] {
  const bytes = utf8(text);
  const lines: string[] = [];
  for (let off = 0; off < bytes.length; off += 16) {
    const chunk = [...bytes.slice(off, off + 16)];
    const hex = chunk.map((b) => b.toString(16).padStart(2, "0"));
    const groups = Array.from({ length: Math.ceil(hex.length / 2) }, (_, g) =>
      hex.slice(g * 2, g * 2 + 2).join(""),
    );
    const ascii = chunk.map((b) => (b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : ".")).join("");
    lines.push(`${off.toString(16).padStart(8, "0")}: ${groups.join(" ").padEnd(39)}  ${ascii}`);
  }
  return lines;
}

const base64Encode = (text: string) => btoa(String.fromCharCode(...utf8(text)));
const base64Decode = (b64: string) =>
  new TextDecoder().decode(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)));

// ---------- pages (cd / ls / sitemap) ----------

const trimSlash = (path: string) => (path.length > 1 ? path.replace(/\/+$/, "") : path);
const pageName = (path: string) => trimSlash(path).split("/").pop() || "~";

export function tildePath(pathname: string): string {
  const clean = trimSlash(pathname);
  return clean === "/" || clean === "" ? "~" : `~${clean}`;
}

function resolvePath(target: string, current: string): string {
  if (["", "~", "/", "~/"].includes(target)) return "/";
  const base = target.startsWith("/") ? [] : trimSlash(current).split("/").filter(Boolean);
  for (const part of target.replace(/^~\//, "/").split("/").filter(Boolean)) {
    if (part === "..") base.pop();
    else if (part !== ".") base.push(part);
  }
  return `/${base.join("/")}`;
}

// ---------- built-in commands ----------

export const builtinCommands: Record<string, CommandDef> = {
  help: {
    group: "system",
    usage: "help",
    description: "list all commands",
    run: (_, { commands }) => {
      const defs = Object.values(commands);
      const width = Math.max(...defs.map((d) => d.usage.length)) + 4;
      const out: Output[] = [];
      for (const group of GROUPS) {
        const rows = defs
          .filter((d) => (d.group ?? "custom") === group)
          .map((d): [string, string] => [d.usage, d.description]);
        if (!rows.length) continue;
        out.push(rule(group), ...table(rows, "  ", width), "");
      }
      out.push([seg("Type "), seg("man <command>", "accent"), seg(" for details.")]);
      return out;
    },
  },
  man: {
    group: "system",
    usage: "man <command>",
    description: "show command manual",
    run: ([name], { commands }) => {
      if (!name) return ["What manual page do you want?", "For example, try 'man help'."];
      const def = commands[name];
      if (!def) return [[seg(`No manual entry for ${name}`, "error")]];
      return [
        rule("name"),
        ...table([[name, def.description]]),
        "",
        rule("synopsis"),
        ...table([[def.usage, ""]]),
      ];
    },
  },
  version: {
    group: "system",
    usage: "version",
    description: "show site version",
    run: (_, { options }) => `${options.site.name} ${options.site.version}`,
  },
  clear: {
    group: "system",
    usage: "clear",
    description: "clear the screen",
    run: (_, { clear }) => clear(),
  },
  banner: {
    group: "system",
    usage: "banner",
    description: "print banner",
    run: (_, { options }) => (options.banner ? { art: options.banner, lines: [] } : undefined),
  },
  fastfetch: {
    group: "system",
    usage: "fastfetch",
    description: "system information",
    run: (_, { options }) => {
      const nav = navigator as Navigator & { deviceMemory?: number };
      const user = `${options.currentUser || "guest"}@${options.host}`;
      const info: Segment[][] = [
        [seg(user, "accent")],
        [seg("-".repeat(user.length), "dim")],
        ...table(
          [
            ["Site", `${options.site.name} ${options.site.version}`],
            ["Language", options.site.language],
            ["Shell", "web-terminal"],
            ["Keyboard", navigator.language || "N/A"],
            ["Resolution", `${innerWidth}x${innerHeight}`],
            [
              "CPU",
              navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} cores` : "N/A",
            ],
            ["Memory", nav.deviceMemory ? `${nav.deviceMemory} GB` : "N/A"],
            ["Timezone", Intl.DateTimeFormat().resolvedOptions().timeZone || "N/A"],
            ["Uptime", `${Math.max(1, Math.round(performance.now() / 60000))} min`],
          ].map(([k, v]): [string, string] => [`${k}:`, v]),
          "",
          12,
        ).map(([k, v]) => [
          { ...k, tone: "accent" as const },
          { ...v, tone: "bright" as const },
        ]),
      ];
      return { art: options.fastfetchArt, lines: info };
    },
  },
  whoami: {
    group: "system",
    usage: "whoami",
    description: "print current user",
    run: (_, { options }) => options.currentUser || "guest",
  },
  history: {
    group: "system",
    usage: "history",
    description: "session history",
    run: (_, { history }) => history.map((line, i) => `${String(i + 1).padStart(5)}  ${line}`),
  },
  date: {
    group: "system",
    usage: "date",
    description: "show date and time",
    run: () => linuxDate(),
  },
  ls: {
    group: "navigation",
    usage: "ls",
    description: "list pages",
    run: (_, { options }) =>
      table(
        options.pages.map((p): [string, string] => [`${pageName(p.path)}/`, p.title]),
        "",
      ),
  },
  cd: {
    group: "navigation",
    usage: "cd <page>",
    description: "go to a page",
    run: ([target = "~"], { options }) => {
      const path = resolvePath(target, location.pathname);
      const page = options.pages.find((p) => trimSlash(p.path) === path);
      if (!page) return [[seg(`cd: no such page: ${target}`, "error")]];
      if (trimSlash(location.pathname) !== path)
        (options.navigate ?? ((p: string) => location.assign(p)))(page.path);
    },
  },
  pwd: {
    group: "navigation",
    usage: "pwd",
    description: "print current URL",
    run: () => location.href,
  },
  back: {
    group: "navigation",
    usage: "back",
    description: "go to previous page",
    run: (_, ctx) => {
      if (ctx.options?.onBack) return ctx.options.onBack();
      if (history.length <= 1) return [[seg("back: no previous page", "error")]];
      history.back();
    },
  },
  sitemap: {
    group: "navigation",
    usage: "sitemap",
    description: "show site map",
    run: (_, { options }) => {
      const width = Math.max(...options.pages.map((p) => p.path.length)) + 2;
      return [
        [seg(location.origin, "accent")],
        ...options.pages.map((p, i) => [
          seg(i === options.pages.length - 1 ? "└── " : "├── ", "dim"),
          seg(p.path.padEnd(width)),
          seg(p.title, "dim"),
        ]),
      ];
    },
  },
  find: {
    group: "navigation",
    usage: "find <word>",
    description: "search this page",
    run: (args, { root }) => {
      const word = args.join(" ");
      if (!word) return [[seg("find: missing search word", "error")]];
      const needle = word.toLowerCase();
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) =>
          root?.contains(node) || node.parentElement?.closest("script,style,noscript")
            ? NodeFilter.FILTER_REJECT
            : NodeFilter.FILTER_ACCEPT,
      });
      const hits: { node: Text; index: number }[] = [];
      for (
        let node = walker.nextNode() as Text | null;
        node;
        node = walker.nextNode() as Text | null
      ) {
        const text = node.data.toLowerCase();
        for (
          let at = text.indexOf(needle);
          at !== -1;
          at = text.indexOf(needle, at + needle.length)
        )
          hits.push({ node, index: at });
      }
      if (!hits.length) return [[seg(`find: '${word}' not found on this page`, "error")]];
      hits[0].node.parentElement?.scrollIntoView({ behavior: "smooth", block: "center" });
      const out: Output[] = [`${hits.length} match${hits.length > 1 ? "es" : ""} for '${word}':`];
      for (const { node, index } of hits.slice(0, 5)) {
        const s = node.data;
        const from = Math.max(0, index - 24);
        out.push([
          seg(`  ${from ? "…" : ""}${s.slice(from, index)}`.replace(/\s+/g, " "), "dim"),
          seg(s.slice(index, index + needle.length), "accent"),
          seg(
            `${s.slice(index + needle.length, index + needle.length + 24)}…`.replace(/\s+/g, " "),
            "dim",
          ),
        ]);
      }
      return out;
    },
  },
  calc: {
    group: "tools",
    usage: "calc <expression>",
    description: "calculator",
    run: (args) => {
      if (!args.length) return [[seg("calc: missing expression", "error")]];
      const v = calc(args.join(" "));
      return Number.isFinite(v)
        ? String(Number(v.toPrecision(12)))
        : [[seg("calc: math error", "error")]];
    },
  },
  sha256: {
    group: "tools",
    usage: "sha256 <text>",
    description: "SHA-256 hash",
    run: (args) => `${sha256(args.join(" "))}  -`,
  },
  base64: {
    group: "tools",
    usage: "base64 [-d] <text>",
    description: "encode / decode base64",
    run: (args) => {
      if (args[0] === "-d" || args[0] === "--decode") {
        try {
          return base64Decode(args.slice(1).join(""));
        } catch {
          return [[seg("base64: invalid input", "error")]];
        }
      }
      return base64Encode(args.join(" "));
    },
  },
  rot13: {
    group: "tools",
    usage: "rot13 <text>",
    description: "ROT13 cipher",
    run: (args) => rot13(args.join(" ")),
  },
  xxd: {
    group: "tools",
    usage: "xxd <text>",
    description: "hex dump",
    run: (args) => xxd(args.join(" ")),
  },
  echo: {
    group: "tools",
    usage: "echo <text>",
    description: "print text",
    run: (args) => args.join(" "),
  },
  ping: {
    group: "network",
    usage: "ping [-c count] <host>",
    description: "ping a host",
    run: async (args, { print, sleep }) => {
      const countAt = args.indexOf("-c");
      const count = countAt >= 0 ? Math.max(1, Number(args[countAt + 1]) || 4) : 4;
      const host =
        countAt >= 0 ? args.filter((_, i) => i !== countAt && i !== countAt + 1)[0] : args[0];
      if (!host) return ["ping: usage error: Destination address required"];
      const ip = fakeIp(host);
      const times: number[] = [];
      print(`PING ${host} (${ip}) 56(84) bytes of data.`);
      try {
        for (let seq = 1; seq <= count; seq++) {
          const ms = 8 + (hash(host + seq) % 3200) / 100;
          times.push(ms);
          print(`64 bytes from ${host} (${ip}): icmp_seq=${seq} ttl=117 time=${ms.toFixed(1)} ms`);
          if (seq < count) await sleep(1000);
        }
      } catch (error) {
        if (!isAbort(error)) throw error;
        print("^C");
      }
      const avg = times.reduce((a, b) => a + b, 0) / (times.length || 1);
      print("");
      print(`--- ${host} ping statistics ---`);
      print(
        `${times.length} packets transmitted, ${times.length} received, 0% packet loss, time ${Math.max(0, times.length - 1) * 1000}ms`,
      );
      print(
        `rtt min/avg/max/mdev = ${Math.min(...times).toFixed(3)}/${avg.toFixed(3)}/${Math.max(...times).toFixed(3)}/${(Math.max(...times) - avg).toFixed(3)} ms`,
      );
    },
  },
  traceroute: {
    group: "network",
    usage: "traceroute <host>",
    description: "trace a route",
    run: async ([host], { print, sleep }) => {
      if (!host) return ["Usage: traceroute <host>"];
      const ip = fakeIp(host);
      print(`traceroute to ${host} (${ip}), 30 hops max, 60 byte packets`);
      const hops = 5 + (hash(host) % 5);
      for (let hop = 1; hop <= hops; hop++) {
        await sleep(350);
        const hopIp = hop === hops ? ip : hop === 1 ? "192.168.1.1" : fakeIp(`${host}#${hop}`);
        const t = (k: number) => `${(hop * 4 + (hash(host + hop + k) % 900) / 100).toFixed(3)} ms`;
        const name = hop === hops ? host : hop === 1 ? "_gateway" : hopIp;
        print(`${String(hop).padStart(2)}  ${name} (${hopIp})  ${t(1)}  ${t(2)}  ${t(3)}`);
      }
    },
  },
  whois: {
    group: "network",
    usage: "whois <domain>",
    description: "domain lookup",
    run: ([domain]) => {
      if (!domain) return ["Usage: whois <domain>"];
      return [
        `Domain Name: ${domain.toUpperCase()}`,
        "Registrar: [redacted]",
        "Name Server: cloudflare",
        "DNSSEC: signedDelegation",
        "Status: clientTransferProhibited",
        "",
        [seg("// a real whois needs a real shell, buddy.", "dim")],
      ];
    },
  },
  ifconfig: {
    group: "network",
    usage: "ifconfig",
    description: "network interfaces",
    run: (_, { options }) => options.showcase.ifconfig,
  },
  nmap: {
    group: "network",
    usage: "nmap",
    description: "scan network",
    run: async (_, { print, sleep, options }) => {
      const { wifi, hosts } = options.showcase;
      print(`[${time()}] starting scan on wlan0…`);
      await sleep(400);
      print(`[${time()}] switching interface to monitor mode`);
      await sleep(500);
      print([seg(`${"ESSID".padEnd(22)}${"POWER".padEnd(10)}SECURITY`, "accent")]);
      for (const w of wifi) print(`  ${w.essid.padEnd(20)}${w.power.padEnd(10)}${w.security}`);
      await sleep(600);
      print(`[${time()}] scanning LAN hosts…`);
      await sleep(600);
      print([seg(`${"IP".padEnd(16)}${"MAC".padEnd(20)}${"HOST".padEnd(16)}PORTS`, "accent")]);
      for (const h of hosts)
        print(`  ${h.ip.padEnd(16)}${h.mac.padEnd(20)}${h.host.padEnd(16)}${h.ports}`);
      print(`[${time()}] scan complete — ${hosts.length} hosts.`);
    },
  },
  curl: {
    group: "network",
    usage: "curl <url>",
    description: "fetch a URL",
    run: ([url]) =>
      url
        ? [[seg("curl: (7) Failed to connect — this is a browser tab, not a shell", "error")]]
        : ["curl: try 'curl --help' for more information"],
  },
};

// ---------- engine ----------

export function toCommandDefs(
  commands: Record<string, TerminalCommand | CommandDef>,
): Record<string, CommandDef> {
  return Object.fromEntries(
    Object.entries(commands).map(([name, c]) => [
      name,
      typeof c === "function"
        ? { usage: name, description: "custom command", group: "custom", run: c }
        : c,
    ]),
  );
}

export interface ExecuteEnv {
  options: TerminalSettings;
  history: readonly string[];
  root: HTMLElement | null;
  signal: AbortSignal;
  print: (out: Output) => void;
  clear: () => void;
}

/** Runs one command line; outputs go through env.print */
export async function executeLine(line: string, env: ExecuteEnv): Promise<void> {
  const [name, ...args] = parseArgs(line.trim());
  if (!name) return;
  const commands = { ...builtinCommands, ...toCommandDefs(env.options.commands) };
  const def = commands[name];
  if (!def) return env.print([seg(`${name}: command not found`, "error")]);
  const sleep = (ms: number) =>
    new Promise<void>((resolve, reject) => {
      if (env.signal.aborted) return reject(new DOMException("Aborted", "AbortError"));
      const timer = setTimeout(resolve, ms);
      env.signal.addEventListener(
        "abort",
        () => (clearTimeout(timer), reject(new DOMException("Aborted", "AbortError"))),
        { once: true },
      );
    });
  try {
    const result = await def.run(args, { ...env, sleep, commands });
    if (result === undefined) return;
    const outs: Output[] =
      Array.isArray(result) &&
      !(result.length && typeof result[0] === "object" && "text" in result[0])
        ? (result as Output[])
        : [result as Output];
    outs.forEach(env.print);
  } catch (error) {
    env.print(
      isAbort(error)
        ? "^C"
        : [seg(`${name}: ${error instanceof Error ? error.message : "error"}`, "error")],
    );
  }
}

/** Tab completion for command names and `cd`/`man` arguments */
export function complete(value: string, options: TerminalSettings): string {
  const commands = { ...builtinCommands, ...toCommandDefs(options.commands) };
  const [cmd, arg] = value.split(/\s+(.*)/);
  const pick = (prefix: string, words: string[]) => {
    const found = words.filter((w) => w.startsWith(prefix));
    return found.length === 1 ? found[0] : undefined;
  };
  if (arg === undefined) {
    const hit = pick(cmd, Object.keys(commands));
    return hit ? `${hit} ` : value;
  }
  const words =
    cmd === "cd"
      ? options.pages.map((p) => `${pageName(p.path)}/`)
      : cmd === "man"
        ? Object.keys(commands)
        : [];
  const hit = pick(arg, words);
  return hit ? `${cmd} ${hit}` : value;
}
