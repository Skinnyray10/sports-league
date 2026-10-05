"use client";

import * as React from "react";
import Link from "next/link";
import { MenuIcon } from "lucide-react";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { NavItem } from "@/lib/nav";

export type ModuleNavItem = NavItem;

type OrgSidebarProps = {
  orgName: string;
  orgSlug: string;
  modules: ModuleNavItem[];
};

function initialsOf(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "SL"
  );
}

function OrgIdentity({ orgName, orgSlug }: { orgName: string; orgSlug: string }) {
  return (
    <Link href={`/${orgSlug}`} className="flex min-w-0 items-center gap-3">
      <span
        aria-hidden
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-card font-heading text-xs font-extrabold tracking-tight text-foreground"
      >
        {initialsOf(orgName)}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold tracking-tight text-sidebar-foreground">
          {orgName}
        </span>
        <span className="mt-0.5 block font-mono text-[0.6875rem] text-sidebar-foreground/70">
          /{orgSlug}
        </span>
      </span>
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-4 pt-4 pb-1 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/70">
      {children}
    </p>
  );
}

export function OrgSidebar({ orgName, orgSlug, modules }: OrgSidebarProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <div className="flex items-center justify-between gap-3 border-b border-sidebar-border bg-sidebar px-4 py-3 text-sidebar-foreground md:hidden">
        <OrgIdentity orgName={orgName} orgSlug={orgSlug} />
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon-lg"
                className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                aria-label="Abrir menú de módulos"
              />
            }
          >
            <MenuIcon />
          </SheetTrigger>
          <SheetContent className="bg-sidebar text-sidebar-foreground">
            <div className="border-b border-sidebar-border px-4 py-4 pr-14">
              <SheetTitle className="sr-only">Menú de {orgName}</SheetTitle>
              <OrgIdentity orgName={orgName} orgSlug={orgSlug} />
            </div>
            <SectionLabel>Módulos</SectionLabel>
            <SidebarNav
              items={modules}
              label="Módulos"
              onNavigate={() => setOpen(false)}
            />
            <div className="mt-auto border-t border-sidebar-border px-4 py-4">
              <div className="flex flex-col gap-1 text-sm">
                <Link
                  href={`/p/${orgSlug}`}
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 items-center text-sidebar-foreground/80 hover:text-sidebar-foreground"
                >
                  Vista pública
                </Link>
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 items-center text-sidebar-foreground/80 hover:text-sidebar-foreground"
                >
                  Cambiar de liga
                </Link>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
        <div className="border-b border-sidebar-border px-4 py-4">
          <OrgIdentity orgName={orgName} orgSlug={orgSlug} />
        </div>
        <SectionLabel>Módulos</SectionLabel>
        <SidebarNav items={modules} label="Módulos" />
        <div className="mt-auto border-t border-sidebar-border px-4 py-4">
          <p className="text-[0.6875rem] leading-snug text-sidebar-foreground/70">
            {orgName}
            <br />
            Operaciones deportivas
          </p>
        </div>
      </aside>
    </>
  );
}
