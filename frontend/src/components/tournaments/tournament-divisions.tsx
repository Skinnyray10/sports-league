"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, Trash2Icon } from "lucide-react";
import {
  createDivision,
  createGroup,
  deleteDivision,
  deleteGroup,
} from "@/app/(app)/[orgSlug]/tournaments/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BRANCH_LABELS, sportLabel } from "@/lib/labels";
import type { Branch } from "@/types/database";

export type DivisionView = {
  id: string;
  name: string | null;
  branch: Branch;
  sport: { id: string; key: string; name: string };
  category: { id: string; name: string };
  groups: { id: string; name: string }[];
};

type SportOption = { id: string; key: string; name: string };
type CategoryOption = { id: string; name: string };
type BranchOption = { sport_id: string; branch: Branch };

type TournamentDivisionsProps = {
  orgSlug: string;
  tournamentId: string;
  divisions: DivisionView[];
  sports: SportOption[];
  categories: CategoryOption[];
  activeBranches: BranchOption[];
  canManageStaff: boolean;
};

export function TournamentDivisions({
  orgSlug,
  tournamentId,
  divisions,
  sports,
  categories,
  activeBranches,
  canManageStaff,
}: TournamentDivisionsProps) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const defaultSportId = sports[0]?.id ?? "";
  const [sportId, setSportId] = React.useState(defaultSportId);
  const branchesForSport = activeBranches
    .filter((b) => b.sport_id === sportId)
    .map((b) => b.branch);
  const defaultBranch = branchesForSport[0] ?? "varonil";
  const [branch, setBranch] = React.useState<Branch>(defaultBranch);
  const selectedBranch = branchesForSport.includes(branch)
    ? branch
    : defaultBranch;
  const [categoryId, setCategoryId] = React.useState(categories[0]?.id ?? "");
  const [groupDivisionId, setGroupDivisionId] = React.useState(
    divisions[0]?.id ?? ""
  );
  const resolvedGroupDivisionId = divisions.some((d) => d.id === groupDivisionId)
    ? groupDivisionId
    : (divisions[0]?.id ?? "");

  function onCreateDivision(formData: FormData) {
    setError(null);
    formData.set("sport_id", sportId);
    formData.set("branch", selectedBranch);
    formData.set("category_id", categoryId);
    startTransition(async () => {
      const result = await createDivision(orgSlug, tournamentId, formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function onDeleteDivision(divisionId: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteDivision(orgSlug, tournamentId, divisionId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function onCreateGroup(formData: FormData) {
    setError(null);
    formData.set("division_id", resolvedGroupDivisionId);
    startTransition(async () => {
      const result = await createGroup(orgSlug, tournamentId, formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function onDeleteGroup(groupId: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteGroup(orgSlug, tournamentId, groupId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {canManageStaff ? (
        <form
          action={onCreateDivision}
          className="grid gap-3 border border-[#D0D5DB] bg-white p-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end"
        >
          <div className="grid gap-2">
            <Label>Deporte</Label>
            <Select
              value={sportId}
              onValueChange={(value) => setSportId(value ?? "")}
              disabled={pending || sports.length === 0}
            >
              <SelectTrigger className="w-full rounded-[4px]">
                <SelectValue placeholder="Deporte" />
              </SelectTrigger>
              <SelectContent>
                {sports.map((sport) => (
                  <SelectItem key={sport.id} value={sport.id}>
                    {sportLabel(sport.key) || sportLabel(sport.name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Rama</Label>
            <Select
              value={selectedBranch}
              onValueChange={(value) =>
                setBranch((value as Branch) ?? selectedBranch)
              }
              disabled={pending || branchesForSport.length === 0}
            >
              <SelectTrigger className="w-full rounded-[4px]">
                <SelectValue placeholder="Rama" />
              </SelectTrigger>
              <SelectContent>
                {branchesForSport.map((b) => (
                  <SelectItem key={b} value={b}>
                    {BRANCH_LABELS[b]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Categoría</Label>
            <Select
              value={categoryId}
              onValueChange={(value) => setCategoryId(value ?? "")}
              disabled={pending || categories.length === 0}
            >
              <SelectTrigger className="w-full rounded-[4px]">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="division-name">Nombre (opcional)</Label>
            <Input
              id="division-name"
              name="name"
              maxLength={80}
              placeholder="Ej. Grupo A libre"
              className="rounded-[4px]"
              disabled={pending}
            />
          </div>
          <Button
            type="submit"
            className="rounded-[2px] bg-[#00B7FF] text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white"
            disabled={
              pending ||
              !sportId ||
              !selectedBranch ||
              !categoryId ||
              sports.length === 0 ||
              categories.length === 0
            }
          >
            <PlusIcon data-icon="inline-start" />
            {pending ? "Creando…" : "Agregar división"}
          </Button>
        </form>
      ) : null}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {divisions.length === 0 ? (
        <div className="border border-dashed border-[#D0D5DB] bg-white px-6 py-10 text-center">
          <p className="font-medium text-[#0A0A0A]">
            Todavía no hay divisiones
          </p>
          <p className="mt-1 text-sm text-[#5C6570]">
            {canManageStaff
              ? "Crea una división con deporte, rama y categoría. Luego puedes agregar grupos."
              : "El administrador creará las divisiones del torneo."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {divisions.map((division) => {
            const title =
              division.name?.trim() ||
              `${sportLabel(division.sport.key)} · ${BRANCH_LABELS[division.branch]} · ${division.category.name}`;
            return (
              <div
                key={division.id}
                className="border border-[#D0D5DB] bg-white"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#D0D5DB] px-4 py-3">
                  <div>
                    <p className="font-medium text-[#0A0A0A]">{title}</p>
                    <p className="mt-0.5 text-sm text-[#5C6570]">
                      {sportLabel(division.sport.key)} ·{" "}
                      {BRANCH_LABELS[division.branch]} ·{" "}
                      {division.category.name}
                    </p>
                  </div>
                  {canManageStaff ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rounded-[2px] text-destructive hover:bg-destructive/10 hover:text-destructive"
                      disabled={pending}
                      onClick={() => onDeleteDivision(division.id)}
                    >
                      <Trash2Icon data-icon="inline-start" />
                      Eliminar
                    </Button>
                  ) : null}
                </div>
                <div className="px-4 py-3">
                  {division.groups.length === 0 ? (
                    <p className="text-sm text-[#5C6570]">Sin grupos</p>
                  ) : (
                    <ul className="flex flex-wrap gap-2">
                      {division.groups.map((group) => (
                        <li
                          key={group.id}
                          className="inline-flex items-center gap-1 border border-[#D0D5DB] bg-[#F5F6F7] px-2 py-1 text-sm text-[#0A0A0A]"
                        >
                          {group.name}
                          {canManageStaff ? (
                            <button
                              type="button"
                              className="ml-1 text-[#5C6570] hover:text-destructive"
                              disabled={pending}
                              onClick={() => onDeleteGroup(group.id)}
                              aria-label={`Eliminar grupo ${group.name}`}
                            >
                              ×
                            </button>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {canManageStaff && divisions.length > 0 ? (
        <form
          action={onCreateGroup}
          className="flex flex-col gap-3 border border-[#D0D5DB] bg-white p-4 sm:flex-row sm:items-end"
        >
          <div className="grid min-w-0 flex-1 gap-2">
            <Label>División</Label>
            <Select
              value={resolvedGroupDivisionId}
              onValueChange={(value) => setGroupDivisionId(value ?? "")}
              disabled={pending}
            >
              <SelectTrigger className="w-full rounded-[4px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {divisions.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name?.trim() ||
                      `${sportLabel(d.sport.key)} · ${BRANCH_LABELS[d.branch]} · ${d.category.name}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid min-w-0 flex-1 gap-2">
            <Label htmlFor="group-name">Nombre del grupo</Label>
            <Input
              id="group-name"
              name="name"
              required
              maxLength={40}
              placeholder="Ej. Grupo A"
              className="rounded-[4px]"
              disabled={pending}
            />
          </div>
          <Button
            type="submit"
            className="rounded-[2px] bg-[#00B7FF] text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white"
            disabled={pending || !resolvedGroupDivisionId}
          >
            <PlusIcon data-icon="inline-start" />
            {pending ? "Creando…" : "Agregar grupo"}
          </Button>
        </form>
      ) : null}
    </div>
  );
}
