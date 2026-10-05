import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-md bg-muted motion-reduce:animate-none", className)}
    />
  );
}

/** Esqueleto de una pantalla de módulo: encabezado + tabla. */
export function PageSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-6">
      <span className="sr-only">Cargando…</span>
      <div className="flex flex-col gap-3 border-b border-border pb-5">
        <Skeleton className="h-1 w-12 rounded-full" />
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Skeleton className="h-10 w-full rounded-none" />
        <div className="divide-y divide-border">
          {Array.from({ length: rows }, (_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/5" />
              <Skeleton className="ml-auto h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
