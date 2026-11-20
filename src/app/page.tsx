import { ArrowRight, Copy, SlidersHorizontal, TerminalSquare } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { components } from '@/registry/meta';

const steps = [
  { icon: TerminalSquare, title: 'Pick a component', text: 'Every component ships as a React and a Vanilla version.' },
  { icon: SlidersHorizontal, title: 'Customize it', text: 'Colors, fonts, frame and text update the live preview.' },
  { icon: Copy, title: 'Copy the files', text: 'The config file is regenerated with your values. No extra props.' },
];

export default function Home() {
  return (
    <>
      <PageHeader trail={['Introduction']} />
      <main className="mx-auto w-full max-w-5xl px-6 py-12">
        <p className="font-mono text-sm text-brand">UXU-Ilhan</p>
        <h1 className="mt-2 text-balance text-4xl font-semibold tracking-tight">Copy-paste components you can tune first.</h1>
        <p className="mt-4 max-w-2xl text-pretty text-muted-foreground">
          A personal library of dependency-free components, each in React and plain TypeScript, styled only with Tailwind v4.
        </p>

        <ol className="mt-10 grid gap-4 sm:grid-cols-3">
          {steps.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="rounded-lg border bg-card p-5">
              <Icon className="size-5 text-brand" aria-hidden />
              <h2 className="mt-3 text-sm font-medium">
                {i + 1}. {title}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </li>
          ))}
        </ol>

        <h2 className="mt-14 text-lg font-semibold">Components</h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {components.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/components/${c.slug}`}
                className="group flex h-full flex-col rounded-lg border bg-card p-5 transition-colors duration-200 hover:border-brand/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <span className="flex items-center justify-between font-medium">
                  {c.name}
                  <ArrowRight className="size-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
                </span>
                <span className="mt-1 text-sm text-muted-foreground">{c.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
