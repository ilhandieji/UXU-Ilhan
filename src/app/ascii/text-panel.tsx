"use client";

import { X } from "lucide-react";
import { ColorPicker } from "@/components/color-picker";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ALL_FONTS, CORE_FONTS } from "@/lib/ascii/fonts";
import { QR_LEVELS } from "@/lib/ascii/qr";
import { options, Row, SelectRow, SliderRow, SwitchRow } from "./controls";
import { ALIGNS, LAYOUTS, TEXT_MODES, type EditorSettings } from "./editor-state";

type Props = {
  settings: EditorSettings;
  update: (patch: Partial<EditorSettings>) => void;
};

const fontChoices = ALL_FONTS.map((font) => ({
  value: font,
  label: CORE_FONTS.includes(font) ? font : `${font} ·`,
}));

export function TextPanel({ settings, update }: Props) {
  const qr = settings.textMode === "qr";
  return (
    <div className="space-y-4">
      <SelectRow
        id="ascii-text-mode"
        label="Render as"
        value={settings.textMode}
        choices={options(TEXT_MODES, { figlet: "ASCII font", qr: "QR code" })}
        onChange={(textMode) => update({ textMode })}
      />
      <div className="space-y-1.5">
        <Label htmlFor="ascii-text" className="text-xs font-normal text-muted-foreground">
          {qr ? "Text or link to encode" : "Text (one block per line)"}
        </Label>
        <textarea
          id="ascii-text"
          value={settings.text}
          onChange={(e) => update({ text: e.target.value })}
          rows={3}
          spellCheck={false}
          className="w-full resize-y rounded-md border bg-transparent px-3 py-2 font-mono text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
      </div>
      {qr ? (
        <>
          <SelectRow
            id="ascii-qr-level"
            label="Error correction"
            value={settings.qrLevel}
            choices={options(QR_LEVELS, { L: "L (7%)", M: "M (15%)", Q: "Q (25%)", H: "H (30%)" })}
            onChange={(qrLevel) => update({ qrLevel })}
          />
          <SwitchRow
            id="ascii-qr-invert"
            label="Light modules (dark background)"
            checked={settings.qrInvert}
            onChange={(qrInvert) => update({ qrInvert })}
          />
          <p className="-mt-2 text-[11px] text-muted-foreground">
            Turn it off when the art is shown on a light background.
          </p>
        </>
      ) : (
        <>
          <SelectRow
            id="ascii-font"
            label="Font"
            value={settings.font}
            choices={fontChoices}
            onChange={(font) => update({ font })}
            wide
          />
          <p className="-mt-2 text-[11px] text-muted-foreground">Fonts marked · load on demand.</p>
          <SelectRow
            id="ascii-layout"
            label="Letter spacing"
            value={settings.layout}
            choices={options(LAYOUTS)}
            onChange={(layout) => update({ layout })}
          />
          <SelectRow
            id="ascii-align"
            label="Align"
            value={settings.align}
            choices={options(ALIGNS)}
            onChange={(align) => update({ align })}
          />
          <SliderRow
            id="ascii-wrap"
            label="Wrap at (0 = off)"
            value={settings.wrap}
            min={0}
            max={200}
            step={5}
            unit=" col"
            onChange={(wrap) => update({ wrap })}
          />
        </>
      )}
      <Row label="Text color">
        <div className="flex items-center gap-2">
          {settings.textColor ? (
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label="Remove text color"
              onClick={() => update({ textColor: "" })}
            >
              <X aria-hidden />
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">default</span>
          )}
          <ColorPicker
            label="Text color"
            value={settings.textColor || settings.foreground}
            onChange={(textColor) => update({ textColor })}
          />
        </div>
      </Row>
    </div>
  );
}
