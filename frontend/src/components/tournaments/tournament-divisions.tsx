"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, Trash2Icon, XIcon } from "lucide-react";
import { toast } from "sonner";
import {
  createDivision,
  createGroup,
  deleteDivision,
  deleteGroup,
} from "@/app/(app)/[orgSlug]/tournaments/actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
import {
  DivisionFixtures,
  type DivisionFixtureSummary,
} from "@/components/tournaments/division-fixtures";
import type { Branch } from "@/types/database";

export type DivisionView = {
  id: string;
  name: string | null;
  branch: Branch;
  sport: { id: string; key: string; name: string };
  category: { id: string; name: string };
  groups: { id: string; name: string }[];
  fixtures: DivisionFixtureSummary;
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
      toast.success("División creada.");
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
      toast.success("Grupo creado.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {canManageStaff ? (
        <form
          action={onCreateDivision}
          className="grid gap-3 border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end"
        >
          <div className="grid gap-2">
            <Label htmlFor="division-sport">Deporte</Label>
            <Select
              value={sportId}
              onValueChange={(value) => setSportId(value ?? "")}
              disabled={pending || sports.length === 0}
            >
              <SelectTrigger id="division-sport" className="w-full">
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
            <Label htmlFor="division-branch">Rama</Label>
            <Select
              value={selectedBranch}
              onValueChange={(value) =>
                setBranch((value as Branch) ?? selectedBranch)
              }
              disabled={pending || branchesForSport.length === 0}
            >
              <SelectTrigger id="division-branch" className="w-full">
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
            <Label htmlFor="division-category">Categoría</Label>
            <Select
              value={categoryId}
              onValueChange={(value) => setCategoryId(value ?? "")}
              disabled={pending || categories.length === 0}
            >
              <SelectTrigger id="division-category" className="w-full">
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
              
              disabled={pending}
            />
          </div>
          <Button
            type="submit"
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
        <div className="border border-dashed border-border bg-card px-6 py-10 text-center">
          <p className="font-medium text-foreground">
            Todavía no hay divisiones
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
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
                className="border border-border bg-card"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3">
                  <div>
                    <p className="font-medium text-foreground">{title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {sportLabel(division.sport.key)} ·{" "}
                      {BRANCH_LABELS[division.branch]} ·{" "}
                      {division.category.name}
                    </p>
                  </div>
                  {canManageStaff ? (
                    <ConfirmDialog
                      trigger={
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          disabled={pending}
                        />
                      }
                      triggerContent={
                        <>
                          <Trash2Icon data-icon="inline-start" />
                          Eliminar
                        </>
                      }
                      title={`¿Eliminar la división ${title}?`}
                      description="Se eliminan también sus grupos. No se puede deshacer; si tiene equipos o partidos, primero tendrás que quitarlos."
                      confirmLabel="Eliminar división"
                      pendingLabel="Eliminando…"
                      successMessage="División eliminada."
                      onConfirm={() =>
                        deleteDivision(orgSlug, tournamentId, division.id)
                      }
                      onSuccess={() => router.refresh()}
                    />
                  ) : null}
                </div>
                <div className="px-4 py-3">
                  {division.groups.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin grupos</p>
                  ) : (
                    <ul className="flex flex-wrap gap-2">
                      {division.groups.map((group) => (
                        <li
                          key={group.id}
                          className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary py-1 pr-1 pl-3 text-sm text-foreground"
                        >
                          {group.name}
                          {canManageStaff ? (
                            <ConfirmDialog
                              trigger={
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  className="text-muted-foreground hover:text-destructive"
                                  disabled={pending}
                                  aria-label={`Eliminar grupo ${group.name}`}
                                />
                              }
                              triggerContent={<XIcon />}
                              title={`¿Eliminar el grupo ${group.name}?`}
                              description="Los equipos del grupo quedan sin grupo asignado. No se puede deshacer."
                              confirmLabel="Eliminar grupo"
                              pendingLabel="Eliminando…"
                              successMessage="Grupo eliminado."
                              onConfirm={() =>
                                deleteGroup(orgSlug, tournamentId, group.id)
                              }
                              onSuccess={() => router.refresh()}
                            />
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {canManageStaff ? (
                  <DivisionFixtures
                    orgSlug={orgSlug}
                    tournamentId={tournamentId}
                    divisionId={division.id}
                    summary={division.fixtures}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {canManageStaff && divisions.length > 0 ? (
        <form
          action={onCreateGroup}
          className="flex flex-col gap-3 border border-border bg-card p-4 sm:flex-row sm:items-end"
        >
          <div className="grid min-w-0 flex-1 gap-2">
            <Label htmlFor="group-division">División</Label>
            <Select
              value={resolvedGroupDivisionId}
              onValueChange={(value) => setGroupDivisionId(value ?? "")}
              disabled={pending}
            >
              <SelectTrigger id="group-division" className="w-full">
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
              
              disabled={pending}
            />
          </div>
          <Button
            type="submit"
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
