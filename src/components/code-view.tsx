"use client";

import { Check, Columns2, Copy, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { openInStackBlitz } from "@/lib/stackblitz";
import type { Framework } from "@/registry/types";

type File = { name: string; code: string };
export type CodeSet = { framework: Framework; files: File[]; usage: string };

const FRAMEWORK_LABEL: Record<Framework, string> = { react: "React", vanilla: "Vanilla" };

/** Highlights with shiki (loaded lazily, debounced while the user types in the panel) */
function Highlighted({ code, lang }: { code: string; lang: string }) {
  const [html, setHtml] = useState("");

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      const { codeToHtml } = await import("shiki");
      const out = await codeToHtml(code, { lang, theme: "github-dark-default" });
      if (!cancelled) setHtml(out);
    }, 120);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [code, lang]);

  if (!html)
    return (
      <pre className="p-4 font-mono text-xs leading-relaxed text-muted-foreground">{code}</pre>
    );
  // shiki escapes the source; the code comes from this repository and the user's own panel values
  return (
    <div
      className="text-xs leading-relaxed [&_pre]:bg-transparent! [&_pre]:p-4"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label={`Copy ${label}`}
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success(`Copied ${label}`);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

/** File tabs + highlighted source for one framework */
function FilePane({ set, label }: { set: CodeSet; label?: string }) {
  const tabs = [...set.files, { name: "Usage", code: set.usage }];
  const [active, setActive] = useState(set.files[0]?.name ?? "Usage");
  const current = tabs.find((t) => t.name === active) ?? tabs[0];

  return (
    <div className="min-w-0 overflow-hidden rounded-lg border bg-sidebar">
      <div className="flex items-center justify-between gap-2 border-b bg-card px-2">
        <div
          role="tablist"
          aria-label={`${label ?? ""} files`}
          className="flex min-w-0 overflow-x-auto"
        >
          {label ? (
            <span className="shrink-0 self-center px-2 text-xs font-medium text-brand">
              {label}
            </span>
          ) : null}
          {tabs.map((t) => (
            <button
              key={t.name}
              role="tab"
              aria-selected={t.name === current.name}
              onClick={() => setActive(t.name)}
              className="shrink-0 cursor-pointer border-b-2 border-transparent px-3 py-2.5 font-mono text-xs text-muted-foreground transition-colors duration-150 hover:text-foreground aria-selected:border-brand aria-selected:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {t.name}
            </button>
          ))}
        </div>
        <CopyButton text={current.code} label={current.name} />
      </div>
      <div className="max-h-[36rem] overflow-auto">
        <Highlighted
          code={current.code}
          lang={current.name === "Usage" || current.name.endsWith("x") ? "tsx" : "ts"}
        />
      </div>
    </div>
  );
}

export function CodeView({
  title,
  current,
  other,
  requirements,
}: {
  title: string;
  current: CodeSet;
  /** The other framework, shown side by side in Compare mode */
  other: CodeSet;
  requirements: string[];
}) {
  const [compare, setCompare] = useState(false);
  // React always on the left so the columns don't swap when the framework toggle changes
  const pair = current.framework === "react" ? [current, other] : [other, current];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Toggle variant="outline" size="sm" pressed={compare} onPressedChange={setCompare}>
          <Columns2 aria-hidden />
          Compare React / Vanilla
        </Toggle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => openInStackBlitz(title, current.framework, current.files, current.usage)}
        >
          <Zap aria-hidden />
          Open in StackBlitz
        </Button>
      </div>

      {compare ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {pair.map((set) => (
            <FilePane key={set.framework} set={set} label={FRAMEWORK_LABEL[set.framework]} />
          ))}
        </div>
      ) : (
        <FilePane key={current.framework} set={current} />
      )}

      <section>
        <h2 className="text-sm font-medium">Requirements</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {requirements.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted-foreground">
          Copy every file above into one folder of your project; they import each other by relative
          path.
        </p>
      </section>
    </div>
  );
}
