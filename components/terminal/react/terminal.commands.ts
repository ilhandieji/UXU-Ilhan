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
  /** Waits for a line typed by the user (interactive commands); rejects on Ctrl+C */
  read: (prompt?: string) => Promise<string>;
  /** Waits for one key press (e.key) */
  readKey: () => Promise<string>;
  /** Prints an output that can be replaced later (animations, live counters) */
  live: (out: Output) => (next: Output) => void;
}

export type TerminalCommand = (
  args: string[],
  ctx: CommandContext,
) => CommandResult | Promise<CommandResult>;
export type CommandGroup =
  "system" | "navigation" | "tools" | "network" | "games" | "fun" | "custom";
export interface CommandDef {
  usage: string;
  description: string;
  group?: CommandGroup;
  /** Not listed by `help` (easter eggs) */
  hidden?: boolean;
  run: TerminalCommand;
}

// ---------- helpers ----------

const GROUPS: CommandGroup[] = [
  "system",
  "navigation",
  "tools",
  "network",
  "games",
  "fun",
  "custom",
];
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
      const defs = Object.values(commands).filter((d) => !d.hidden);
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

// ---------- games (option `games`) ----------

const TYPING_TEXTS = [
  "the quick terminal prints green text on a black screen",
  "small components are easy to copy and easy to change",
  "every keystroke counts when the clock is running",
  "tokens and options make each component fully dynamic",
  "a good prompt is short clear and always ready",
];

/** Rooms of the `quest` text adventure: a small server building to escape from */
type Room = { name: string; text: string; exits: Record<string, string>; item?: string };
const QUEST_ROOMS: Record<string, Room> = {
  lobby: {
    name: "Lobby",
    text: "A quiet lobby. A dusty terminal blinks on the desk.",
    exits: { north: "hall" },
    item: "badge",
  },
  hall: {
    name: "Hallway",
    text: "A long hallway humming with fans. Doors lead east and west, stairs go up.",
    exits: { south: "lobby", east: "servers", west: "archive", up: "roof" },
  },
  servers: {
    name: "Server room",
    text: "Racks of blinking lights. Someone left a flashlight on a rack.",
    exits: { west: "hall" },
    item: "flashlight",
  },
  archive: {
    name: "Archive",
    text: "It is too dark to read anything here.",
    exits: { east: "hall" },
    item: "key",
  },
  roof: {
    name: "Roof",
    text: "A locked hatch blocks the way to the roof.",
    exits: { down: "hall" },
  },
};

async function quest({ print, read }: CommandContext): Promise<CommandResult> {
  let room = "lobby";
  const inventory = new Set<string>();
  const taken = new Set<string>();
  const describe = () => {
    const r = QUEST_ROOMS[room];
    const dark = room === "archive" && !inventory.has("flashlight");
    print([seg(`== ${r.name} ==`, "accent")]);
    print(
      dark
        ? r.text
        : room === "archive"
          ? "Shelves of old backups. Your light finds something shiny."
          : r.text,
    );
    if (r.item && !taken.has(r.item) && !(room === "archive" && dark))
      print([seg("You see: ", "dim"), seg(r.item, "bright")]);
    print([seg(`Exits: ${Object.keys(r.exits).join(", ")}`, "dim")]);
  };
  print([
    seg("QUEST", "accent"),
    seg(" — find a way onto the roof. Type 'help' for verbs.", "dim"),
  ]);
  describe();
  for (;;) {
    const [verb = "", target = ""] = (await read("quest>")).trim().toLowerCase().split(/\s+/);
    if (verb === "quit" || verb === "exit") return "You leave the building. Maybe next time.";
    if (verb === "help") {
      print("look · go <dir> (or n/s/e/w/up/down) · take <item> · inventory · quit");
      continue;
    }
    if (verb === "look") {
      describe();
      continue;
    }
    if (verb === "inventory" || verb === "i") {
      print(inventory.size ? `You carry: ${[...inventory].join(", ")}` : "Your hands are empty.");
      continue;
    }
    if (verb === "take") {
      const r = QUEST_ROOMS[room];
      const visible =
        r.item && !taken.has(r.item) && !(room === "archive" && !inventory.has("flashlight"));
      if (visible && target === r.item) {
        taken.add(r.item as string);
        inventory.add(r.item as string);
        print([seg("Taken: ", "dim"), seg(target, "accent")]);
      } else print("You can't take that.");
      continue;
    }
    const short: Record<string, string> = {
      n: "north",
      s: "south",
      e: "east",
      w: "west",
      u: "up",
      d: "down",
    };
    const dir = verb === "go" ? (short[target] ?? target) : (short[verb] ?? verb);
    const next = QUEST_ROOMS[room].exits[dir];
    if (!next) {
      print("You can't go that way.");
      continue;
    }
    if (next === "roof" && inventory.has("key")) {
      print([seg("The key turns. The hatch swings open to a sky full of stars.", "accent")]);
      return [[seg("★ You escaped! ", "accent"), seg(`Items found: ${inventory.size}/3`, "dim")]];
    }
    room = next;
    describe();
  }
}

