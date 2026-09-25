"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { PublicAccessPanel } from "@/components/public/public-access-panel";

export type PublicNavItem = {
  href: string;
  label: string;
  bandClass: string;
};

type PublicSidebarProps = {
  orgName: string;
  orgSlug: string;
  modules: PublicNavItem[];
  panelHref?: string | null;
};

export function PublicSidebar({
  orgName,
  orgSlug,
  modules,
  panelHref,
}: PublicSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex w-full flex-col border-b border-sidebar-border bg-sidebar text-sidebar-foreground md:w-64 md:shrink-0 md:border-b-0 md:border-r">
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
            <p className="font-mono text-[0.6875rem] text-sidebar-foreground/55">
              {panelHref ? "Con sesión" : "Sin sesión"}
            </p>
          </div>
        </div>
      </div>

      <div className="border-b border-sidebar-border px-4 py-4">
        <PublicAccessPanel orgSlug={orgSlug} panelHref={panelHref} />
      </div>

      <div className="border-b border-sidebar-border px-4 py-3">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/45">
          Organización
        </p>
        <p className="mt-1 truncate text-sm font-semibold text-sidebar-foreground">
          {orgName}
        </p>
      </div>

      <p className="px-4 pt-4 pb-1 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/45">
        Consulta
      </p>

      <nav className="flex gap-1 overflow-x-auto px-2 pb-3 md:flex-col md:overflow-visible">
        {modules.map((item) => {
          const active =
            item.href === `/p/${orgSlug}`
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center rounded-full px-3 py-2 text-[0.8125rem] font-medium transition-colors duration-150",
                active
                  ? "bg-sidebar-accent font-semibold text-sidebar-foreground"
                  : "text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "absolute top-1.5 bottom-1.5 left-0 w-[3px] rounded-full",
                  active ? item.bandClass : "bg-transparent"
                )}
              />
              <span className={cn(active && "pl-2")}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
