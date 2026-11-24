import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { BrandMark, BrandPill } from "@/components/brand";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <>
      <PageHeader trail={["404"]} />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <BrandMark size={260} animated title="UXU-Ilhan mark" className="h-auto w-full max-w-64" />
        <p className="mt-10 font-mono text-xs tracking-[0.2em] text-brand">404 / ROUTE NOT FOUND</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance">
          The rails don&apos;t cross here.
        </h1>
        <p className="mt-6 rounded-lg border border-border bg-sidebar px-4 py-2 font-mono text-sm text-muted-foreground">
          <span className="text-brand">guest@portal</span>:~$ cd this-page
          <br />
          <span className="text-destructive">cd: no such page</span>
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <Link href="/">
              <ArrowLeft aria-hidden />
              Back home
            </Link>
          </Button>
          <BrandPill>PRESS CTRL K TO SEARCH</BrandPill>
        </div>
      </main>
    </>
  );
}
