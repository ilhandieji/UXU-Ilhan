"use client";

import { ChevronDown, Copy, Download, PencilLine, TerminalSquare } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { download, toAnsi, toHtml, toJson, toPng, toShell, toText } from "@/lib/ascii/export";
import type { Grid } from "@/lib/ascii/grid";

type Props = {
  grid: Grid;
  foreground: string;
  background: string;
  onEditInDraw?: () => void;
  onSendToTerminal: () => void;
};

async function copy(label: string, text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  } catch {
    toast.error("Clipboard is not available");
  }
}

function MenuItem({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
    >
      {children}
    </button>
  );
}

export function ExportBar({ grid, foreground, background, onEditInDraw, onSendToTerminal }: Props) {
  const colors = { foreground, background };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" onClick={() => copy("Text", toText(grid))}>
        <Copy aria-hidden />
        Copy text
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button size="sm" variant="outline">
            More copy
            <ChevronDown aria-hidden />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-56 p-1">
          <MenuItem onClick={() => copy("JSON lines", toJson(grid))}>
            JSON lines (Terminal banner)
          </MenuItem>
          <MenuItem onClick={() => copy("Shell command", toShell(grid))}>
            Shell command (printf, truecolor)
          </MenuItem>
          <MenuItem onClick={() => copy("Shell command", toShell(grid, "256"))}>
            Shell command (256 colors)
          </MenuItem>
          <MenuItem onClick={() => copy("HTML", toHtml(grid, colors))}>HTML &lt;pre&gt;</MenuItem>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button size="sm" variant="outline">
            <Download aria-hidden />
            Download
            <ChevronDown aria-hidden />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-56 p-1">
          <MenuItem onClick={() => download("ascii.txt", toText(grid))}>Text (.txt)</MenuItem>
          <MenuItem onClick={() => download("ascii.ans", toAnsi(grid), "text/plain;charset=utf-8")}>
            ANSI art (.ans)
          </MenuItem>
          <MenuItem
            onClick={() => download("ascii.html", toHtml(grid, colors), "text/html;charset=utf-8")}
          >
            HTML (.html)
          </MenuItem>
          <MenuItem
            onClick={async () => {
              try {
                download("ascii.png", await toPng(grid, colors));
              } catch {
                toast.error("PNG export failed");
              }
            }}
          >
            Image (.png)
          </MenuItem>
        </PopoverContent>
      </Popover>

      {onEditInDraw ? (
        <Button size="sm" variant="outline" onClick={onEditInDraw}>
          <PencilLine aria-hidden />
          Edit in Draw
        </Button>
      ) : null}
      <Button
        size="sm"
        variant="outline"
        onClick={onSendToTerminal}
        title="Uses the art as the Terminal banner (plain text, colors are dropped)"
      >
        <TerminalSquare aria-hidden />
        Send to Terminal
      </Button>
      <span className="ml-auto font-mono text-xs text-muted-foreground">
        {grid.width} × {grid.height}
      </span>
    </div>
  );
}
