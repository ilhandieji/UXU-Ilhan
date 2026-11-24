"use client";

import { Home, TerminalSquare, Type } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { BrandMark, BrandWordmark } from "@/components/brand";
import { components } from "@/registry/meta";

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-4">
        <Link
          href="/"
          aria-label="UXU-Ilhan home"
          className="flex items-center gap-2.5 rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <BrandMark size={34} />
          <BrandWordmark />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Getting started</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/"}>
                  <Link href="/">
                    <Home aria-hidden />
                    Introduction
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Components</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {components.map((c) => {
                const href = `/components/${c.slug}`;
                return (
                  <SidebarMenuItem key={c.slug}>
                    <SidebarMenuButton asChild isActive={pathname === href}>
                      <Link href={href}>
                        <TerminalSquare aria-hidden />
                        {c.name}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/ascii"}>
                  <Link href="/ascii">
                    <Type aria-hidden />
                    ASCII Editor
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="px-4 pb-4">
        <p className="flex items-center gap-2 font-mono text-[10px] tracking-[0.16em] text-muted-foreground">
          <span className="size-1.5 rounded-full bg-brand" aria-hidden />
          PERSONAL COMPONENT SYSTEM
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
