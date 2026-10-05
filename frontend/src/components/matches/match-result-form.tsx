"use client";

import * as React from "react";
import Link from "next/link";
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
import { toast } from "sonner";
import { NativeSelect } from "@/components/ui/native-select";

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
  /** Enlace a la cédula si quien mira puede abrirla. */
  sheetHref?: string | null;
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
  canEditSchedule,
  canAssignReferee,
  canDelete,
  venue,
  scheduledAt,
  refereeId,
  referees,
  sheetHref,
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
      toast.success("Partido actualizado.");
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
      toast.success("Partido eliminado.");
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
            : "El marcador se captura en la cédula del árbitro el día del partido."}
        </p>
        {sheetHref && status !== "finalizado" ? (
          <Link
            href={sheetHref}
            className="mt-3 inline-flex font-medium text-foreground underline underline-offset-4"
          >
            Abrir cédula
          </Link>
        ) : null}
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
              El árbitro asignado captura {scoreLabel} y cierra el partido
              desde la{" "}
              {sheetHref ? (
                <Link
                  href={sheetHref}
                  className="font-medium text-foreground underline underline-offset-4"
                >
                  cédula
                </Link>
              ) : (
                <span className="font-medium text-foreground">cédula</span>
              )}
              . Al cerrarla, el resultado se publica automáticamente.
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
              <NativeSelect
                id="referee_id"
                name="referee_id"
                defaultValue={refereeId ?? ""}
                disabled={pending || locked}
              >
                <option value="">Sin árbitro</option>
                {referees.map((r) => (
                  <option key={r.userId} value={r.userId}>
                    {r.label}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                disabled={pending || locked}
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
                  disabled={pending}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reschedule_venue">Nueva sede</Label>
                <Input
                  id="reschedule_venue"
                  name="venue"
                  defaultValue={venue ?? ""}
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
                  disabled={pending}
                />
              </div>
              <div className="sm:col-span-2">
                <Button
                  type="submit"
                  disabled={pending}
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
                    disabled={pending}
                  />
                </div>
                <Button
                  type="submit"
                  variant="outline"
                  disabled={pending || status === "aplazado"}
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
                    disabled={pending}
                  />
                </div>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={pending}
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
                  className="mt-4"
                  disabled={pending}
                />
              }
            >
              Eliminar partido
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>¿Eliminar este partido?</DialogTitle>
                <DialogDescription>
                  Se borra el partido con su historial de programación y sets.
                  No se puede deshacer.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={() => setConfirmingDelete(false)}
                >
                  Volver
                </Button>
                <Button
                  type="button"
                  variant="destructive"
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
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
