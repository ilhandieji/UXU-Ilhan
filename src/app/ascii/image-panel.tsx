"use client";

import { Camera, CameraOff, ImageUp, Aperture } from "lucide-react";
import { useEffect, useRef, useState, type DragEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ImageOptions } from "@/lib/ascii/image";
import { options, Row, SelectRow, SliderRow, SwitchRow } from "./controls";
import { CHARSETS, COLOR_MODES, DITHERS } from "./editor-state";

export interface ImageSource {
  el: HTMLImageElement | HTMLVideoElement;
  width: number;
  height: number;
  name: string;
  /** Webcam stream: re-converted continuously */
  live: boolean;
}

type Props = {
  image: ImageOptions;
  updateImage: (patch: Partial<ImageOptions>) => void;
  source: ImageSource | null;
  setSource: (source: ImageSource | null) => void;
};

const CHARSET_LABELS: Record<(typeof CHARSETS)[number], string> = {
  standard: "Standard ramp",
  detailed: "Detailed (70)",
  blocks: "Blocks ░▒▓█",
  braille: "Braille ⣿ (bits)",
  binary: "Binary 01",
  halfblock: "Color pixels ▀",
  custom: "Custom",
};
const COLOR_LABELS: Record<(typeof COLOR_MODES)[number], string> = {
  mono: "Mono",
  ansi16: "ANSI 16",
  ansi256: "xterm 256",
  truecolor: "Truecolor",
};
const DITHER_LABELS: Record<(typeof DITHERS)[number], string> = {
  none: "None",
  floyd: "Floyd–Steinberg",
  bayer: "Bayer 4×4",
};

function loadImage(file: Blob, name: string): Promise<ImageSource> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () =>
      resolve({ el: img, width: img.naturalWidth, height: img.naturalHeight, name, live: false });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Not a readable image"));
    };
    img.src = url;
  });
}

export function ImagePanel({ image, updateImage, source, setSource }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [dragging, setDragging] = useState(false);

  const useFile = async (file: File | Blob | null | undefined, name = "pasted image") => {
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    try {
      stopCamera();
      setSource(await loadImage(file, file instanceof File ? file.name : name));
    } catch {
      toast.error("This image could not be read");
    }
  };

  // Paste an image from the clipboard while this panel is open
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items ?? []).find((i) =>
        i.type.startsWith("image/"),
      );
      if (item) void useFile(item.getAsFile());
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  });

  const stopCamera = () => {
    stream?.getTracks().forEach((track) => track.stop());
    setStream(null);
  };

  // Release the camera when leaving the tab/page
  useEffect(() => () => stream?.getTracks().forEach((track) => track.stop()), [stream]);

  const startCamera = async () => {
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: false,
      });
      setStream(media);
      const el = video.current;
      if (!el) return;
      el.srcObject = media;
      await el.play();
      setSource({
        el,
        width: el.videoWidth || 1280,
        height: el.videoHeight || 720,
        name: "camera",
        live: true,
      });
    } catch {
      toast.error("Camera unavailable", {
        description: "Allow camera access in the browser and try again.",
      });
    }
  };

  /** Freezes the current camera frame into a still image */
  const capture = () => {
    const el = video.current;
    if (!el || !el.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = el.videoWidth;
    canvas.height = el.videoHeight;
    canvas.getContext("2d")?.drawImage(el, 0, 0);
    canvas.toBlob((blob) => blob && void useFile(blob, "camera capture"), "image/png");
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    void useFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex flex-col items-center gap-2 rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground transition-colors ${dragging ? "border-brand bg-brand/5" : ""}`}
      >
        <ImageUp className="size-5" aria-hidden />
        <p>{source && !source.live ? source.name : "Drop an image, paste it (Ctrl+V), or"}</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button size="sm" variant="outline" onClick={() => fileInput.current?.click()}>
            Choose image
          </Button>
          {stream ? (
            <>
              <Button size="sm" onClick={capture}>
                <Aperture aria-hidden />
                Capture
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  stopCamera();
                  setSource(null);
                }}
              >
                <CameraOff aria-hidden />
                Stop
              </Button>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={startCamera}>
              <Camera aria-hidden />
              Camera
            </Button>
          )}
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void useFile(e.target.files?.[0])}
        />
        {/* Kept in the DOM (tiny) so the stream keeps playing; the ASCII preview is the real view */}
        <video
          ref={video}
          muted
          playsInline
          className={stream ? "mt-1 h-16 rounded-md" : "hidden"}
          aria-label="Camera preview"
        />
        {stream ? <p className="text-[11px]">Live — the preview converts every frame.</p> : null}
      </div>

      <SliderRow
        id="img-cols"
        label="Width"
        value={image.columns}
        min={8}
        max={300}
        step={2}
        unit=" col"
        onChange={(columns) => updateImage({ columns })}
      />
      <SelectRow
        id="img-charset"
        label="Characters"
        value={image.charset}
        choices={options(CHARSETS, CHARSET_LABELS)}
        onChange={(charset) => updateImage({ charset })}
        wide
      />
      {image.charset === "custom" ? (
        <Row label="Ramp (light → dense)" htmlFor="img-custom">
          <Input
            id="img-custom"
            value={image.custom}
            onChange={(e) => updateImage({ custom: e.target.value })}
            className="h-8 w-40 font-mono text-xs"
            spellCheck={false}
          />
        </Row>
      ) : null}
      <SelectRow
        id="img-color"
        label="Color"
        value={image.color}
        choices={options(COLOR_MODES, COLOR_LABELS)}
        onChange={(color) => updateImage({ color })}
      />
      <SelectRow
        id="img-dither"
        label="Dithering"
        value={image.dither}
        choices={options(DITHERS, DITHER_LABELS)}
        onChange={(dither) => updateImage({ dither })}
        wide
      />
      <SwitchRow
        id="img-invert"
        label="Invert"
        checked={image.invert}
        onChange={(invert) => updateImage({ invert })}
      />
      <SliderRow
        id="img-brightness"
        label="Brightness"
        value={image.brightness}
        min={-1}
        max={1}
        step={0.05}
        onChange={(brightness) => updateImage({ brightness })}
      />
      <SliderRow
        id="img-contrast"
        label="Contrast"
        value={image.contrast}
        min={0}
        max={3}
        step={0.05}
        onChange={(contrast) => updateImage({ contrast })}
      />
      <SliderRow
        id="img-gamma"
        label="Gamma"
        value={image.gamma}
        min={0.2}
        max={3}
        step={0.05}
        onChange={(gamma) => updateImage({ gamma })}
      />
      <SliderRow
        id="img-aspect"
        label="Character aspect"
        value={image.charAspect}
        min={0.3}
        max={1}
        step={0.05}
        onChange={(charAspect) => updateImage({ charAspect })}
      />
    </div>
  );
}
