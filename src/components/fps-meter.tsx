"use client";

import { useEffect, useState } from "react";

/** Frames per second of the page (sampled every 500 ms) — shows how heavy a preview is */
export function FpsMeter() {
  const [fps, setFps] = useState(0);

  useEffect(() => {
    let frames = 0;
    let last = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      frames++;
      if (now - last >= 500) {
        setFps(Math.round((frames * 1000) / (now - last)));
        frames = 0;
        last = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const tone = fps >= 55 ? "text-emerald-400" : fps >= 30 ? "text-amber-400" : "text-red-400";
  return (
    <div
      role="status"
      aria-label={`${fps} frames per second`}
      className={`pointer-events-none absolute top-2 left-2 z-70 rounded-md border bg-background/80 px-2 py-0.5 font-mono text-xs tabular-nums backdrop-blur ${tone}`}
    >
      {fps} fps
    </div>
  );
}
