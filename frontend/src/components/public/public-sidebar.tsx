"use client";

import * as React from "react";
import Link from "next/link";
import { MenuIcon } from "lucide-react";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { PublicAccessPanel } from "@/components/public/public-access-panel";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { NavItem } from "@/lib/nav";

export type PublicNavItem = NavItem;

type PublicSidebarProps = {
  orgName: string;
  orgSlug: string;
  modules: PublicNavItem[];
  panelHref?: string | null;
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-4 pt-4 pb-1 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/70">
      {children}
    </p>
  );
}

function SidebarBody({
  orgSlug,
  modules,
  panelHref,
  onNavigate,
}: Omit<PublicSidebarProps, "orgName"> & { onNavigate?: () => void }) {
  return (
    <>
      <SectionLabel>Consulta</SectionLabel>
      <SidebarNav
        items={modules}
        label="Secciones públicas"
        exactHrefs={[`/p/${orgSlug}`]}
        onNavigate={onNavigate}
      />
      <div className="px-4 pb-3">
        <Link
          href="/"
          onClick={onNavigate}
          className="inline-flex min-h-11 items-center text-[0.8125rem] font-medium text-sidebar-foreground/80 underline-offset-4 hover:text-sidebar-foreground hover:underline md:min-h-0"
        >
          Cambiar de liga
        </Link>
      </div>
      <div className="mt-auto border-t border-sidebar-border px-4 py-4">
        <PublicAccessPanel orgSlug={orgSlug} panelHref={panelHref} />
      </div>
    </>
  );
}

export function PublicSidebar({
  orgName,
  orgSlug,
  modules,
  panelHref,
}: PublicSidebarProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <div className="flex items-center justify-between gap-3 border-b border-sidebar-border bg-sidebar px-4 py-2 text-sidebar-foreground md:hidden">
        <p className="font-mono text-[0.6875rem] uppercase tracking-wide text-sidebar-foreground/70">
          Vista pública
        </p>
        <div className="flex items-center gap-1">
          <Link
            href={panelHref ?? `/login?next=${encodeURIComponent(`/${orgSlug}`)}`}
            className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {panelHref ? "Mi panel" : "Acceso"}
          </Link>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-lg"
                  className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  aria-label="Abrir menú"
                />
              }
            >
              <MenuIcon />
            </SheetTrigger>
            <SheetContent className="bg-sidebar text-sidebar-foreground">
              <div className="border-b border-sidebar-border px-4 py-4 pr-14">
                <SheetTitle className="truncate text-sidebar-foreground">{orgName}</SheetTitle>
                <p className="font-mono text-[0.6875rem] text-sidebar-foreground/70">
                  Vista pública
                </p>
              </div>
              <SidebarBody
                orgSlug={orgSlug}
                modules={modules}
                panelHref={panelHref}
                onNavigate={() => setOpen(false)}
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
        <div className="border-b border-sidebar-border px-4 py-4">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex size-10 items-center justify-center rounded-full bg-card font-heading text-xs font-extrabold text-foreground"
            >
              VP
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold tracking-tight text-sidebar-foreground">
                Vista pública
              </p>
              <p className="font-mono text-[0.6875rem] text-sidebar-foreground/70">
                {panelHref ? "Con sesión" : "Sin sesión"}
              </p>
            </div>
          </div>
        </div>
        <SidebarBody orgSlug={orgSlug} modules={modules} panelHref={panelHref} />
      </aside>
    </>
  );
}
