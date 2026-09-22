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

  return (
    <aside className="flex w-full flex-col border-b border-border bg-sidebar text-sidebar-foreground md:w-60 md:shrink-0 md:border-b-0 md:border-r">
      <div className="border-b border-sidebar-border px-4 py-4">
        <Link
          href={`/${orgSlug}`}
          className="block text-sm font-bold tracking-tight text-foreground"
        >
          {orgName}
        </Link>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          /{orgSlug}
        </p>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-2 py-3 md:flex-col md:overflow-visible">
        {modules.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
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
