"use client";

import {
  Activity,
  Dices,
  ImageIcon,
  Monitor,
  Palette,
  Smartphone,
  Sparkles,
  Tablet,
} from "lucide-react";
import { useRef, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { paletteFromFile } from "@/lib/palette-from-image";
import { presetState, randomizeState } from "@/lib/randomize";
import { SITE_PALETTES } from "@/lib/site-palettes";
import type { Viewport } from "@/lib/url-state";
import type { RegistryEntry, SitePalette, StudioState } from "@/registry/types";

type Props = {
  entry: RegistryEntry;
  viewport: Viewport;
  onViewport: (viewport: Viewport) => void;
  fps: boolean;
  onFps: (on: boolean) => void;
  /** Replaces the whole state (preset, randomize) */
  onState: (state: StudioState) => void;
  /** Merges palette tokens into the current overrides */
  onPalette: (palette: SitePalette) => void;
  /** Extra items at the end of the toolbar (recording, …) */
  children?: ReactNode;
};

function Dot({ color }: { color: string }) {
  return (
    <span className="size-3 rounded-full border border-white/15" style={{ background: color }} />
  );
}

export function StudioToolbar({
  entry,
  viewport,
  onViewport,
  fps,
  onFps,
  onState,
  onPalette,
  children,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const onImage = async (file: File | undefined) => {
    if (!file) return;
    const palette = await paletteFromFile(file);
    if (!palette) return toast.error("Could not read colors from that image");
    onPalette(palette);
    toast.success("Palette applied", { description: `Colors taken from ${palette.name}` });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          void onImage(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value={viewport}
        onValueChange={(value) => value && onViewport(value as Viewport)}
        aria-label="Preview width"
      >
        <ToggleGroupItem value="full" aria-label="Full width">
          <Monitor aria-hidden />
        </ToggleGroupItem>
        <ToggleGroupItem value="tablet" aria-label="Tablet (768px)">
          <Tablet aria-hidden />
        </ToggleGroupItem>
        <ToggleGroupItem value="mobile" aria-label="Mobile (375px)">
          <Smartphone aria-hidden />
        </ToggleGroupItem>
      </ToggleGroup>

      {entry.presets?.length ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Sparkles aria-hidden />
              Presets
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {entry.presets.map((preset) => (
              <DropdownMenuItem
                key={preset.name}
                onSelect={() => onState(presetState(entry, preset))}
              >
                {preset.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

      {entry.palette ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Palette aria-hidden />
              Palette
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Apply a site palette</DropdownMenuLabel>
            {SITE_PALETTES.map((palette) => (
              <DropdownMenuItem key={palette.name} onSelect={() => onPalette(palette)}>
                <span className="flex gap-1">
                  <Dot color={palette.bg} />
                  <Dot color={palette.fg} />
                  <Dot color={palette.accent} />
                  <Dot color={palette.muted} />
                </span>
                {palette.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => fileRef.current?.click()}>
              <ImageIcon aria-hidden />
              From an image…
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

      <Button variant="outline" size="sm" onClick={() => onState(randomizeState(entry))}>
        <Dices aria-hidden />
        Randomize
      </Button>

      <Toggle
        variant="outline"
        size="sm"
        pressed={fps}
        onPressedChange={onFps}
        aria-label="FPS meter"
      >
        <Activity aria-hidden />
        FPS
      </Toggle>

      {children}
    </div>
  );
}
