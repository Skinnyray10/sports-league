"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/lib/nav";

type SidebarNavProps = {
  items: NavItem[];
  label: string;
  /** Rutas que solo se marcan activas con coincidencia exacta (p. ej. el inicio). */
  exactHrefs?: string[];
  onNavigate?: () => void;
  className?: string;
};

export function isNavItemActive(
  pathname: string,
  href: string,
  exact = false
): boolean {
  if (pathname === href) return true;
  return !exact && pathname.startsWith(`${href}/`);
}

export function SidebarNav({
  items,
  label,
  exactHrefs = [],
  onNavigate,
  className,
}: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav aria-label={label} className={cn("flex flex-col gap-1 px-2 pb-3", className)}>
      {items.map((item) => {
        const active = isNavItemActive(
          pathname,
          item.href,
          exactHrefs.includes(item.href)
        );
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            onClick={onNavigate}
            className={cn(
              "relative flex min-h-11 items-center rounded-full px-3 text-sm font-medium transition-colors duration-150 md:min-h-9 md:text-[0.8125rem]",
              active
                ? "bg-sidebar-accent font-semibold text-sidebar-foreground"
                : "text-sidebar-foreground/75 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
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
  );
}
