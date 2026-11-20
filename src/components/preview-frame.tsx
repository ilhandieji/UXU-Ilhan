'use client';

import { useEffect, useRef } from 'react';
import type { Framework, RegistryEntry, StudioState, VanillaHandle } from '@/registry/types';

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

export function PreviewFrame({ entry, framework, state }: { entry: RegistryEntry; framework: Framework; state: StudioState }) {
  const Preview = entry.Preview;
  return (
    <div className="flex min-h-[32rem] items-center justify-center overflow-hidden rounded-lg border bg-[radial-gradient(circle,var(--color-border)_1px,transparent_1px)] bg-size-[20px_20px] p-4 sm:p-8">
      <div className="w-full max-w-4xl">{framework === 'react' ? <Preview state={state} /> : <VanillaPreview entry={entry} state={state} />}</div>
    </div>
  );
}
