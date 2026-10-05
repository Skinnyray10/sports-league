"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { createTeam } from "@/app/(app)/[orgSlug]/teams/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";

export type ClubOption = { id: string; name: string };
export type DivisionOption = {
  id: string;
  label: string;
  tournament_name: string;
  sport_key: string;
  branch: Branch;
  category_name: string;
};
export type GroupOption = {
  id: string;
  name: string;
  division_id: string;
};

type CreateTeamDialogProps = {
  orgSlug: string;
  clubs: ClubOption[];
  divisions: DivisionOption[];
  groups: GroupOption[];
};

export function CreateTeamDialog({
  orgSlug,
  clubs,
  divisions,
  groups,
}: CreateTeamDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  const [clubId, setClubId] = React.useState(clubs[0]?.id ?? "");
  const [divisionId, setDivisionId] = React.useState(divisions[0]?.id ?? "");
  const groupsForDivision = groups.filter((g) => g.division_id === divisionId);
  const [groupId, setGroupId] = React.useState("");
  const resolvedGroupId = groupsForDivision.some((g) => g.id === groupId)
    ? groupId
    : "";

  const canCreate = clubs.length > 0 && divisions.length > 0;

  function onSubmit(formData: FormData) {
    setError(null);
    formData.set("club_id", clubId);
    formData.set("division_id", divisionId);
    formData.set("group_id", resolvedGroupId);

    startTransition(async () => {
      const result = await createTeam(orgSlug, formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success("Equipo creado.");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            disabled={!canCreate}
          />
        }
      >
        <PlusIcon data-icon="inline-start" />
        Agregar equipo
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>Agregar equipo</DialogTitle>
          <DialogDescription>
            El equipo pertenece a un club y a una división del torneo. El grupo
            es opcional.
          </DialogDescription>
        </DialogHeader>
        {!canCreate ? (
          <p className="text-sm text-muted-foreground">
            Necesitas al menos un club y una división en algún torneo antes de
            crear equipos.
          </p>
        ) : (
          <form action={onSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="team-name">Nombre</Label>
              <Input
                id="team-name"
                name="name"
                required
                maxLength={80}
                placeholder="Ej. Norte FC"
                disabled={pending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-team-1">Club</Label>
              <Select
                value={clubId}
                onValueChange={(value) => setClubId(value ?? "")}
                disabled={pending}
              >
                <SelectTrigger id="new-team-1" className="w-full">
                  <SelectValue placeholder="Elige un club" />
                </SelectTrigger>
                <SelectContent>
                  {clubs.map((club) => (
                    <SelectItem key={club.id} value={club.id}>
                      {club.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-team-2">División</Label>
              <Select
                value={divisionId}
                onValueChange={(value) => setDivisionId(value ?? "")}
                disabled={pending}
              >
                <SelectTrigger id="new-team-2" className="w-full">
                  <SelectValue placeholder="Elige una división" />
                </SelectTrigger>
                <SelectContent>
                  {divisions.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.tournament_name} · {sportLabel(d.sport_key)} ·{" "}
                      {BRANCH_LABELS[d.branch]} · {d.category_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-team-3">Grupo (opcional)</Label>
              <Select
                value={resolvedGroupId || "__none__"}
                onValueChange={(value) =>
                  setGroupId(value === "__none__" ? "" : (value ?? ""))
                }
                disabled={pending || groupsForDivision.length === 0}
              >
                <SelectTrigger id="new-team-3" className="w-full">
                  <SelectValue
                    placeholder={
                      groupsForDivision.length === 0
                        ? "Sin grupos en esta división"
                        : "Sin grupo"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sin grupo</SelectItem>
                  {groupsForDivision.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="team-logo">URL del logo (opcional)</Label>
              <Input
                id="team-logo"
                name="logo_url"
                type="url"
                placeholder="https://"
                disabled={pending}
              />
            </div>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={pending || !clubId || !divisionId}
              >
                {pending ? "Guardando…" : "Crear equipo"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
