"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  assignReferee,
  cancelMatch,
  deleteMatch,
  postponeMatch,
  rescheduleMatch,
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

export type RefereeOption = {
  userId: string;
  label: string;
};

type MatchResultFormProps = {
  orgSlug: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
  status: MatchStatus;
  scoreLabel: string;
  canEditSchedule: boolean;
  canAssignReferee: boolean;
  canDelete: boolean;
  jornada: number | null;
  stage: string;
  venue: string | null;
  scheduledAt: string | null;
  refereeId: string | null;
  referees: RefereeOption[];
};

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const selectClass =
  "h-8 w-full rounded-[4px] border border-border bg-card px-2.5 text-sm text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/35";

export function MatchResultForm({
  orgSlug,
  matchId,
  homeScore,
  awayScore,
  status,
  scoreLabel,
  canEditSchedule,
  canAssignReferee,
  canDelete,
  venue,
  scheduledAt,
  refereeId,
  referees,
}: MatchResultFormProps) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const locked = status === "finalizado" || status === "cancelado";

  function runAction(
    action: (orgSlug: string, matchId: string, formData: FormData) => Promise<
      { ok: true } | { ok: false; error: string }
    >,
    formData: FormData
  ) {
    setError(null);
    startTransition(async () => {
      const result = await action(orgSlug, matchId, formData);
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

  if (!canEditSchedule && !canAssignReferee && !canDelete) {
    return (
      <section className="border border-border bg-card p-5">
        <h2 className="text-base font-semibold text-foreground">Marcador</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {status === "finalizado"
            ? `Resultado final: ${homeScore}–${awayScore} ${scoreLabel}.`
            : "El marcador se captura en la cédula del árbitro (próximamente)."}
        </p>
      </section>
    );
  }

  return (
    <div className="grid gap-8">
      <section className="border border-border bg-card p-5">
        <h2 className="text-base font-semibold text-foreground">Marcador</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {status === "finalizado" ? (
            <>
              Resultado final (solo lectura):{" "}
              <span className="font-mono font-semibold tabular-nums text-foreground">
                {homeScore}–{awayScore}
              </span>{" "}
              {scoreLabel}.
            </>
          ) : (
            <>
              La captura de {scoreLabel} y el cierre del partido se harán en la{" "}
              <span className="font-medium text-foreground">cédula</span> del
              árbitro (paso 5).{" "}
              {/* TODO(step-5): enlazar a /matches/[id]/cedula cuando exista */}
              <span className="text-muted-foreground">
                Enlace a cédula: pendiente.
              </span>
            </>
          )}
        </p>
      </section>

      {canAssignReferee ? (
        <section className="border border-border bg-card p-5">
          <h2 className="text-base font-semibold text-foreground">
            Árbitro asignado
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Solo un administrador puede asignar o cambiar al árbitro.
          </p>
          <form
            action={(fd) => runAction(assignReferee, fd)}
            className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto]"
          >
            <div className="grid gap-2">
              <Label htmlFor="referee_id">Árbitro</Label>
              <select
                id="referee_id"
                name="referee_id"
                defaultValue={refereeId ?? ""}
                disabled={pending || locked}
                className={selectClass}
              >
                <option value="">Sin árbitro</option>
                {referees.map((r) => (
                  <option key={r.userId} value={r.userId}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                disabled={pending || locked}
                className="rounded-[2px] bg-primary text-foreground hover:bg-foreground hover:text-background"
              >
                {pending ? "Guardando…" : "Guardar árbitro"}
              </Button>
            </div>
          </form>
          {referees.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Todavía no hay miembros con rol de árbitro. Invita a alguien desde
              la organización.
            </p>
          ) : null}
        </section>
      ) : null}

      {canEditSchedule && !locked ? (
        <>
          <section className="border border-border bg-card p-5">
            <h2 className="text-base font-semibold text-foreground">
              Reprogramar
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Cambia fecha, hora o sede y deja el motivo. El partido vuelve a
              programado.
            </p>
            <form
              action={(fd) => runAction(rescheduleMatch, fd)}
              className="mt-4 grid gap-4 sm:grid-cols-2"
            >
              <div className="grid gap-2">
                <Label htmlFor="reschedule_at">Nueva fecha y hora</Label>
                <Input
                  id="reschedule_at"
                  name="scheduled_at"
                  type="datetime-local"
                  required
                  defaultValue={toDatetimeLocal(scheduledAt)}
                  className="rounded-[4px]"
                  disabled={pending}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reschedule_venue">Nueva sede</Label>
                <Input
                  id="reschedule_venue"
                  name="venue"
                  defaultValue={venue ?? ""}
                  className="rounded-[4px]"
                  disabled={pending}
                />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="reschedule_reason">Motivo</Label>
                <Input
                  id="reschedule_reason"
                  name="reason"
                  required
                  maxLength={240}
                  placeholder="Ej. Lluvia en la cancha"
                  className="rounded-[4px]"
                  disabled={pending}
                />
              </div>
              <div className="sm:col-span-2">
                <Button
                  type="submit"
                  disabled={pending}
                  className="rounded-[2px] bg-primary text-foreground hover:bg-foreground hover:text-background"
                >
                  {pending ? "Guardando…" : "Reprogramar"}
                </Button>
              </div>
            </form>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div className="border border-border bg-card p-5">
              <h2 className="text-base font-semibold text-foreground">
                Aplazar
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Marca el partido como aplazado sin borrar la programación.
              </p>
              <form
                action={(fd) => runAction(postponeMatch, fd)}
                className="mt-4 grid gap-3"
              >
                <div className="grid gap-2">
                  <Label htmlFor="postpone_reason">Motivo</Label>
                  <Input
                    id="postpone_reason"
                    name="reason"
                    required
                    maxLength={240}
                    className="rounded-[4px]"
                    disabled={pending}
                  />
                </div>
                <Button
                  type="submit"
                  variant="outline"
                  disabled={pending || status === "aplazado"}
                  className="rounded-[2px]"
                >
                  {pending ? "Guardando…" : "Aplazar partido"}
                </Button>
              </form>
            </div>

            <div className="border border-border bg-card p-5">
              <h2 className="text-base font-semibold text-foreground">
                Cancelar
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Cancela el partido. Queda en el historial de cambios.
              </p>
              <form
                action={(fd) => runAction(cancelMatch, fd)}
                className="mt-4 grid gap-3"
              >
                <div className="grid gap-2">
                  <Label htmlFor="cancel_reason">Motivo</Label>
                  <Input
                    id="cancel_reason"
                    name="reason"
                    required
                    maxLength={240}
                    className="rounded-[4px]"
                    disabled={pending}
                  />
                </div>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={pending}
                  className="rounded-[2px]"
                >
                  {pending ? "Guardando…" : "Cancelar partido"}
                </Button>
              </form>
            </div>
          </section>
        </>
      ) : null}

      {canDelete ? (
        <section className="border border-border bg-card p-5">
          <h2 className="text-base font-semibold text-foreground">
            Eliminar partido
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Se borra el partido junto con sets e historial. No se puede
            deshacer.
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
                  Se borra el partido con su historial de programación y sets.
                  No se puede deshacer.
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
                  Volver
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
