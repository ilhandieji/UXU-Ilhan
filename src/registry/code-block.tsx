"use client";

import { CodeBlock } from "@lib/code-block/react/CodeBlock";
import {
  defaults,
  sizes,
  themes,
  variants,
  type CodeBlockOptions,
  type CodeBlockThemeName,
} from "@lib/code-block/react/code-block.config";
import { createCodeBlock } from "@lib/code-block/vanilla/code-block";
import { hasKey, setValue } from "@/lib/customize-config";
import { codeBlockMeta } from "./code-block.meta";
import type { Control, RegistryEntry, StudioState } from "./types";

/** Demo snippet per language (the language select swaps the sample) */
const SAMPLES: Record<string, { ext: string; code: string }> = {
  ts: {
    ext: "ts",
    code: `import { createServer } from "node:http";

// Typed greeting with a default
type Greeting = { name: string; times?: number };

export function greet({ name, times = 1 }: Greeting): string {
  return Array.from({ length: times }, () => \`Hello, \${name}!\`).join(" ");
}

const PORT = Number(process.env.PORT ?? 3000);

createServer((req, res) => {
  res.writeHead(200, { "content-type": "text/plain" });
  res.end(greet({ name: req.url?.slice(1) || "world", times: 2 }));
}).listen(PORT);`,
  },
  tsx: {
    ext: "tsx",
    code: `"use client";
import { useState } from "react";

export function Counter({ start = 0 }: { start?: number }) {
  const [count, setCount] = useState(start);
  return (
    <button className="btn" onClick={() => setCount((c) => c + 1)}>
      Clicked {count} times
    </button>
  );
}`,
  },
  json: {
    ext: "json",
    code: `{
  "name": "ilhan-ui",
  "private": true,
  "version": "0.1.0",
  "scripts": { "dev": "next dev", "build": "next build" },
  "keywords": ["components", "tailwind"],
  "license": null
}`,
  },
  css: {
    ext: "css",
    code: `/* Card component */
@media (min-width: 640px) {
  .card:hover > .title {
    color: #58a6ff;
    padding: 0.5rem 1rem !important;
    background: var(--surface, rgb(0 0 0 / 0.4));
  }
}`,
  },
  bash: {
    ext: "sh",
    code: `# Install and start the playground
pnpm install
NODE_ENV=development pnpm dev --port 3000

for f in components/*; do
  echo "component: $f" | tr a-z A-Z
done`,
  },
  html: {
    ext: "html",
    code: `<!doctype html>
<html lang="en">
  <body>
    <!-- Mount point -->
    <div id="app" class="min-h-screen">Loading &hellip;</div>
    <script type="module">
      const app = document.querySelector("#app");
    </script>
  </body>
</html>`,
  },
  text: {
    ext: "txt",
    code: `Plain text is shown without highlighting.
Line numbers, wrapping and copy still work.`,
  },
};

const DEMO_TITLE = "example.ts";
const COLOR_TOKENS = [
  ["bg", "Background"],
  ["fg", "Text"],
  ["header-bg", "Header"],
  ["border", "Border"],
  ["line-highlight", "Line highlight"],
  ["keyword", "Keyword"],
  ["string", "String"],
  ["function", "Function"],
  ["type", "Type"],
  ["number", "Number"],
  ["comment", "Comment"],
  ["tag", "Tag"],
  ["property", "Property"],
] as const;

const initialOptions = {
  language: "ts",
  title: DEMO_TITLE,
  showLineNumbers: defaults.showLineNumbers,
  highlightLines: "3-4",
  wrap: defaults.wrap,
  copy: defaults.copy,
  copyLabel: defaults.copyLabel,
  copiedLabel: defaults.copiedLabel,
  windowControls: defaults.windowControls,
  showLanguage: defaults.showLanguage,
  theme: defaults.theme as string,
  variant: defaults.variant as string,
  size: defaults.size as string,
};

const baseName = (state: StudioState) =>
  (String(state.options.theme) in themes
    ? state.options.theme
    : defaults.theme) as CodeBlockThemeName;

/** Slider value "0px" means no height limit */
const toMaxHeight = (value: string | undefined) =>
  !value || Number.parseFloat(value) <= 0 ? "none" : value;

function toOptions(state: StudioState): CodeBlockOptions {
  const o = state.options;
  const language = String(o.language);
  const sample = SAMPLES[language] ?? SAMPLES.ts;
  const { maxHeight, ...tokens } = state.tokens;
  const title = String(o.title);
  return {
    code: sample.code,
    language,
    // The demo file name follows the language until the user edits it
    title: title === DEMO_TITLE ? `example.${sample.ext}` : title,
    showLineNumbers: Boolean(o.showLineNumbers),
    highlightLines: String(o.highlightLines),
    wrap: Boolean(o.wrap),
    copy: Boolean(o.copy),
    copyLabel: String(o.copyLabel),
    copiedLabel: String(o.copiedLabel),
    windowControls: Boolean(o.windowControls),
    showLanguage: Boolean(o.showLanguage),
    maxHeight: toMaxHeight(maxHeight),
    theme: { ...themes[baseName(state)], ...tokens },
    variant: o.variant as CodeBlockOptions["variant"],
    size: o.size as CodeBlockOptions["size"],
  };
}

