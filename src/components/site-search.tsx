"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  CommandPalette,
  type CommandPaletteProps,
} from "@lib/command-palette/react/CommandPalette";
import type { CommandPaletteItem } from "@lib/command-palette/react/command-palette.config";
import { Button } from "@/components/ui/button";
import { presetState } from "@/lib/randomize";
import { encodeStudio } from "@/lib/url-state";
import { registry } from "@/registry";

/** The library's palette, themed with the site's own colors */
const SITE_THEME: CommandPaletteProps["theme"] = {
  bg: "var(--popover)",
  fg: "var(--popover-foreground)",
  muted: "var(--muted-foreground)",
  accent: "var(--accent)",
  "accent-fg": "var(--accent-foreground)",
  border: "var(--border)",
  highlight: "var(--brand)",
  "font-family": "var(--font-geist), system-ui, sans-serif",
};

function searchItems(): CommandPaletteItem[] {
  const components = registry.map((entry) => ({
    id: `c:${entry.slug}`,
    label: entry.name,
    group: "Components",
    icon: "◆",
    keywords: [entry.slug, ...entry.description.toLowerCase().split(/\W+/).slice(0, 12)],
    href: `/components/${entry.slug}`,
  }));
  const presets = registry.flatMap((entry) =>
    (entry.presets ?? []).map((preset) => {
      const query = encodeStudio(entry, {
        state: presetState(entry, preset),
        framework: "react",
        tab: "preview",
        viewport: "full",
      });
      return {
        id: `p:${entry.slug}:${preset.name}`,
        label: `${entry.name} — ${preset.name}`,
        group: "Presets",
        icon: "✦",
        keywords: ["preset", entry.slug],
        href: `/components/${entry.slug}${query ? `?${query}` : ""}`,
      };
    }),
  );
  return [
    { id: "home", label: "Introduction", group: "Pages", icon: "⌂", href: "/" },
    {
      id: "ascii",
      label: "ASCII Editor",
      group: "Tools",
      icon: "A",
      keywords: ["figlet", "qr", "image", "draw", "animate", "gif"],
      href: "/ascii",
    },
    ...components,
    ...presets,
  ];
}

/** Global Ctrl/⌘+K search, built on the library's Command Palette */
export function SiteSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const items = useMemo(searchItems, []);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="ml-auto gap-2 text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Search aria-hidden />
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden rounded border px-1 font-mono text-[10px] sm:inline">Ctrl K</kbd>
      </Button>
      <CommandPalette
        items={items}
        open={open}
        onOpenChange={setOpen}
        onSelect={(item) => {
          if (item.href) router.push(item.href);
        }}
        placeholder="Search components, presets, tools…"
        emptyText="Nothing found."
        theme={SITE_THEME}
        labels={{ title: "Search the site" }}
      />
    </>
  );
}
