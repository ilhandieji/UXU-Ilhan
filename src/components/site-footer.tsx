"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/brand";
import { components } from "@/registry/meta";

const PALETTE = [
  { name: "Dark UI", hex: "#101412" },
  { name: "Off-white", hex: "#F0F4F1" },
  { name: "Brand green", hex: "#3BDF89" },
  { name: "Muted text", hex: "#A2AEA7" },
];

const BRAND_FILES = [
  { label: "Symbol (SVG)", href: "/brand/uxu-ilhan-icon.svg" },
  { label: "Logo (SVG)", href: "/brand/uxu-ilhan-logo.svg" },
  { label: "Identity sheet", href: "/brand/uxu-ilhan-brand-reference.svg" },
];

const LINK =
  "rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

function Column({ title, children }: { title: string; children: ReactNode }) {
  return (
    <nav aria-label={title} className="space-y-3">
      <h2 className="font-mono text-[11px] tracking-[0.16em] text-brand uppercase">{title}</h2>
      <ul className="space-y-2">{children}</ul>
    </nav>
  );
}

async function copyHex(hex: string) {
  try {
    await navigator.clipboard.writeText(hex);
    toast.success(`${hex} copied`);
  } catch {
    toast.error("Clipboard is not available");
  }
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-sidebar/60">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="space-y-6">
          <BrandLogo markSize={48} tagline />
          <div className="space-y-2">
            <p className="font-mono text-[11px] tracking-[0.16em] text-subtle">PROJECT PALETTE</p>
            <ul className="flex flex-wrap gap-2">
              {PALETTE.map(({ name, hex }) => (
                <li key={hex}>
                  <button
                    type="button"
                    onClick={() => copyHex(hex)}
                    title={`${name} — copy ${hex}`}
                    aria-label={`Copy ${name} ${hex}`}
                    className="group flex items-center gap-2 rounded-md border border-border px-2 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:border-brand-edge hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <span
                      className="size-3.5 rounded-sm border border-white/15"
                      style={{ background: hex }}
                      aria-hidden
                    />
                    {hex}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Column title="Components">
          {components.map((c) => (
            <li key={c.slug}>
              <Link href={`/components/${c.slug}`} className={LINK}>
                {c.name}
              </Link>
            </li>
          ))}
        </Column>

        <Column title="Tools">
          <li>
            <Link href="/ascii" className={LINK}>
              ASCII Editor
            </Link>
          </li>
          <li>
            <Link href="/" className={LINK}>
              Introduction
            </Link>
          </li>
        </Column>

        <Column title="Brand">
          {BRAND_FILES.map(({ label, href }) => (
            <li key={href}>
              <a href={href} download className={LINK}>
                {label}
              </a>
            </li>
          ))}
        </Column>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-6 py-4 font-mono text-[11px] tracking-[0.14em] text-subtle">
          <span>UXU-ILHAN · PERSONAL BUILD · {new Date().getFullYear()}</span>
          <span>REACT · VANILLA · TAILWIND V4</span>
        </div>
      </div>
    </footer>
  );
}
