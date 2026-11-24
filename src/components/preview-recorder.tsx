"use client";

import { Circle, Square, Video } from "lucide-react";
import { useEffect, useRef, useState, type RefObject } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { download } from "@/lib/ascii/export";
import { encodeGif, type GifFrame } from "@/lib/gif";

type Format = "gif" | "webm";

const MAX_SECONDS = 10;
const GIF_FPS = 15;
const WEBM_FPS = 30;
/** Output width cap (GIF size grows fast) */
const MAX_WIDTH: Record<Format, number> = { gif: 640, webm: 1280 };

/**
 * Where the page sits inside the captured video. A captured tab is the viewport itself; a captured
 * window includes the browser's toolbars (Firefox can only share windows), so it is offset by them.
 */
function viewportInVideo(video: HTMLVideoElement, surface: string | undefined) {
  if (surface === "browser") return { scale: video.videoWidth / window.innerWidth, x: 0, y: 0 };
  const scale = video.videoWidth / window.outerWidth;
  return {
    scale,
    x: ((window.outerWidth - window.innerWidth) / 2) * scale,
    y: (window.outerHeight - window.innerHeight) * scale,
  };
}

type DisplayOptions = DisplayMediaStreamOptions & { preferCurrentTab?: boolean };

/** Experimental: screen-captures the browser and crops the video to the preview frame */
export function PreviewRecorder({
  target,
  name,
}: {
  target: RefObject<HTMLElement | null>;
  name: string;
}) {
  const [recording, setRecording] = useState<Format | null>(null);
  const [seconds, setSeconds] = useState(0);
  const stopRef = useRef<() => void>(() => {});

  useEffect(() => () => stopRef.current(), []);

  async function start(format: Format) {
    const el = target.current;
    if (!el || !navigator.mediaDevices?.getDisplayMedia) {
      toast.error("Screen capture is not available in this browser");
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: WEBM_FPS },
        audio: false,
        preferCurrentTab: true,
      } as DisplayOptions);
    } catch {
      return; // The user cancelled the share dialog
    }
    const track = stream.getVideoTracks()[0];
    const surface = track.getSettings().displaySurface;
    if (surface === "monitor")
      toast.warning("A whole screen was shared; the crop may be off. Share this tab or window.");

    const video = document.createElement("video");
    video.muted = true;
    video.srcObject = stream;
    await video.play();

    const rect = el.getBoundingClientRect();
    const width = Math.min(MAX_WIDTH[format], Math.round(rect.width));
    const height = Math.round((rect.height / rect.width) * width);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: format === "gif" });
    if (!ctx) return;

    const frames: GifFrame[] = [];
    const chunks: Blob[] = [];
    const recorder =
      format === "webm"
        ? new MediaRecorder(canvas.captureStream(WEBM_FPS), { mimeType: "video/webm" })
        : null;
    recorder?.addEventListener("dataavailable", (e) => chunks.push(e.data));

    const draw = () => {
      // Re-read the rect so scrolling during the recording keeps the crop on the frame
      const box = el.getBoundingClientRect();
      const { scale, x, y } = viewportInVideo(video, surface);
      ctx.drawImage(
        video,
        x + box.left * scale,
        y + box.top * scale,
        box.width * scale,
        box.height * scale,
        0,
        0,
        width,
        height,
      );
      if (format === "gif")
        frames.push({ ...ctx.getImageData(0, 0, width, height), width, height });
    };

    const fps = format === "gif" ? GIF_FPS : WEBM_FPS;
    const frameTimer = setInterval(draw, 1000 / fps);
    const startedAt = performance.now();
    const clock = setInterval(() => {
      const elapsed = (performance.now() - startedAt) / 1000;
      setSeconds(Math.floor(elapsed));
      if (elapsed >= MAX_SECONDS) stopRef.current();
    }, 250);
    recorder?.start();
    setRecording(format);
    setSeconds(0);

    let stopped = false;
    const stop = () => {
      if (stopped) return;
      stopped = true;
      clearInterval(frameTimer);
      clearInterval(clock);
      stream.getTracks().forEach((t) => t.stop());
      setRecording(null);
      if (recorder) {
        recorder.addEventListener("stop", () =>
          download(`${name}.webm`, new Blob(chunks, { type: "video/webm" })),
        );
        recorder.stop();
      } else if (frames.length) {
        toast.message("Encoding GIF…");
        // Let the toast paint before the (synchronous) encode
        setTimeout(() => download(`${name}.gif`, encodeGif(frames, 1000 / GIF_FPS)), 50);
      }
    };
    stopRef.current = stop;
    // The browser's own "Stop sharing" button ends the track
    track.addEventListener("ended", stop);
  }

  if (recording)
    return (
      <Button variant="destructive" size="sm" onClick={() => stopRef.current()}>
        <Square aria-hidden />
        Stop {seconds}s / {MAX_SECONDS}s
      </Button>
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Video aria-hidden />
          Record
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Up to {MAX_SECONDS}s · experimental</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => start("gif")}>
          <Circle aria-hidden />
          Record GIF
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => start("webm")}>
          <Circle aria-hidden />
          Record WebM video
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