const select = (key: string, label: string, values: string[]): Control => ({
  type: "select",
  target: "option",
  key,
  label,
  choices: values.map((value) => ({ label: value, value })),
});
const toggle = (key: string, label: string): Control => ({
  type: "switch",
  target: "option",
  key,
  label,
});
const text = (key: string, label: string): Control => ({
  type: "text",
  target: "option",
  key,
  label,
});

const FRAME = "mx-auto flex w-full max-w-2xl items-center p-4 sm:p-8";

export const codeBlock: RegistryEntry = {
  ...codeBlockMeta,
  themeKey: "theme",
  presets: [
    {
      name: "Vampire window",
      options: {
        theme: "vampire",
        variant: "window",
        title: "App.tsx",
        language: "tsx",
        highlightLines: "5",
      },
    },
    {
      name: "Docs (paper)",
      options: { theme: "paper", showLineNumbers: false, highlightLines: "" },
    },
    {
      name: "Terminal script",
      options: {
        theme: "terminal",
        variant: "window",
        language: "bash",
        title: "setup.sh",
        highlightLines: "3",
      },
    },
    {
      name: "Minimal snippet",
      options: { variant: "minimal", language: "css", highlightLines: "" },
    },
    { name: "Scroll + wrap", options: { wrap: true, size: "sm" }, tokens: { maxHeight: "200px" } },
  ],
  randomizeSkip: [
    "title",
    "highlightLines",
    "copyLabel",
    "copiedLabel",
    "language",
    "copy",
    "maxHeight",
  ],
  palette: (p) => ({
    bg: p.bg,
    fg: p.fg,
    "header-bg": p.bg,
    border: p.muted,
    keyword: p.accent,
    function: p.accent,
    comment: p.muted,
  }),
  contrastPairs: {
    fg: "bg",
    keyword: "bg",
    string: "bg",
    function: "bg",
    type: "bg",
    number: "bg",
    comment: "bg",
    tag: "bg",
    property: "bg",
  },
  controls: [
    {
      title: "Content",
      controls: [
        select("language", "Language (sample)", Object.keys(SAMPLES)),
        text("title", "Title"),
        text("highlightLines", "Highlight lines"),
        text("copyLabel", "Copy label"),
        text("copiedLabel", "Copied label"),
      ],
    },
    {
      title: "Features",
      controls: [
        toggle("showLineNumbers", "Line numbers"),
        toggle("wrap", "Soft wrap"),
        toggle("copy", "Copy button"),
        toggle("windowControls", "Window dots"),
        toggle("showLanguage", "Language badge"),
      ],
    },
    {
      title: "Theme & Colors",
      controls: [
        select("theme", "Preset", Object.keys(themes)),
        ...COLOR_TOKENS.map(([key, label]): Control => ({
          type: "color",
          target: "token",
          key,
          label,
        })),
      ],
    },
    {
      title: "Frame",
      controls: [
        select("variant", "Variant", Object.keys(variants)),
        select("size", "Size", Object.keys(sizes)),
        {
          type: "slider",
          target: "token",
          key: "radius",
          label: "Radius",
          min: 0,
          max: 24,
          step: 1,
          unit: "px",
        },
        {
          type: "slider",
          target: "token",
          key: "maxHeight",
          label: "Max height (0 = none)",
          min: 0,
          max: 600,
          step: 20,
          unit: "px",
        },
      ],
    },
  ],
  initialState: () => ({ options: { ...initialOptions }, tokens: {} }),
  baseline: (state) => ({
    ...themes[baseName(state)],
    ...sizes[state.options.size as keyof typeof sizes],
    maxHeight: "0px",
  }),
  Preview: ({ state }) => (
    <div className={FRAME}>
      <CodeBlock {...toOptions(state)} />
    </div>
  ),
  mountVanilla(el, state) {
    const frame = document.createElement("div");
    frame.className = FRAME;
    el.append(frame);
    const inst = createCodeBlock(frame, toOptions(state));
    return {
      update: (next) => inst.update(toOptions(next)),
      destroy() {
        inst.destroy();
        frame.remove();
      },
    };
  },
  customize(source, state) {
    const base = baseName(state);
    const size = String(state.options.size);
    let out = source;
    for (const [key, value] of Object.entries(state.options)) {
      if (initialOptions[key as keyof typeof initialOptions] !== value)
        out = setValue(out, ["defaults"], key, value);
    }
    for (const [key, value] of Object.entries(state.tokens)) {
      if (key === "maxHeight") {
        out = setValue(out, ["defaults"], key, toMaxHeight(value));
        continue;
      }
      out = setValue(
        out,
        hasKey(out, ["sizes", size], key) ? ["sizes", size] : ["themes", base],
        key,
        value,
      );
    }
    return out;
  },
  usage: (framework) =>
    framework === "react"
      ? `import { CodeBlock } from "./CodeBlock";

const code = \`export const sum = (a: number, b: number) => a + b;\`;

export default function Docs() {
  return <CodeBlock code={code} language="ts" title="sum.ts" highlightLines="1" />;
}`
      : `import { createCodeBlock } from "./code-block";

const block = createCodeBlock(document.querySelector("#snippet")!, {
  code: "pnpm add -D tailwindcss",
  language: "bash",
  title: "install.sh",
});
block.update({ theme: "vampire", variant: "window" });`,
};
