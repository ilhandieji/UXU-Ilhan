import type { ComponentMeta } from "./types";

export const codeBlockMeta: ComponentMeta = {
  slug: "code-block",
  name: "Code Block",
  description:
    "Syntax-highlighted code with a built-in dependency-free tokenizer (TS/JS/JSX, JSON, CSS, Bash, HTML), line numbers, highlighted lines, soft wrap and a copy button.",
  files: {
    react: ["CodeBlock.tsx", "code-block.config.ts", "code-block.highlight.ts"],
    vanilla: ["code-block.ts", "code-block.config.ts", "code-block.highlight.ts"],
  },
  configFile: "code-block.config.ts",
  requirements: ["Tailwind CSS v4.", "React version: react 19.3+ (latest stable: 19.3.1)."],
};
