import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { AsciiEditor } from "./ascii-editor";

export const metadata: Metadata = {
  title: "ASCII Editor",
  description: "Turn text, images and camera frames into ASCII art, then draw on it and export.",
};

export default function AsciiPage() {
  return (
    <>
      <PageHeader trail={["Tools", "ASCII Editor"]} />
      <main className="w-full px-4 py-8 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight">ASCII Editor</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Text with FIGlet fonts, images and live camera in blocks, braille or color pixels, and a
          grid to draw on. Export as text, ANSI, HTML or PNG, or send it to the Terminal banner.
        </p>
        {/* useSearchParams (settings in the URL) needs a Suspense boundary on a static page */}
        <Suspense
          fallback={<div className="mt-8 h-[32rem] animate-pulse rounded-lg border bg-card" />}
        >
          <AsciiEditor />
        </Suspense>
      </main>
    </>
  );
}
