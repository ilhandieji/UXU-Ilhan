"use client";

import {
  Brush,
  Eraser,
  PaintBucket,
  Pipette,
  RectangleHorizontal,
  Redo2,
  Slash,
  Trash2,
  Type,
  Undo2,
  X,
} from "lucide-react";
import { useState } from "react";
import { ColorPicker } from "@/components/color-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Row, SwitchRow } from "./controls";

export type Tool = "pencil" | "eraser" | "fill" | "line" | "rect" | "text" | "picker";

export interface Brush {
  ch: string;
  fg: string;
  bg: string;
  /** false = leave the cell's default text color */
  useFg: boolean;
  /** false = transparent background */
  useBg: boolean;
  filledRect: boolean;
}

const TOOLS: { value: Tool; label: string; icon: typeof Brush; key: string }[] = [
  { value: "pencil", label: "Pencil", icon: Brush, key: "B" },
  { value: "eraser", label: "Eraser", icon: Eraser, key: "E" },
  { value: "fill", label: "Fill", icon: PaintBucket, key: "G" },
  { value: "line", label: "Line", icon: Slash, key: "L" },
  { value: "rect", label: "Rectangle", icon: RectangleHorizontal, key: "R" },
  { value: "text", label: "Text", icon: Type, key: "T" },
  { value: "picker", label: "Pick cell", icon: Pipette, key: "I" },
];

export const TOOL_KEYS: Record<string, Tool> = Object.fromEntries(
  TOOLS.map((t) => [t.key.toLowerCase(), t.value]),
);

const PALETTE: Record<string, string> = {
  Blocks: "█▓▒░▀▄▌▐▖▗▘▝▚▞▙▛▜▟■□▪▫▮▯",
  Box: "─│┌┐└┘├┤┬┴┼═║╔╗╚╝╠╣╦╩╬╭╮╯╰╱╲╳┄┆",
  Shapes: "●○◆◇★☆♥♦♣♠▲▼◀▶◢◣◤◥•◦◉◎⬤",
  Braille: "⠁⠃⠇⡇⣇⣧⣷⣿⠿⠛⠉⣀⣤⣶⠶⠒⠤⡠⢄⣠",
  ASCII: "#@%&*+=-:.~^\"'`|/\\_()[]{}<>!?$o0O",
};

type Props = {
  tool: Tool;
  setTool: (tool: Tool) => void;
  brush: Brush;
  setBrush: (patch: Partial<Brush>) => void;
  width: number;
  height: number;
  onResize: (width: number, height: number) => void;
  onClear: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
};

export function DrawPanel({
  tool,
  setTool,
  brush,
  setBrush,
  width,
  height,
  onResize,
  onClear,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: Props) {
  const [group, setGroup] = useState("Blocks");
  const [size, setSize] = useState({ width: String(width), height: String(height) });

  return (
    <div className="space-y-4">
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value={tool}
        onValueChange={(value) => value && setTool(value as Tool)}
        aria-label="Drawing tool"
        className="flex-wrap"
      >
        {TOOLS.map(({ value, label, icon: Icon, key }) => (
          <ToggleGroupItem
            key={value}
            value={value}
            aria-label={`${label} (${key})`}
            title={`${label} (${key})`}
          >
            <Icon aria-hidden />
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Undo (Ctrl+Z)"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 aria-hidden />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onRedo}
          disabled={!canRedo}
          aria-label="Redo (Ctrl+Y)"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 aria-hidden />
        </Button>
        <Button size="sm" variant="outline" onClick={onClear} className="ml-auto">
          <Trash2 aria-hidden />
          Clear
        </Button>
      </div>

      <section className="space-y-2">
        <Row label="Character" htmlFor="brush-char">
          <Input
            id="brush-char"
            value={brush.ch}
            maxLength={2}
            onChange={(e) => {
              const ch = Array.from(e.target.value).pop();
              if (ch) setBrush({ ch });
            }}
            className="h-8 w-14 text-center font-mono"
          />
        </Row>
        <div className="flex flex-wrap gap-1">
          {Object.keys(PALETTE).map((name) => (
            <Button
              key={name}
              size="sm"
              variant={group === name ? "secondary" : "ghost"}
              className="h-6 px-2 text-xs"
              onClick={() => setGroup(name)}
            >
              {name}
            </Button>
          ))}
        </div>
        <div className="grid grid-cols-10 gap-1">
          {Array.from(PALETTE[group]).map((ch) => (
            <button
              key={ch}
              type="button"
              onClick={() => setBrush({ ch })}
              aria-label={`Character ${ch}`}
              aria-pressed={brush.ch === ch}
              className="grid aspect-square place-items-center rounded-sm border font-mono text-sm hover:bg-accent aria-pressed:border-brand aria-pressed:bg-brand/10"
            >
              {ch}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <SwitchRow
          id="brush-use-fg"
          label="Text color"
          checked={brush.useFg}
          onChange={(useFg) => setBrush({ useFg })}
        />
        {brush.useFg ? (
          <Row label="Foreground">
            <ColorPicker
              label="Brush foreground"
              value={brush.fg}
              onChange={(fg) => setBrush({ fg })}
            />
          </Row>
        ) : null}
        <SwitchRow
          id="brush-use-bg"
          label="Background color"
          checked={brush.useBg}
          onChange={(useBg) => setBrush({ useBg })}
        />
        {brush.useBg ? (
          <Row label="Background">
            <ColorPicker
              label="Brush background"
              value={brush.bg}
              onChange={(bg) => setBrush({ bg })}
            />
          </Row>
        ) : null}
        {tool === "rect" ? (
          <SwitchRow
            id="brush-filled"
            label="Filled rectangle"
            checked={brush.filledRect}
            onChange={(filledRect) => setBrush({ filledRect })}
          />
        ) : null}
      </section>

      <section className="space-y-2">
        <h4 className="text-xs text-muted-foreground">Canvas size (columns × rows)</h4>
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            onResize(Number(size.width) || width, Number(size.height) || height);
          }}
        >
          <Input
            aria-label="Columns"
            type="number"
            min={1}
            max={400}
            value={size.width}
            onChange={(e) => setSize((s) => ({ ...s, width: e.target.value }))}
            className="h-8 w-20"
          />
          <X className="size-3 text-muted-foreground" aria-hidden />
          <Input
            aria-label="Rows"
            type="number"
            min={1}
            max={400}
            value={size.height}
            onChange={(e) => setSize((s) => ({ ...s, height: e.target.value }))}
            className="h-8 w-20"
          />
          <Button size="sm" variant="outline" type="submit">
            Apply
          </Button>
        </form>
      </section>
      <p className="text-[11px] text-muted-foreground">
        Text tool: click a cell, then type. Enter = next line, Esc = stop. Shortcuts: B E G L R T I.
      </p>
    </div>
  );
}
