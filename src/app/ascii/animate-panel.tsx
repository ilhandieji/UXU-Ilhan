"use client";

import {
  ArrowLeft,
  ArrowRight,
  Copy,
  Download,
  Pause,
  Play,
  Plus,
  TerminalSquare,
  Trash2,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { SliderRow, SwitchRow } from "./controls";
import { MAX_FRAMES } from "./editor-state";

type Props = {
  count: number;
  index: number;
  onSelect: (index: number) => void;
  onAdd: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMove: (delta: -1 | 1) => void;
  fps: number;
  onFps: (fps: number) => void;
  onion: boolean;
  onOnion: (on: boolean) => void;
  playing: boolean;
  onPlay: () => void;
  onExportGif: () => void;
  onCopyJson: () => void;
  onSendToTerminal: () => void;
  /** Drawing tools for the current frame */
  children: ReactNode;
};

export function AnimatePanel(props: Props) {
  const { count, index, playing } = props;
  return (
    <div className="space-y-4">
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium tracking-wider text-foreground/80 uppercase">
            Frames
          </h3>
          <span className="font-mono text-xs text-muted-foreground">
            {index + 1} / {count}
          </span>
        </div>
        <div role="listbox" aria-label="Frames" className="flex flex-wrap gap-1.5">
          {Array.from({ length: count }, (_, i) => (
            <button
              key={i}
              type="button"
              role="option"
              aria-selected={i === index}
              onClick={() => props.onSelect(i)}
              className="size-8 rounded-md border font-mono text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none aria-selected:border-brand aria-selected:bg-brand/15 aria-selected:text-foreground"
            >
              {i + 1}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" variant="outline" onClick={props.onAdd} disabled={count >= MAX_FRAMES}>
            <Plus aria-hidden />
            New
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={props.onDuplicate}
            disabled={count >= MAX_FRAMES}
          >
            <Copy aria-hidden />
            Duplicate
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="size-8"
            aria-label="Move frame left"
            onClick={() => props.onMove(-1)}
            disabled={index === 0}
          >
            <ArrowLeft aria-hidden />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="size-8"
            aria-label="Move frame right"
            onClick={() => props.onMove(1)}
            disabled={index === count - 1}
          >
            <ArrowRight aria-hidden />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="size-8"
            aria-label="Delete frame"
            onClick={props.onDelete}
            disabled={count <= 1}
          >
            <Trash2 aria-hidden />
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <Button className="w-full" onClick={props.onPlay} disabled={count < 2}>
          {playing ? <Pause aria-hidden /> : <Play aria-hidden />}
          {playing ? "Stop" : "Play"}
        </Button>
        <SliderRow
          id="anim-fps"
          label="Speed"
          value={props.fps}
          min={1}
          max={30}
          step={1}
          unit=" fps"
          onChange={props.onFps}
        />
        <SwitchRow
          id="anim-onion"
          label="Onion skin (previous frame)"
          checked={props.onion}
          onChange={props.onOnion}
        />
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" variant="outline" onClick={props.onExportGif}>
            <Download aria-hidden />
            GIF
          </Button>
          <Button size="sm" variant="outline" onClick={props.onCopyJson}>
            <Copy aria-hidden />
            JSON frames
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={props.onSendToTerminal}
            title="Adds the animation to the Terminal; run `play` there"
          >
            <TerminalSquare aria-hidden />
            Send to Terminal
          </Button>
        </div>
      </section>

      <section className="space-y-2 border-t pt-4">
        <h3 className="text-xs font-medium tracking-wider text-foreground/80 uppercase">
          Draw on this frame
        </h3>
        {props.children}
      </section>
    </div>
  );
}
