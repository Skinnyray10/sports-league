"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { BRANCH_LABELS, sportLabel } from "@/lib/labels";
import type { Branch } from "@/types/database";
import { NativeSelect } from "@/components/ui/native-select";

export type MatchFilterOption = {
  id: string;
  label: string;
};

export type MatchFiltersState = {
  sport?: string;
  branch?: string;
  category?: string;
  group?: string;
  jornada?: string;
};

type MatchesFiltersProps = {
  orgSlug: string;
  filters: MatchFiltersState;
  sports: MatchFilterOption[];
  branches: Branch[];
  categories: MatchFilterOption[];
  groups: MatchFilterOption[];
  jornadas: number[];
};

function buildHref(
  orgSlug: string,
  next: MatchFiltersState
): string {
  const params = new URLSearchParams();
  if (next.sport) params.set("deporte", next.sport);
  if (next.branch) params.set("rama", next.branch);
  if (next.category) params.set("categoria", next.category);
  if (next.group) params.set("grupo", next.group);
  if (next.jornada) params.set("jornada", next.jornada);
  const qs = params.toString();
  return qs ? `/${orgSlug}/matches?${qs}` : `/${orgSlug}/matches`;
}


export function MatchesFilters({
  orgSlug,
  filters,
  sports,
  branches,
  categories,
  groups,
  jornadas,
}: MatchesFiltersProps) {
  const router = useRouter();

  function update(patch: Partial<MatchFiltersState>) {
    router.push(buildHref(orgSlug, { ...filters, ...patch }));
  }

  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="mb-5 grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5">
      <div className="flex items-center justify-between sm:col-span-2 lg:col-span-5">
        <p className="text-sm font-medium text-foreground">
          Filtros{activeCount > 0 ? ` (${activeCount} activos)` : ""}
        </p>
        {activeCount > 0 ? (
          <Link
            href={`/${orgSlug}/matches`}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            Limpiar filtros
          </Link>
        ) : null}
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="filter-sport" className="text-muted-foreground">
          Deporte
        </Label>
        <NativeSelect
          id="filter-sport"
          value={filters.sport ?? ""}
          onChange={(e) =>
            update({ sport: e.target.value || undefined, group: undefined })
          }
          className="min-w-[8rem]"
        >
          <option value="">Todos</option>
          {sports.map((s) => (
            <option key={s.id} value={s.id}>
              {sportLabel(s.label)}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="filter-branch" className="text-muted-foreground">
          Rama
        </Label>
        <NativeSelect
          id="filter-branch"
          value={filters.branch ?? ""}
          onChange={(e) => update({ branch: e.target.value || undefined })}
          className="min-w-[8rem]"
        >
          <option value="">Todas</option>
          {branches.map((b) => (
            <option key={b} value={b}>
              {BRANCH_LABELS[b]}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="filter-category" className="text-muted-foreground">
          Categoría
        </Label>
        <NativeSelect
          id="filter-category"
          value={filters.category ?? ""}
          onChange={(e) => update({ category: e.target.value || undefined })}
          className="min-w-[8rem]"
        >
          <option value="">Todas</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="filter-group" className="text-muted-foreground">
          Grupo
        </Label>
        <NativeSelect
          id="filter-group"
          value={filters.group ?? ""}
          onChange={(e) => update({ group: e.target.value || undefined })}
          className="min-w-[8rem]"
        >
          <option value="">Todos</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.label}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="filter-jornada" className="text-muted-foreground">
          Jornada
        </Label>
        <NativeSelect
          id="filter-jornada"
          value={filters.jornada ?? ""}
          onChange={(e) => update({ jornada: e.target.value || undefined })}
          className="min-w-[8rem]"
        >
          <option value="">Todas</option>
          {jornadas.map((j) => (
            <option key={j} value={String(j)}>
              Jornada {j}
            </option>
          ))}
        </NativeSelect>
      </div>
    </div>
  );
}