export const gameCommands: Record<string, CommandDef> = {
  typing: {
    group: "games",
    usage: "typing",
    description: "typing speed test (WPM)",
    run: async (_, { print, read }) => {
      const text = TYPING_TEXTS[Math.floor(Math.random() * TYPING_TEXTS.length)];
      print([seg("Type the line below and press Enter:", "dim")]);
      print([seg(text, "accent")]);
      const start = performance.now();
      const typed = await read(">");
      const minutes = Math.max(1 / 60, (performance.now() - start) / 60000);
      let correct = 0;
      for (let i = 0; i < text.length; i++) if (typed[i] === text[i]) correct++;
      const accuracy = Math.round((correct / text.length) * 100);
      const wpm = Math.round(typed.length / 5 / minutes);
      return [
        [seg("WPM      ", "dim"), seg(String(wpm), "accent")],
        [seg("accuracy ", "dim"), seg(`${accuracy}%`, accuracy >= 95 ? "accent" : "error")],
      ];
    },
  },
  guess: {
    group: "games",
    usage: "guess",
    description: "guess the number (1–100)",
    run: async (_, { print, read }) => {
      const secret = 1 + Math.floor(Math.random() * 100);
      print([seg("I picked a number between 1 and 100. You have 7 tries.", "dim")]);
      for (let tryNo = 1; tryNo <= 7; tryNo++) {
        const n = Number.parseInt(await read(`guess ${tryNo}/7>`), 10);
        if (!Number.isFinite(n)) print("That is not a number.");
        else if (n === secret)
          return [[seg(`✓ ${secret}! `, "accent"), seg(`Found in ${tryNo} tries.`, "dim")]];
        else print(n < secret ? "↑ higher" : "↓ lower");
      }
      return [[seg(`Out of tries — it was ${secret}.`, "error")]];
    },
  },
  quest: {
    group: "games",
    usage: "quest",
    description: "tiny text adventure",
    run: (_, ctx) => quest(ctx),
  },
};

// ---------- easter eggs (option `easterEggs`) ----------

const MATRIX_CHARS = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄ0123456789";

export const easterEggCommands: Record<string, CommandDef> = {
  sudo: {
    group: "fun",
    hidden: true,
    usage: "sudo <command>",
    description: "become root",
    run: async (_, { options, read }) => {
      await read(`[sudo] password for ${options.currentUser || options.user}:`);
      return [
        [
          seg(
            `${options.currentUser || options.user} is not in the sudoers file. Nice try.`,
            "error",
          ),
        ],
      ];
    },
  },
  rm: {
    group: "fun",
    hidden: true,
    usage: "rm -rf /",
    description: "remove files",
    run: async (args, { live, sleep }) => {
      if (!args.includes("-rf") || !args.includes("/")) return "rm: missing operand";
      const paths = [
        "/bin",
        "/boot",
        "/etc",
        "/home/guest",
        "/usr/lib",
        "/var/log",
        "/the/internet",
      ];
      const update = live([seg("removing…", "dim")]);
      for (const path of paths) {
        update([seg("removed ", "error"), seg(`'${path}'`, "bright")]);
        await sleep(260);
      }
      update([seg("…just kidding. Nothing was deleted 😉", "accent")]);
    },
  },
  matrix: {
    group: "fun",
    hidden: true,
    usage: "matrix",
    description: "follow the white rabbit",
    run: async (_, { live, sleep }) => {
      const width = 48;
      const rows = 8;
      const frame = () =>
        Array.from({ length: rows }, () =>
          Array.from({ length: width }, () =>
            Math.random() < 0.35
              ? MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]
              : " ",
          ).join(""),
        );
      const update = live({ art: frame(), lines: [] });
      for (let i = 0; i < 30; i++) {
        await sleep(90);
        update({ art: frame(), lines: [] });
      }
      update([seg("Wake up…", "accent")]);
    },
  },
};

// ---------- animations (option `animations`) ----------

