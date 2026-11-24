import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { BrandEyebrow, BrandMark, BrandPill, BrandWordmark } from "@/components/brand";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { components } from "@/registry/meta";

const CARD =
  "group flex h-full flex-col rounded-2xl border border-border bg-card/90 p-6 transition-colors duration-200 hover:border-brand-edge focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

function MeaningCard({
  eyebrow,
  title,
  text,
  children,
}: {
  eyebrow: string;
  title: string;
  text: string;
  children: ReactNode;
}) {
  return (
    <li className="flex flex-col gap-6 rounded-2xl border border-border bg-card/90 p-6">
      <BrandEyebrow>{eyebrow}</BrandEyebrow>
      <div className="flex min-h-28 flex-1 items-center justify-center">{children}</div>
      <div>
        <h3 className="font-semibold text-balance">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{text}</p>
      </div>
    </li>
  );
}

function Arrow() {
  return <ArrowRight className="size-5 shrink-0 text-brand" aria-hidden />;
}

function ImplBox({ name, lang }: { name: string; lang: string }) {
  return (
    <div className="flex w-28 flex-col items-center rounded-xl border border-input bg-sidebar px-3 py-4">
      <span className="text-lg font-semibold">{name}</span>
      <span className="mt-1 font-mono text-[10px] tracking-wider text-subtle">{lang}</span>
    </div>
  );
}

/** Tiny UI sketches for the Preview → Customize → Copy flow */
function FlowStep({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex h-14 w-20 flex-col justify-center gap-1.5 rounded-lg border border-input bg-sidebar px-3">
        {children}
      </div>
      <span className="font-mono text-[10px] tracking-wider text-muted-foreground">{label}</span>
    </div>
  );
}
const bar = (width: string, tone: string) => (
  <span className={`block h-1.5 rounded-full ${width} ${tone}`} aria-hidden />
);

function LinkCard({ href, title, text }: { href: string; title: string; text: string }) {
  return (
    <Link href={href} className={CARD}>
      <span className="flex items-center justify-between font-medium">
        {title}
        <ArrowRight
          className="size-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-brand"
          aria-hidden
        />
      </span>
      <span className="mt-1 text-sm text-muted-foreground">{text}</span>
    </Link>
  );
}

export default function Home() {
  return (
    <>
      <PageHeader trail={["Introduction"]} />
      <main className="mx-auto w-full max-w-6xl px-6 py-10 sm:py-14">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-6 font-mono text-xs tracking-[0.2em]">
          <span className="flex items-center gap-3">
            <span className="size-2.5 rounded-full bg-brand" aria-hidden />
            UXU—ILHAN / COMPONENT LIBRARY
          </span>
          <span className="text-muted-foreground">PERSONAL COMPONENT SYSTEM</span>
        </div>

        {/* Hero: mark + wordmark lockup from the identity sheet */}
        <section className="grid items-center gap-10 py-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)] lg:py-16">
          <div className="flex justify-center lg:justify-start">
            <BrandMark
              size={420}
              animated
              title="UXU-Ilhan mark"
              className="h-auto w-full max-w-md"
            />
          </div>
          <div>
            <h1>
              <BrandWordmark size="lg" />
            </h1>
            <p className="mt-6 text-sm tracking-[0.22em] text-muted-foreground sm:text-base">
              USER EXPERIENCE × USER INTERFACE
            </p>
            <p className="mt-3 font-mono text-xs tracking-[0.18em] text-subtle">
              COMPONENT PLAYGROUND / REACT + VANILLA
            </p>
            <p className="mt-6 max-w-xl text-pretty text-muted-foreground">
              A personal library of copy-paste components, each written twice — React and plain
              TypeScript — styled only with Tailwind v4 and tuned live before you take the files.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <BrandPill>UX ↔ UI BRIDGE</BrandPill>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild>
                <Link href={`/components/${components[0]?.slug ?? ""}`}>
                  Browse components
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/ascii">ASCII Editor</Link>
              </Button>
              <span className="font-mono text-xs text-muted-foreground">
                or press <kbd className="rounded border border-border px-1.5 py-0.5">Ctrl K</kbd>
              </span>
            </div>
          </div>
        </section>

        {/* Three meaning cards */}
        <ol className="grid gap-5 border-t border-border pt-10 md:grid-cols-3">
          <MeaningCard
            eyebrow="01 / The mark"
            title="Two U channels. One crossing point."
            text="Experience and interface meet in one live interaction."
          >
            <div className="flex w-full justify-center rounded-xl border border-input bg-sidebar px-6 py-5">
              <BrandMark size={180} />
            </div>
          </MeaningCard>
          <MeaningCard
            eyebrow="02 / Two implementations"
            title="One idea. Two independent implementations."
            text="React TSX and Vanilla TypeScript stay standalone."
          >
            <div className="flex items-center gap-3">
              <ImplBox name="React" lang="TSX" />
              <Arrow />
              <ImplBox name="Vanilla" lang="TYPESCRIPT" />
            </div>
          </MeaningCard>
          <MeaningCard
            eyebrow="03 / Playground flow"
            title="See it. Tune it. Take the files."
            text="Live preview → config regeneration → copy-paste."
          >
            <div className="flex items-start gap-2">
              <FlowStep label="PREVIEW">
                {bar("w-full", "bg-muted-foreground/70")}
                {bar("w-2/3", "bg-input")}
                {bar("w-5/6", "bg-brand")}
              </FlowStep>
              <span className="mt-5">
                <Arrow />
              </span>
              <FlowStep label="CUSTOMIZE">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-brand" aria-hidden />
                  {bar("w-full", "bg-muted-foreground/70")}
                </span>
                {bar("w-full", "bg-input")}
              </FlowStep>
              <span className="mt-5">
                <Arrow />
              </span>
              <FlowStep label="COPY">
                {bar("w-full", "bg-muted-foreground")}
                {bar("w-5/6", "bg-muted-foreground")}
                {bar("w-2/3", "bg-muted-foreground")}
              </FlowStep>
            </div>
          </MeaningCard>
        </ol>

        <section className="mt-16" aria-labelledby="components-title">
          <BrandEyebrow>{`${components.length} components`}</BrandEyebrow>
          <h2 id="components-title" className="mt-2 text-2xl font-semibold tracking-tight">
            Components
          </h2>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {components.map((c) => (
              <li key={c.slug}>
                <LinkCard href={`/components/${c.slug}`} title={c.name} text={c.description} />
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-16" aria-labelledby="tools-title">
          <BrandEyebrow>Playground tools</BrandEyebrow>
          <h2 id="tools-title" className="mt-2 text-2xl font-semibold tracking-tight">
            Tools
          </h2>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <li>
              <LinkCard
                href="/ascii"
                title="ASCII Editor"
                text="Text, QR codes, images and camera to ASCII, a grid to draw on, frame animation and exports."
              />
            </li>
          </ul>
        </section>
      </main>
    </>
  );
}
