"use client";

import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { BRANCH_LABELS, sportLabel } from "@/lib/labels";
import type { Branch } from "@/types/database";

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

const selectClass =
  "h-8 w-full min-w-[8rem] rounded-[4px] border border-[#D0D5DB] bg-white px-2.5 text-sm text-[#0A0A0A] outline-none focus-visible:border-[#00B7FF] focus-visible:ring-2 focus-visible:ring-[#00B7FF]/35";

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

  return (
    <div className="mb-5 grid gap-3 border border-[#D0D5DB] bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
      <div className="grid gap-1.5">
        <Label htmlFor="filter-sport" className="text-[#5C6570]">
          Deporte
        </Label>
        <select
          id="filter-sport"
          value={filters.sport ?? ""}
          onChange={(e) =>
            update({ sport: e.target.value || undefined, group: undefined })
          }
          className={selectClass}
        >
          <option value="">Todos</option>
          {sports.map((s) => (
            <option key={s.id} value={s.id}>
              {sportLabel(s.label)}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="filter-branch" className="text-[#5C6570]">
          Rama
        </Label>
        <select
          id="filter-branch"
          value={filters.branch ?? ""}
          onChange={(e) => update({ branch: e.target.value || undefined })}
          className={selectClass}
        >
          <option value="">Todas</option>
          {branches.map((b) => (
            <option key={b} value={b}>
              {BRANCH_LABELS[b]}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="filter-category" className="text-[#5C6570]">
          Categoría
        </Label>
        <select
          id="filter-category"
          value={filters.category ?? ""}
          onChange={(e) => update({ category: e.target.value || undefined })}
          className={selectClass}
        >
          <option value="">Todas</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="filter-group" className="text-[#5C6570]">
          Grupo
        </Label>
        <select
          id="filter-group"
          value={filters.group ?? ""}
          onChange={(e) => update({ group: e.target.value || undefined })}
          className={selectClass}
        >
          <option value="">Todos</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="filter-jornada" className="text-[#5C6570]">
          Jornada
        </Label>
        <select
          id="filter-jornada"
          value={filters.jornada ?? ""}
          onChange={(e) => update({ jornada: e.target.value || undefined })}
          className={selectClass}
        >
          <option value="">Todas</option>
          {jornadas.map((j) => (
            <option key={j} value={String(j)}>
              Jornada {j}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
