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
    <aside className="flex w-full flex-col border-b border-border bg-sidebar text-sidebar-foreground md:w-64 md:shrink-0 md:border-b-0 md:border-r">
      <div className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="flex size-10 items-center justify-center rounded-sm bg-[#0A0A0A] font-mono text-xs font-bold text-white"
          >
            VP
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold tracking-tight text-foreground">
              Vista pública
            </p>
            <p className="font-mono text-xs text-muted-foreground">
              {panelHref ? "Con sesión" : "Sin sesión"}
            </p>
          </div>
        </div>
      </div>

      <div className="border-b border-sidebar-border px-4 py-4">
        <PublicAccessPanel orgSlug={orgSlug} panelHref={panelHref} />
      </div>

      <div className="border-b border-sidebar-border px-4 py-3">
        <p className="text-[0.6875rem] font-medium uppercase tracking-wide text-muted-foreground">
          Organización
        </p>
        <p className="mt-1 truncate text-sm font-semibold text-foreground">
          {orgName}
        </p>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-2 py-3 md:flex-col md:overflow-visible">
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
                "relative flex items-center rounded-sm px-3 py-2 text-[0.8125rem] font-medium transition-colors duration-150",
                active
                  ? "bg-white text-foreground"
                  : "text-muted-foreground hover:bg-white/70 hover:text-foreground"
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "absolute top-1.5 bottom-1.5 left-0 w-1 rounded-sm",
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