export const playCommand: CommandDef = {
  group: "fun",
  usage: "play [name]",
  description: "play an ASCII animation",
  run: async ([name], { options, live, sleep }) => {
    const names = Object.keys(options.animations);
    if (!names.length) return "No animations. Add some with the `animations` option.";
    const pick = name ?? names[0];
    const animation = options.animations[pick];
    if (!animation)
      return [[seg(`play: unknown animation '${pick}'. Try: ${names.join(", ")}`, "error")]];
    const frames = animation.frames.filter((f) => f.length);
    if (!frames.length) return;
    const delay = 1000 / Math.min(30, Math.max(1, animation.fps || 8));
    const loops = Math.max(1, Math.ceil(3000 / (delay * frames.length)));
    const update = live({ art: frames[0], lines: [] });
    for (let i = 1; i < frames.length * loops; i++) {
      await sleep(delay);
      update({ art: frames[i % frames.length], lines: [] });
    }
  },
};

// ---------- boot sequence (option `bootSequence`) ----------

const STATUS_LABEL = { ok: " OK ", fail: "FAIL", warn: "WARN", info: "INFO" } as const;
const STATUS_TONE: Record<keyof typeof STATUS_LABEL, Tone> = {
  ok: "accent",
  fail: "error",
  warn: "bright",
  info: "dim",
};

/** Prints the boot lines with their delays; resolves early when `signal` aborts (skip) */
export async function playBootSequence(
  sequence: TerminalSettings["bootSequence"],
  { print, signal }: { print: (out: Output) => void; signal: AbortSignal },
): Promise<void> {
  const speed = Math.max(0.1, sequence.speed || 1);
  for (const line of sequence.lines) {
    if (signal.aborted) return;
    await new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, (line.delay ?? 120) / speed);
      signal.addEventListener("abort", () => (clearTimeout(timer), resolve()), { once: true });
    });
    if (signal.aborted) return;
    print(
      line.status
        ? [
            seg("[", "dim"),
            seg(STATUS_LABEL[line.status], STATUS_TONE[line.status]),
            seg("] ", "dim"),
            seg(line.text, "bright"),
          ]
        : line.text,
    );
  }
}

// ---------- key sounds (option `sound`) ----------

export interface KeySound {
  play(kind: "key" | "enter"): void;
  close(): void;
}

/** Synthesized clicks (Web Audio, no audio files); created lazily on the first key press */
export function createKeySound(settings: () => TerminalSettings["sound"]): KeySound {
  let audio: AudioContext | null = null;
  return {
    play(kind) {
      const { enabled, volume, profile } = settings();
      if (!enabled || typeof AudioContext === "undefined") return;
      audio ??= new AudioContext();
      const t = audio.currentTime;
      const gain = audio.createGain();
      const peak = Math.min(1, Math.max(0, volume)) * (kind === "enter" ? 0.5 : 0.3);
      gain.gain.setValueAtTime(peak, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + (profile === "soft" ? 0.08 : 0.05));
      gain.connect(audio.destination);
      if (profile === "retro") {
        const osc = audio.createOscillator();
        osc.type = "square";
        osc.frequency.value = kind === "enter" ? 440 : 880 + Math.random() * 120;
        osc.connect(gain);
        osc.start(t);
        osc.stop(t + 0.05);
        return;
      }
      // Short noise burst through a band-pass filter = a key click
      const length = Math.floor(audio.sampleRate * 0.04);
      const buffer = audio.createBuffer(1, length, audio.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3;
      const noise = audio.createBufferSource();
      noise.buffer = buffer;
      const filter = audio.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value =
        (profile === "soft" ? 1800 : 3200) * (kind === "enter" ? 0.6 : 0.9 + Math.random() * 0.2);
      noise.connect(filter).connect(gain);
      noise.start(t);
    },
    close() {
      void audio?.close();
      audio = null;
    },
  };
}

// ---------- engine ----------

/** Built-ins + enabled extras + user commands (user commands win) */
export function availableCommands(options: TerminalSettings): Record<string, CommandDef> {
  return {
    ...builtinCommands,
    ...(options.games ? gameCommands : {}),
    ...(options.easterEggs ? easterEggCommands : {}),
    play: playCommand,
    ...toCommandDefs(options.commands),
  };
}

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
  read: (prompt?: string) => Promise<string>;
  readKey: () => Promise<string>;
  live: (out: Output) => (next: Output) => void;
}

/** Runs one command line; outputs go through env.print */
export async function executeLine(line: string, env: ExecuteEnv): Promise<void> {
  const [name, ...args] = parseArgs(line.trim());
  if (!name) return;
  const commands = availableCommands(env.options);
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
  const commands = Object.fromEntries(
    Object.entries(availableCommands(options)).filter(([, def]) => !def.hidden),
  );
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
