import type { ComponentMeta } from "./types";

export const commandPaletteMeta: ComponentMeta = {
  slug: "command-palette",
  name: "Command Palette",
  description:
    "A Ctrl/⌘+K launcher with fuzzy search, highlighted matches, groups, shortcuts and full keyboard and ARIA combobox support, as a modal dialog or inline.",
  files: {
    react: ["CommandPalette.tsx", "command-palette.config.ts"],
    vanilla: ["command-palette.ts", "command-palette.config.ts"],
  },
  configFile: "command-palette.config.ts",
  requirements: [
    "Tailwind CSS v4.",
    "React version: react 19.3+ (latest stable: 19.3.1).",
    "React version uses react-dom's createPortal for the dialog (part of every React DOM app).",
  ],
};
