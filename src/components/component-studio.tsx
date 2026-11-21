"use client";

import { Link2, RotateCcw } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CodeView } from "@/components/code-view";
import { CustomizePanel } from "@/components/customize-panel";
import { PreviewFrame } from "@/components/preview-frame";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { getEntry } from "@/registry";
import { decodeStudio, encodeStudio, replaceQuery, type StudioTab } from "@/lib/url-state";
import type { Framework, OptionValue, StudioState } from "@/registry/types";

/** Delay before the URL follows the state, so dragging a slider doesn't flood history updates */
const URL_DEBOUNCE_MS = 150;

type Props = { slug: string; sources: Record<Framework, Record<string, string>> };

export function ComponentStudio({ slug, sources }: Props) {
  const entry = getEntry(slug);
  if (!entry) throw new Error(`Unknown component: ${slug}`);

  // The URL is the source of truth on load (refresh / reopened tab / shared link)
  const params = useSearchParams();
  const [fromUrl] = useState(() => decodeStudio(entry, new URLSearchParams(params.toString())));
  const [framework, setFramework] = useState<Framework>(fromUrl.framework);
  const [tab, setTab] = useState<StudioTab>(fromUrl.tab);
  const [state, setState] = useState<StudioState>(fromUrl.state);
  const [previewKey, setPreviewKey] = useState(0);

  useEffect(() => {
    const timer = setTimeout(
      () => replaceQuery(encodeStudio(entry, { state, framework, tab })),
      URL_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [entry, state, framework, tab]);

  const setOption = (key: string, value: OptionValue) =>
    setState((prev) => ({
      // A new base theme starts from its own colors
      tokens: key === entry.themeKey ? {} : prev.tokens,
      options: { ...prev.options, [key]: value },
    }));
  const setToken = (key: string, value: string) =>
    setState((prev) => ({ ...prev, tokens: { ...prev.tokens, [key]: value } }));

  const reset = () => {
    setState(entry.initialState());
    setPreviewKey((k) => k + 1);
  };

  const copyLink = async () => {
    replaceQuery(encodeStudio(entry, { state, framework, tab }));
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied", { description: "It opens this component with your settings." });
    } catch {
      toast.error("Could not copy the link");
    }
  };

  const files = useMemo(() => {
    const raw = sources[framework];
    return Object.entries(raw).map(([name, code]) => ({
      name,
      code: name === entry.configFile ? entry.customize(code, state) : code,
    }));
  }, [entry, framework, sources, state]);

  return (
    <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <Tabs value={tab} onValueChange={(value) => setTab(value as StudioTab)} className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              value={framework}
              onValueChange={(value) => value && setFramework(value as Framework)}
              aria-label="Framework"
            >
              <ToggleGroupItem value="react">React</ToggleGroupItem>
              <ToggleGroupItem value="vanilla">Vanilla</ToggleGroupItem>
            </ToggleGroup>
            <Button variant="outline" size="sm" onClick={copyLink}>
              <Link2 aria-hidden />
              Copy link
            </Button>
            <Button variant="outline" size="sm" onClick={reset}>
              <RotateCcw aria-hidden />
              Reset
            </Button>
          </div>
        </div>
        <TabsContent value="preview" className="mt-4">
          <PreviewFrame
            key={`${framework}-${previewKey}`}
            entry={entry}
            framework={framework}
            state={state}
          />
        </TabsContent>
        <TabsContent value="code" className="mt-4">
          <CodeView
            files={files}
            usage={entry.usage(framework)}
            requirements={entry.requirements}
          />
        </TabsContent>
      </Tabs>

      <CustomizePanel entry={entry} state={state} onOption={setOption} onToken={setToken} />
    </div>
  );
}
