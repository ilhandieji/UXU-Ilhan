"use client";

import Link from "next/link";
import { BrandMark } from "@/components/brand";
import { useSidebar } from "@/components/ui/sidebar";

/** Keeps the mark visible in the top bar when the sidebar (and its logo) is hidden */
export function HeaderBrand() {
  const { state, isMobile } = useSidebar();
  if (!isMobile && state === "expanded") return null;
  return (
    <Link
      href="/"
      aria-label="UXU-Ilhan home"
      className="mr-1 rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <BrandMark size={30} />
    </Link>
  );
}
