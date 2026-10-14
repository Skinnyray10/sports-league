"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRightIcon } from "lucide-react";
import { isNavItemActive } from "@/components/layout/sidebar-nav";
import type { NavItem } from "@/lib/nav";

type BreadcrumbsProps = {
  orgSlug: string;
  modules: NavItem[];
};

const DETAIL_LABELS: Record<string, string> = {
  credential: "Credencial",
  credentials: "Imprimir credenciales",
};

export function Breadcrumbs({ orgSlug, modules }: BreadcrumbsProps) {
  const pathname = usePathname();
  const home = `/${orgSlug}`;
  const current = modules.find((m) => isNavItemActive(pathname, m.href));

  const crumbs: { href?: string; label: string }[] = [{ href: home, label: "Panel" }];
  if (current) {
    const isDetail = pathname !== current.href;
    crumbs.push({ href: isDetail ? current.href : undefined, label: current.label });
    if (isDetail) {
      const last = pathname.split("/").filter(Boolean).at(-1) ?? "";
      crumbs.push({ label: DETAIL_LABELS[last] ?? "Detalle" });
    }
  }

  return (
    <nav aria-label="Ruta" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1 text-sm">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <li key={`${crumb.label}-${i}`} className="flex min-w-0 items-center gap-1">
              {i > 0 ? (
                <ChevronRightIcon
                  aria-hidden
                  className="size-3.5 shrink-0 text-muted-foreground"
                />
              ) : null}
              {crumb.href && !isLast ? (
                <Link
                  href={crumb.href}
                  className="truncate font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span aria-current="page" className="truncate font-semibold text-foreground">
                  {crumb.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
