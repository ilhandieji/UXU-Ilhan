import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { BrandEyebrow } from "@/components/brand";
import { ComponentStudio } from "@/components/component-studio";
import { PageHeader } from "@/components/page-header";
import { components } from "@/registry/meta";
import type { Framework } from "@/registry/types";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => components.map(({ slug }) => ({ slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const meta = components.find((c) => c.slug === slug);
  return meta ? { title: meta.name, description: meta.description } : {};
}

/** Reads the component's source files at build time (shown and customized in the Code tab) */
async function readSources(slug: string, files: Record<Framework, string[]>) {
  const read = async (framework: Framework) =>
    Object.fromEntries(
      await Promise.all(
        files[framework].map(
          async (file) =>
            [
              file,
              await readFile(path.join(process.cwd(), "components", slug, framework, file), "utf8"),
            ] as const,
        ),
      ),
    );
  return { react: await read("react"), vanilla: await read("vanilla") };
}

export default async function ComponentPage({ params }: Props) {
  const { slug } = await params;
  const meta = components.find((c) => c.slug === slug);
  if (!meta) notFound();

  return (
    <>
      <PageHeader trail={["Components", meta.name]} />
      <main className="w-full px-4 py-8 sm:px-6">
        <BrandEyebrow>Component</BrandEyebrow>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{meta.name}</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">{meta.description}</p>
        {/* useSearchParams needs a Suspense boundary on statically generated pages */}
        <Suspense
          fallback={<div className="mt-8 h-[32rem] animate-pulse rounded-lg border bg-card" />}
        >
          <ComponentStudio slug={meta.slug} sources={await readSources(meta.slug, meta.files)} />
        </Suspense>
      </main>
    </>
  );
}
