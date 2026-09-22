"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  updateMatchResult,
  updateMatchSchedule,
  deleteMatch,
} from "@/app/(app)/[orgSlug]/matches/actions";
import type { MatchStatus } from "@/types/database";
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

type MatchResultFormProps = {
  orgSlug: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
  status: MatchStatus;
  scoreLabel: string;
  canUpdateResult: boolean;
  canEditSchedule: boolean;
  canDelete: boolean;
  round: number | null;
  stage: string | null;
  courtInfo: string | null;
  scheduledAt: string | null;
};

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function MatchResultForm({
  orgSlug,
  matchId,
  homeScore,
  awayScore,
  status,
  scoreLabel,
  canUpdateResult,
  canEditSchedule,
  canDelete,
  round,
  stage,
  courtInfo,
  scheduledAt,
}: MatchResultFormProps) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const scoreUnit = scoreLabel.charAt(0).toUpperCase() + scoreLabel.slice(1);

  function submitResult(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateMatchResult(orgSlug, matchId, formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function submitSchedule(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateMatchSchedule(orgSlug, matchId, formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function onDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteMatch(orgSlug, matchId);
      if (!result.ok) {
        setError(result.error);
        setConfirmingDelete(false);
        return;
      }
      router.push(`/${orgSlug}/matches`);
      router.refresh();
    });
  }

  if (!canUpdateResult && !canEditSchedule && !canDelete) {
    return null;
  }

  return (
    <div className="grid gap-8">
      {canUpdateResult ? (
        <section className="border border-[#D0D5DB] bg-white p-5">
          <h2 className="text-base font-semibold text-[#0A0A0A]">
            Marcador y estado
          </h2>
          <p className="mt-1 text-sm text-[#5C6570]">
            Captura los {scoreLabel} y marca en qué va el partido. La tabla de
            posiciones solo cuenta los partidos finalizados.
          </p>
          <form action={submitResult} className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="home_score">{scoreUnit} del local</Label>
              <Input
                id="home_score"
                name="home_score"
                type="number"
                min={0}
                required
                defaultValue={homeScore}
                className="rounded-[4px] font-mono tabular-nums"
                disabled={pending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="away_score">{scoreUnit} del visitante</Label>
              <Input
                id="away_score"
                name="away_score"
                type="number"
                min={0}
                required
                defaultValue={awayScore}
                className="rounded-[4px] font-mono tabular-nums"
                disabled={pending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Estado</Label>
              <select
                id="status"
                name="status"
                required
                defaultValue={status}
                disabled={pending}
                className="h-8 w-full rounded-[4px] border border-[#D0D5DB] bg-white px-2.5 text-sm text-[#0A0A0A] outline-none focus-visible:border-[#00B7FF] focus-visible:ring-2 focus-visible:ring-[#00B7FF]/35"
              >
                <option value="programado">Programado</option>
                <option value="en_vivo">En vivo</option>
                <option value="finalizado">Finalizado</option>
                <option value="suspendido">Suspendido</option>
              </select>
            </div>
            <div className="sm:col-span-3">
              <Button
                type="submit"
                disabled={pending}
                className="rounded-[2px] bg-[#00B7FF] text-[#0A0A0A] transition-[background,color] duration-150 ease-out hover:bg-[#0A0A0A] hover:text-white"
              >
                {pending ? "Guardando…" : "Guardar marcador"}
              </Button>
            </div>
          </form>
        </section>
      ) : null}

      {canEditSchedule ? (
        <section className="border border-[#D0D5DB] bg-white p-5">
          <h2 className="text-base font-semibold text-[#0A0A0A]">
            Programación
          </h2>
          <p className="mt-1 text-sm text-[#5C6570]">
            Jornada, fase, cancha y hora. Los árbitros no pueden cambiar estos
            campos.
          </p>
          <form
            action={submitSchedule}
            className="mt-4 grid gap-4 sm:grid-cols-2"
          >
            <div className="grid gap-2">
              <Label htmlFor="round">Jornada</Label>
              <Input
                id="round"
                name="round"
                type="number"
                min={1}
                defaultValue={round ?? ""}
                className="rounded-[4px]"
                disabled={pending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="stage">Fase</Label>
              <Input
                id="stage"
                name="stage"
                defaultValue={stage ?? ""}
                className="rounded-[4px]"
                disabled={pending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="scheduled_at">Fecha y hora</Label>
              <Input
                id="scheduled_at"
                name="scheduled_at"
                type="datetime-local"
                defaultValue={toDatetimeLocal(scheduledAt)}
                className="rounded-[4px]"
                disabled={pending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="court_info">Cancha o sede</Label>
              <Input
                id="court_info"
                name="court_info"
                defaultValue={courtInfo ?? ""}
                className="rounded-[4px]"
                disabled={pending}
              />
            </div>
            <div className="sm:col-span-2">
              <Button
                type="submit"
                variant="outline"
                disabled={pending}
                className="rounded-[2px]"
              >
                {pending ? "Guardando…" : "Guardar programación"}
              </Button>
            </div>
          </form>
        </section>
      ) : null}

      {canDelete ? (
        <section className="border border-[#D0D5DB] bg-white p-5">
          <h2 className="text-base font-semibold text-[#0A0A0A]">
            Eliminar partido
          </h2>
          <p className="mt-1 text-sm text-[#5C6570]">
            Se borra el partido junto con sus sets. No se puede deshacer.
          </p>
          <Dialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
            <DialogTrigger
              render={
                <Button
                  type="button"
                  variant="destructive"
                  className="mt-4 rounded-[2px]"
                  disabled={pending}
                />
              }
            >
              Eliminar partido
            </DialogTrigger>
            <DialogContent className="rounded-[4px] sm:max-w-md">
              <DialogHeader>
                <DialogTitle>¿Eliminar este partido?</DialogTitle>
                <DialogDescription>
                  Se borra el partido con su marcador y sus sets. No se puede
                  deshacer, y la tabla de posiciones se recalcula sin él.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="rounded-b-[4px]">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-[2px]"
                  disabled={pending}
                  onClick={() => setConfirmingDelete(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  className="rounded-[2px]"
                  disabled={pending}
                  onClick={onDelete}
                >
                  {pending ? "Eliminando…" : "Eliminar partido"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </section>
      ) : null}

      {error ? (
        <p className="text-sm text-[#DC2626]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
