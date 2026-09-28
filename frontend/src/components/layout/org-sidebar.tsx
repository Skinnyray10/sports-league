"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type ModuleNavItem = {
  href: string;
  label: string;
  bandClass: string;
};

type OrgSidebarProps = {
  orgName: string;
  orgSlug: string;
  modules: ModuleNavItem[];
};

export function OrgSidebar({ orgName, orgSlug, modules }: OrgSidebarProps) {
  const pathname = usePathname();
  const initials = orgName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <aside className="flex w-full flex-col border-b border-sidebar-border bg-sidebar text-sidebar-foreground md:w-60 md:shrink-0 md:border-b-0 md:border-r">
      <div className="border-b border-sidebar-border px-4 py-4">
        <Link href={`/${orgSlug}`} className="flex items-center gap-3">
          <span
            aria-hidden
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-card font-heading text-xs font-extrabold tracking-tight text-foreground"
          >
            {initials || "SL"}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold tracking-tight text-sidebar-foreground">
              {orgName}
            </span>
            <span className="mt-0.5 block font-mono text-[0.6875rem] text-sidebar-foreground/55">
              /{orgSlug}
            </span>
          </span>
        </Link>
      </div>

      <p className="px-4 pt-4 pb-1 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/45">
        Módulos
      </p>

      <nav className="flex gap-1 overflow-x-auto px-2 pb-3 md:flex-col md:overflow-visible">
        {modules.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
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

      <div className="mt-auto hidden border-t border-sidebar-border px-4 py-4 md:block">
        <p className="text-[0.6875rem] leading-snug text-sidebar-foreground/45">
          {orgName}
          <br />
          Operaciones deportivas
        </p>
      </div>
    </aside>
  );
}
