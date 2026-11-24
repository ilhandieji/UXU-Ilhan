"use client";

import { forwardRef, useEffect, useRef, type Ref } from "react";
import { FpsMeter } from "@/components/fps-meter";
import type { Viewport } from "@/lib/url-state";
import type { Framework, RegistryEntry, StudioState, VanillaHandle } from "@/registry/types";

const VIEWPORT_WIDTH: Record<Viewport, string> = {
  full: "w-full",
  tablet: "w-full max-w-[768px]",
  mobile: "w-full max-w-[375px]",
};

function VanillaPreview({ entry, state }: { entry: RegistryEntry; state: StudioState }) {
  const host = useRef<HTMLDivElement>(null);
  const handle = useRef<VanillaHandle | null>(null);
  const latest = useRef(state);
  latest.current = state;

  useEffect(() => {
    if (!host.current) return;
    handle.current = entry.mountVanilla(host.current, latest.current);
    return () => {
      handle.current?.destroy();
      handle.current = null;
    };
  }, [entry]);

  // update() keeps the component's own state (history, output) while the look changes
  useEffect(() => handle.current?.update(state), [state]);

  return <div ref={host} className="w-full" />;
}

type FrameProps = {
  entry: RegistryEntry;
  framework: Framework;
  state: StudioState;
  viewport: Viewport;
  fps: boolean;
};

/** The ref points at the visible frame (used to crop preview recordings) */
export const PreviewFrame = forwardRef(function PreviewFrame(
  { entry, framework, state, viewport, fps }: FrameProps,
  ref: Ref<HTMLDivElement>,
) {
  const Preview = entry.Preview;
  return (
    <div
      ref={ref}
      className="relative flex min-h-[32rem] items-center justify-center overflow-hidden rounded-xl border bg-sidebar/70 bg-[radial-gradient(circle,var(--color-input)_1px,transparent_1px)] bg-size-[24px_24px] p-4 sm:p-8"
    >
      {fps ? <FpsMeter /> : null}
      <div
        className={`${VIEWPORT_WIDTH[viewport]} ${viewport === "full" ? "" : "rounded-md outline outline-dashed outline-border outline-offset-8"}`}
      >
        {framework === "react" ? (
          <Preview state={state} />
        ) : (
          <VanillaPreview entry={entry} state={state} />
        )}
      </div>
    </div>
  );
});
