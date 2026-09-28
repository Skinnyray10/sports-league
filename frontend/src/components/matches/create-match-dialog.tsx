"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { createMatch } from "@/app/(app)/[orgSlug]/matches/actions";
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
  BRANCH_LABELS,
  MATCH_STAGE_LABELS,
  sportLabel,
} from "@/lib/labels";
import type { Branch } from "@/types/database";

export type DivisionOption = {
  id: string;
  tournamentId: string;
  tournamentName: string;
  sportId: string;
  sportKey: string;
  sportName: string;
  branch: Branch;
  categoryId: string;
  categoryName: string;
  label: string;
};

export type TeamOption = {
  id: string;
  name: string;
  divisionId: string;
  groupId: string | null;
};

export type GroupOption = {
  id: string;
  name: string;
  divisionId: string;
};

type CreateMatchDialogProps = {
  orgSlug: string;
  divisions: DivisionOption[];
  teams: TeamOption[];
  groups: GroupOption[];
};

const selectClass =
  "h-8 w-full rounded-[4px] border border-border bg-card px-2.5 text-sm text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/35";

export function CreateMatchDialog({
  orgSlug,
  divisions,
  teams,
  groups,
}: CreateMatchDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  const [divisionId, setDivisionId] = React.useState(divisions[0]?.id ?? "");
  const [homeTeamId, setHomeTeamId] = React.useState("");
  const [awayTeamId, setAwayTeamId] = React.useState("");

  const teamsInDivision = teams.filter((t) => t.divisionId === divisionId);
  const groupsInDivision = groups.filter((g) => g.divisionId === divisionId);
  const selectedDivision = divisions.find((d) => d.id === divisionId);

  function onDivisionChange(nextId: string) {
    setDivisionId(nextId);
    setHomeTeamId("");
    setAwayTeamId("");
  }
  function onSubmit(formData: FormData) {
    setError(null);

    if (homeTeamId && awayTeamId && homeTeamId === awayTeamId) {
      setError("Un equipo no puede jugar contra sí mismo. Elige dos distintos.");
      return;
    }

    const home = teams.find((t) => t.id === homeTeamId);
    const away = teams.find((t) => t.id === awayTeamId);
    if (
      home &&
      away &&
      (home.divisionId !== divisionId || away.divisionId !== divisionId)
    ) {
      setError("Los dos equipos deben pertenecer a la misma división.");
      return;
    }

    startTransition(async () => {
      const result = await createMatch(orgSlug, formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  if (divisions.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="rounded-[2px] bg-primary text-foreground transition-[background,color] duration-150 ease-out hover:bg-foreground hover:text-background" />
        }
      >
        <PlusIcon data-icon="inline-start" />
        Programar partido
      </DialogTrigger>
      <DialogContent className="rounded-[4px] sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle>Programar partido</DialogTitle>
          <DialogDescription>
            Elige la división y los dos equipos. El marcador se captura en la
            cédula cuando se juegue.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="match-division">División</Label>
            <select
              id="match-division"
              name="division_id"
              required
              value={divisionId}
              onChange={(e) => onDivisionChange(e.target.value)}
              disabled={pending}
              className={selectClass}
            >
              {divisions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
            {selectedDivision ? (
              <p className="text-xs text-muted-foreground">
                {selectedDivision.tournamentName} ·{" "}
                {sportLabel(selectedDivision.sportKey)} ·{" "}
                {BRANCH_LABELS[selectedDivision.branch]} ·{" "}
                {selectedDivision.categoryName}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="match-home">Equipo local</Label>
              <select
                id="match-home"
                name="home_team_id"
                required
                value={homeTeamId}
                onChange={(e) => setHomeTeamId(e.target.value)}
                disabled={pending || teamsInDivision.length === 0}
                className={selectClass}
              >
                <option value="">Elige un equipo</option>
                {teamsInDivision.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="match-away">Equipo visitante</Label>
              <select
                id="match-away"
                name="away_team_id"
                required
                value={awayTeamId}
                onChange={(e) => setAwayTeamId(e.target.value)}
                disabled={pending || teamsInDivision.length === 0}
                className={selectClass}
              >
                <option value="">Elige un equipo</option>
                {teamsInDivision.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {teamsInDivision.length < 2 ? (
            <p className="text-sm text-muted-foreground">
              Esta división necesita al menos dos equipos antes de poder
              programar un partido.
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="match-group">Grupo (opcional)</Label>
              <select
                id="match-group"
                name="group_id"
                disabled={pending || groupsInDivision.length === 0}
                className={selectClass}
                defaultValue=""
              >
                <option value="">Sin grupo</option>
                {groupsInDivision.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="match-jornada">Jornada (opcional)</Label>
              <Input
                id="match-jornada"
                name="jornada"
                type="number"
                min={1}
                className="rounded-[4px]"
                disabled={pending}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="match-stage">Fase</Label>
              <select
                id="match-stage"
                name="stage"
                defaultValue="regular"
                disabled={pending}
                className={selectClass}
              >
                {Object.entries(MATCH_STAGE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="match-venue">Sede</Label>
              <Input
                id="match-venue"
                name="venue"
                maxLength={120}
                placeholder="Ej. Cancha 1"
                className="rounded-[4px]"
                disabled={pending}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="match-scheduled">Fecha y hora</Label>
            <Input
              id="match-scheduled"
              name="scheduled_at"
              type="datetime-local"
              className="rounded-[4px]"
              disabled={pending}
            />
          </div>

          {error ? (
            <p className="text-sm text-[#DC2626]" role="alert">
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-[2px]"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              Cerrar
            </Button>
            <Button
              type="submit"
              disabled={pending || teamsInDivision.length < 2}
              className="rounded-[2px] bg-primary text-foreground hover:bg-foreground hover:text-background"
            >
              {pending ? "Guardando…" : "Programar partido"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
