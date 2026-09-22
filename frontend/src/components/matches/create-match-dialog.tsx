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

export type TournamentOption = {
  id: string;
  name: string;
  season: string;
};

export type EnrollmentOption = {
  tournamentId: string;
  teamId: string;
  teamName: string;
};

type CreateMatchDialogProps = {
  orgSlug: string;
  tournaments: TournamentOption[];
  enrollments: EnrollmentOption[];
};

export function CreateMatchDialog({
  orgSlug,
  tournaments,
  enrollments,
}: CreateMatchDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  const [tournamentId, setTournamentId] = React.useState(
    tournaments[0]?.id ?? ""
  );

  const teamsForTournament = enrollments.filter(
    (e) => e.tournamentId === tournamentId
  );

  function onSubmit(formData: FormData) {
    setError(null);
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

  if (tournaments.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="rounded-[2px] bg-[#00B7FF] text-[#0A0A0A] transition-[background,color] duration-150 ease-out hover:bg-[#0A0A0A] hover:text-white" />
        }
      >
        <PlusIcon data-icon="inline-start" />
        Programar partido
      </DialogTrigger>
      <DialogContent className="rounded-[4px] sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle>Programar partido</DialogTitle>
          <DialogDescription>
            Elige el torneo y los dos equipos. El marcador lo capturas después,
            cuando se juegue.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="match-tournament">Torneo</Label>
            <select
              id="match-tournament"
              name="tournament_id"
              required
              value={tournamentId}
              onChange={(e) => setTournamentId(e.target.value)}
              disabled={pending}
              className="h-8 w-full rounded-[4px] border border-[#D0D5DB] bg-white px-2.5 text-sm text-[#0A0A0A] outline-none focus-visible:border-[#00B7FF] focus-visible:ring-2 focus-visible:ring-[#00B7FF]/35"
            >
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.season})
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="match-home">Equipo local</Label>
              <select
                id="match-home"
                name="home_team_id"
                required
                disabled={pending || teamsForTournament.length === 0}
                className="h-8 w-full rounded-[4px] border border-[#D0D5DB] bg-white px-2.5 text-sm text-[#0A0A0A] outline-none focus-visible:border-[#00B7FF] focus-visible:ring-2 focus-visible:ring-[#00B7FF]/35"
              >
                <option value="">Elige un equipo</option>
                {teamsForTournament.map((t) => (
                  <option key={t.teamId} value={t.teamId}>
                    {t.teamName}
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
                disabled={pending || teamsForTournament.length === 0}
                className="h-8 w-full rounded-[4px] border border-[#D0D5DB] bg-white px-2.5 text-sm text-[#0A0A0A] outline-none focus-visible:border-[#00B7FF] focus-visible:ring-2 focus-visible:ring-[#00B7FF]/35"
              >
                <option value="">Elige un equipo</option>
                {teamsForTournament.map((t) => (
                  <option key={t.teamId} value={t.teamId}>
                    {t.teamName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {teamsForTournament.length < 2 ? (
            <p className="text-sm text-[#5C6570]">
              Este torneo necesita al menos dos equipos inscritos antes de
              poder programar un partido.
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="match-round">Jornada (opcional)</Label>
              <Input
                id="match-round"
                name="round"
                type="number"
                min={1}
                className="rounded-[4px]"
                disabled={pending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="match-stage">Fase (opcional)</Label>
              <Input
                id="match-stage"
                name="stage"
                maxLength={80}
                placeholder="Ej. Grupo A"
                className="rounded-[4px]"
                disabled={pending}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
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
            <div className="grid gap-2">
              <Label htmlFor="match-court">Cancha o sede</Label>
              <Input
                id="match-court"
                name="court_info"
                maxLength={120}
                placeholder="Ej. Cancha 1"
                className="rounded-[4px]"
                disabled={pending}
              />
            </div>
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
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={pending || teamsForTournament.length < 2}
              className="rounded-[2px] bg-[#00B7FF] text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white"
            >
              {pending ? "Guardando…" : "Programar partido"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
