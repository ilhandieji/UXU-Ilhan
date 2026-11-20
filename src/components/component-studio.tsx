"use client";

import { RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { CodeView } from "@/components/code-view";
import { CustomizePanel } from "@/components/customize-panel";
import { PreviewFrame } from "@/components/preview-frame";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { getEntry } from "@/registry";
import type { Framework, OptionValue, StudioState } from "@/registry/types";

type Props = { slug: string; sources: Record<Framework, Record<string, string>> };

export function ComponentStudio({ slug, sources }: Props) {
  const entry = getEntry(slug);
  if (!entry) throw new Error(`Unknown component: ${slug}`);

  const [framework, setFramework] = useState<Framework>("react");
  const [state, setState] = useState<StudioState>(entry.initialState);
  const [previewKey, setPreviewKey] = useState(0);

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

  const files = useMemo(() => {
    const raw = sources[framework];
    return Object.entries(raw).map(([name, code]) => ({
      name,
      code: name === entry.configFile ? entry.customize(code, state) : code,
    }));
  }, [entry, framework, sources, state]);

  return (
    <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <Tabs defaultValue="preview" className="min-w-0">
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
