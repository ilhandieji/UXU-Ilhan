// UXU-Ilhan brand: the mark (two U channels, crossed rails, live cursor node, orbit trace), the
// wordmark and small brand pieces. Paths come from public/brand/uxu-ilhan-icon.svg; colors come from
// the site tokens so the mark follows the theme. Site-only: library components never use this file.
import type { ReactNode } from "react";

type MarkProps = {
  /** Width in px (height follows the 300:158 ratio) */
  size?: number;
  /** Pulsing node + moving orbit (only when the user allows motion) */
  animated?: boolean;
  /** Accessible name; without it the mark is decorative */
  title?: string;
  className?: string;
};

export function BrandMark({ size = 32, animated = false, title, className }: MarkProps) {
  const a11y = title ? { role: "img" as const } : { "aria-hidden": true as const };
  return (
    <svg
      viewBox="60 14 300 158"
      width={size}
      height={(size * 158) / 300}
      className={className}
      {...a11y}
    >
      {title ? <title>{title}</title> : null}
      {/* The two U channels: UX and UI, mirrored around the shared center */}
      <g
        fill="none"
        strokeWidth={19}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-foreground"
      >
        <path d="M 74 28 V 113 C 74 141 91 158 119 158 H 145 C 173 158 190 141 190 113 V 28" />
        <path d="M 230 28 V 113 C 230 141 247 158 275 158 H 301 C 329 158 346 141 346 113 V 28" />
      </g>
      {/* Crossing rails: the green route stands for the second implementation */}
      <path
        d="M 168 59 L 252 133"
        strokeWidth={17}
        strokeLinecap="round"
        className="stroke-foreground"
      />
      <path
        d="M 252 59 L 168 133"
        strokeWidth={17}
        strokeLinecap="round"
        className="stroke-brand"
      />
      {/* Live interaction point / cursor node */}
      <circle cx={210} cy={96} r={19} strokeWidth={5} className="fill-background stroke-brand" />
      <circle
        cx={210}
        cy={96}
        r={5}
        className={`fill-brand origin-[210px_96px] ${animated ? "motion-safe:animate-uxu-pulse" : ""}`}
      />
      {/* Orbit trace, a nod to the orbit and glow components */}
      <path
        d="M 172 96 A 38 19 0 0 1 248 96"
        fill="none"
        strokeWidth={2.5}
        strokeDasharray="3 8"
        opacity={0.75}
        className={`stroke-brand ${animated ? "motion-safe:animate-uxu-orbit" : ""}`}
      />
    </svg>
  );
}

const WORDMARK = {
  sm: { uxu: "text-base tracking-[-0.04em]", ilhan: "text-[0.7rem] tracking-[0.18em]", bar: "h-4" },
  lg: {
    uxu: "text-6xl tracking-[-0.06em] sm:text-8xl",
    ilhan: "text-2xl tracking-[0.15em] sm:text-4xl",
    bar: "h-14 sm:h-20",
  },
} as const;

/** UX + green U | ILHAN */
export function BrandWordmark({ size = "sm" }: { size?: keyof typeof WORDMARK }) {
  const s = WORDMARK[size];
  return (
    <span className="inline-flex items-center gap-3 sm:gap-5" aria-label="UXU Ilhan">
      <span aria-hidden className={`font-bold leading-none ${s.uxu}`}>
        UX
        <span className="bg-linear-to-br from-brand-soft to-brand bg-clip-text text-transparent">
          U
        </span>
      </span>
      <span aria-hidden className={`w-px bg-subtle ${s.bar}`} />
      <span aria-hidden className={`font-semibold leading-none ${s.ilhan}`}>
        ILHAN
      </span>
    </span>
  );
}

/** Mark + wordmark, optionally with the two tagline lines */
export function BrandLogo({
  markSize = 40,
  animated = false,
  tagline = false,
}: {
  markSize?: number;
  animated?: boolean;
  tagline?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <BrandMark size={markSize} animated={animated} />
        <BrandWordmark />
      </div>
      {tagline ? (
        <div className="space-y-1">
          <p className="text-xs tracking-[0.2em] text-muted-foreground">
            USER EXPERIENCE × USER INTERFACE
          </p>
          <p className="font-mono text-[11px] tracking-[0.15em] text-subtle">
            COMPONENT PLAYGROUND · REACT / VANILLA
          </p>
        </div>
      ) : null}
    </div>
  );
}

/** Green pill badge, e.g. "UX ↔ UI BRIDGE" */
export function BrandPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-brand-edge bg-brand-surface px-4 py-1.5 font-mono text-xs tracking-[0.14em] text-brand">
      {children}
    </span>
  );
}

/** Green mono section label, e.g. "01 / THE MARK" */
export function BrandEyebrow({ children }: { children: ReactNode }) {
  return <p className="font-mono text-xs tracking-[0.15em] text-brand uppercase">{children}</p>;
}
