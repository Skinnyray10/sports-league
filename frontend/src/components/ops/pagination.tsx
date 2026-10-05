import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

export const PAGE_SIZE = 50;

/** Página 1-based desde `?page=`; valores inválidos caen en 1. */
export function parsePage(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

/** Rango inclusivo para `.range(from, to)` de Supabase. */
export function pageRange(page: number, size = PAGE_SIZE): [number, number] {
  const from = (page - 1) * size;
  return [from, from + size - 1];
}

type PaginationProps = {
  page: number;
  total: number;
  /** Construye el href conservando los demás filtros. */
  hrefFor: (page: number) => string;
  size?: number;
};

const linkClass =
  "inline-flex min-h-11 items-center gap-1 rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-muted sm:min-h-9";
const disabledClass =
  "inline-flex min-h-11 items-center gap-1 rounded-full border border-border px-4 text-sm text-muted-foreground opacity-50 sm:min-h-9";

export function Pagination({ page, total, hrefFor, size = PAGE_SIZE }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / size));
  if (pages <= 1) return null;
  const from = (page - 1) * size + 1;
  const to = Math.min(page * size, total);

  return (
    <nav
      aria-label="Paginación"
      className="mt-4 flex flex-wrap items-center justify-between gap-3"
    >
      <p className="text-sm text-muted-foreground">
        {from}–{to} de {total}
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={hrefFor(page - 1)} className={linkClass} rel="prev">
            <ChevronLeftIcon className="size-4" aria-hidden />
            Anterior
          </Link>
        ) : (
          <span className={disabledClass} aria-disabled="true">
            <ChevronLeftIcon className="size-4" aria-hidden />
            Anterior
          </span>
        )}
        {page < pages ? (
          <Link href={hrefFor(page + 1)} className={linkClass} rel="next">
            Siguiente
            <ChevronRightIcon className="size-4" aria-hidden />
          </Link>
        ) : (
          <span className={disabledClass} aria-disabled="true">
            Siguiente
            <ChevronRightIcon className="size-4" aria-hidden />
          </span>
        )}
      </div>
    </nav>
  );
}
