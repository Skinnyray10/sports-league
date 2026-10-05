"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import {
  addMatchEvent,
  closeMatchSheet,
  deleteMatchEvent,
  saveSheetMeta,
  setParticipants,
} from "@/app/(app)/[orgSlug]/referee/actions";
import {
  deleteMatchSet,
  upsertMatchSet,
} from "@/app/(app)/[orgSlug]/matches/actions";
import { ModulePageHeader } from "@/components/ops/module-page-header";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import type { ActionResult } from "@/lib/action-result";
import {
  BRANCH_LABELS,
  MATCH_EVENT_LABELS,
  sportLabel,
} from "@/lib/labels";
import type { Branch, MatchEventType, ScoreType } from "@/types/database";

type EligiblePlayer = {
  id: string;
  teamId: string;
  teamName: string;
  jersey: number | null;
  name: string;
};

type SheetEvent = {
  id: string;
  playerRegistrationId: string;
  teamId: string;
  eventType: MatchEventType;
  quantity: number;
  minute: number | null;
};

type SheetSet = {
  id: string;
  setNumber: number;
  home: number;
  away: number;
};

type MatchSheetFormProps = {
  orgSlug: string;
  matchId: string;
  sheetId: string;
  closed: boolean;
  observations: string;
  refereeName: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  sportKey: string;
  sportName: string;
  branch: Branch;
  scoreType: ScoreType;
  drawRequiresShootout: boolean;
  shootoutWinnerTeamId: string | null;
  homeScore: number;
  awayScore: number;
  eligiblePlayers: EligiblePlayer[];
  selectedRegistrationIds: string[];
  events: SheetEvent[];
  sets: SheetSet[];
};

export function MatchSheetForm(props: MatchSheetFormProps) {
  const {
    orgSlug,
    matchId,
    sheetId,
    closed,
    observations,
    refereeName,
    homeTeamId,
    awayTeamId,
    homeTeamName,
    awayTeamName,
    sportKey,
    sportName,
    branch,
    scoreType,
    drawRequiresShootout,
    shootoutWinnerTeamId,
    homeScore,
    awayScore,
    eligiblePlayers,
    selectedRegistrationIds,
    events,
    sets,
  } = props;

  const router = useRouter();
  const [selected, setSelected] = React.useState<Set<string>>(
    () => new Set(selectedRegistrationIds)
  );
  const [pending, startTransition] = React.useTransition();
  const [confirmCloseOpen, setConfirmCloseOpen] = React.useState(false);
  const [closeError, setCloseError] = React.useState<string | null>(null);
  const [shootoutChoice, setShootoutChoice] = React.useState(
    shootoutWinnerTeamId ?? ""
  );
  const closeFormRef = React.useRef<HTMLFormElement>(null);

  const homePlayers = eligiblePlayers.filter((p) => p.teamId === homeTeamId);
  const awayPlayers = eligiblePlayers.filter((p) => p.teamId === awayTeamId);
  const playerById = new Map(eligiblePlayers.map((p) => [p.id, p]));

  const defaultEventType: MatchEventType =
    scoreType === "points" ? "pts" : scoreType === "goals" ? "gol" : "pts";

  let estimatedHome = homeScore;
  let estimatedAway = awayScore;
  if (!closed) {
    if (scoreType === "sets") {
      estimatedHome = sets.filter((s) => s.home > s.away).length;
      estimatedAway = sets.filter((s) => s.away > s.home).length;
    } else {
      const scoring = new Set(["gol", "pts", "carrera"]);
      estimatedHome = events
        .filter((e) => e.teamId === homeTeamId && scoring.has(e.eventType))
        .reduce((sum, e) => sum + e.quantity, 0);
      estimatedAway = events
        .filter((e) => e.teamId === awayTeamId && scoring.has(e.eventType))
        .reduce((sum, e) => sum + e.quantity, 0);
    }
  }

  const isDraw = estimatedHome === estimatedAway;
  const showShootout = drawRequiresShootout && isDraw;
  const shootoutWinnerName =
    shootoutChoice === homeTeamId
      ? homeTeamName
      : shootoutChoice === awayTeamId
        ? awayTeamName
        : null;

  function run(
    action: () => Promise<ActionResult>,
    options: { success?: string; onError?: () => void } = {}
  ) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        toast.error(result.error);
        options.onError?.();
        return;
      }
      if (options.success) toast.success(options.success);
      router.refresh();
    });
  }

  function togglePlayer(id: string) {
    if (closed) return;
    const previous = selected;
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
    run(() => setParticipants(orgSlug, matchId, sheetId, Array.from(next)), {
      onError: () => setSelected(previous),
    });
  }

  function onAddEvent(formData: FormData) {
    formData.set("sheet_id", sheetId);
    const regId = String(formData.get("player_registration_id") ?? "");
    const player = playerById.get(regId);
    if (player) formData.set("team_id", player.teamId);
    run(() => addMatchEvent(orgSlug, matchId, formData), {
      success: "Evento registrado.",
    });
  }

  function onSaveDraft() {
    const form = closeFormRef.current;
    if (!form) return;
    const fd = new FormData(form);
    fd.set("sheet_id", sheetId);
    run(() => saveSheetMeta(orgSlug, matchId, fd), {
      success: "Borrador guardado.",
    });
  }

  function onRequestClose(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCloseError(null);
    if (showShootout && !shootoutChoice) {
      setCloseError("Hay empate: elige el ganador por penales antes de cerrar.");
      return;
    }
    setConfirmCloseOpen(true);
  }

  async function confirmClose(): Promise<ActionResult> {
    const form = closeFormRef.current;
    if (!form) return { ok: false, error: "No encontramos el formulario." };
    const fd = new FormData(form);
    fd.set("sheet_id", sheetId);
    return closeMatchSheet(orgSlug, matchId, sheetId, fd);
  }

  function onUpsertSet(formData: FormData) {
    run(() => upsertMatchSet(orgSlug, matchId, formData), {
      success: "Set guardado.",
    });
  }

  const nextSetNumber =
    sets.reduce((max, s) => Math.max(max, s.setNumber), 0) + 1;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <nav aria-label="Ruta" className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <Link
          href={`/${orgSlug}/referee`}
          className="inline-flex min-h-11 items-center gap-1 font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          <ChevronLeftIcon className="size-4" aria-hidden />
          Mis partidos
        </Link>
        <Link
          href={`/${orgSlug}/matches/${matchId}`}
          className="inline-flex min-h-11 items-center font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Detalle del partido
        </Link>
      </nav>

      <ModulePageHeader
        band="referee"
        className="mb-0"
        title={`${homeTeamName} vs ${awayTeamName}`}
        description={`${sportLabel(sportKey || sportName)} · ${BRANCH_LABELS[branch]}`}
        actions={
          <div className="text-right">
            <p
              className="font-mono text-3xl font-semibold tabular-nums text-foreground"
              aria-label={`Marcador ${estimatedHome} a ${estimatedAway}`}
            >
              {estimatedHome}–{estimatedAway}
            </p>
            {closed ? (
              <p className="mt-1 text-sm font-medium text-status-final">
                Cédula cerrada · solo lectura
              </p>
            ) : null}
          </div>
        }
      />

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-base font-semibold text-foreground">Participantes</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Marca a los aprobados y elegibles que entran a la cédula.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <PlayerColumn
            title={homeTeamName}
            players={homePlayers}
            selected={selected}
            disabled={closed || pending}
            onToggle={togglePlayer}
          />
          <PlayerColumn
            title={awayTeamName}
            players={awayPlayers}
            selected={selected}
            disabled={closed || pending}
            onToggle={togglePlayer}
          />
        </div>
      </section>

      {scoreType === "sets" ? (
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-base font-semibold text-foreground">Sets</h2>
          <ul className="mt-3 space-y-2">
            {sets.map((s) => (
              <li key={s.id}>
                {closed ? (
                  <p className="font-mono text-sm tabular-nums">
                    Set {s.setNumber}: {s.home}–{s.away}
                  </p>
                ) : (
                  <form action={onUpsertSet} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="set_id" value={s.id} />
                    <SetInputs
                      idPrefix={`set-${s.id}`}
                      setNumber={s.setNumber}
                      home={s.home}
                      away={s.away}
                      homeTeamName={homeTeamName}
                      awayTeamName={awayTeamName}
                      disabled={pending}
                    />
                    <Button type="submit" variant="outline" disabled={pending}>
                      Guardar
                    </Button>
                    <ConfirmDialog
                      trigger={
                        <Button
                          type="button"
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          disabled={pending}
                        />
                      }
                      triggerContent="Quitar"
                      title={`¿Quitar el set ${s.setNumber}?`}
                      description={`Se borra el marcador ${s.home}–${s.away} de este set.`}
                      confirmLabel="Quitar set"
                      pendingLabel="Quitando…"
                      successMessage="Set eliminado."
                      onConfirm={() => deleteMatchSet(orgSlug, matchId, s.id)}
                      onSuccess={() => router.refresh()}
                    />
                  </form>
                )}
              </li>
            ))}
          </ul>
          {!closed ? (
            <form action={onUpsertSet} className="mt-3 flex flex-wrap items-end gap-2">
              <SetInputs
                idPrefix="set-new"
                setNumber={nextSetNumber}
                home={0}
                away={0}
                homeTeamName={homeTeamName}
                awayTeamName={awayTeamName}
                disabled={pending}
              />
              <Button type="submit" disabled={pending}>
                Agregar set
              </Button>
            </form>
          ) : null}
        </section>
      ) : null}

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-base font-semibold text-foreground">Eventos</h2>
        {!closed ? (
          <form action={onAddEvent} className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="event-player">Jugador en cédula</Label>
              <NativeSelect
                id="event-player"
                name="player_registration_id"
                required
                disabled={pending}
                className="h-11"
              >
                <option value="">Elige…</option>
                {eligiblePlayers
                  .filter((p) => selected.has(p.id))
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.jersey != null ? `#${p.jersey} ` : ""}
                      {p.name} ({p.teamName})
                    </option>
                  ))}
              </NativeSelect>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="event-type">Tipo</Label>
              <NativeSelect
                id="event-type"
                name="event_type"
                required
                defaultValue={defaultEventType}
                disabled={pending}
                className="h-11"
              >
                {(Object.keys(MATCH_EVENT_LABELS) as MatchEventType[]).map((t) => (
                  <option key={t} value={t}>
                    {MATCH_EVENT_LABELS[t]}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="event-qty">Cantidad</Label>
              <Input
                id="event-qty"
                name="quantity"
                type="number"
                inputMode="numeric"
                min={1}
                defaultValue={1}
                className="h-11 font-mono"
                disabled={pending}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="event-minute">Minuto</Label>
              <Input
                id="event-minute"
                name="minute"
                type="number"
                inputMode="numeric"
                min={0}
                className="h-11 font-mono"
                disabled={pending}
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" size="lg" disabled={pending}>
                Agregar evento
              </Button>
            </div>
          </form>
        ) : null}

        {events.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Sin eventos.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border rounded-lg border border-border">
            {events.map((ev) => {
              const player = playerById.get(ev.playerRegistrationId);
              const summary = `${MATCH_EVENT_LABELS[ev.eventType]}${
                ev.quantity > 1 ? ` ×${ev.quantity}` : ""
              } · ${player?.name ?? "Jugador"}${ev.minute != null ? ` · ${ev.minute}'` : ""}`;
              return (
                <li
                  key={ev.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
                >
                  <span>{summary}</span>
                  {!closed ? (
                    <ConfirmDialog
                      trigger={
                        <Button
                          type="button"
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          disabled={pending}
                        />
                      }
                      triggerContent={
                        <>
                          <Trash2Icon data-icon="inline-start" />
                          Quitar
                        </>
                      }
                      title="¿Quitar este evento?"
                      description={summary}
                      confirmLabel="Quitar evento"
                      pendingLabel="Quitando…"
                      successMessage="Evento eliminado."
                      onConfirm={() => deleteMatchEvent(orgSlug, matchId, ev.id)}
                      onSuccess={() => router.refresh()}
                    />
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-base font-semibold text-foreground">Cierre</h2>
        <form ref={closeFormRef} onSubmit={onRequestClose} className="mt-4 grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="referee_name">Nombre del árbitro</Label>
            <Input
              id="referee_name"
              name="referee_name"
              required={!closed}
              autoComplete="name"
              defaultValue={refereeName}
              className="h-11"
              disabled={closed || pending}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="observations">Observaciones</Label>
            <textarea
              id="observations"
              name="observations"
              rows={3}
              maxLength={2000}
              defaultValue={observations}
              disabled={closed || pending}
              className="w-full rounded-lg border border-input bg-card px-3 py-2 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 md:text-sm"
            />
          </div>
          {showShootout || shootoutWinnerTeamId ? (
            <div className="grid gap-2">
              <Label htmlFor="shootout_winner_team_id">Ganador por penales (J.E.G.)</Label>
              <NativeSelect
                id="shootout_winner_team_id"
                name="shootout_winner_team_id"
                value={shootoutChoice}
                onChange={(e) => setShootoutChoice(e.target.value)}
                disabled={closed || pending}
                aria-invalid={closeError ? true : undefined}
                aria-describedby={closeError ? "close-error" : undefined}
                className="h-11 max-w-sm"
              >
                <option value="">Sin definir</option>
                <option value={homeTeamId}>{homeTeamName}</option>
                <option value={awayTeamId}>{awayTeamName}</option>
              </NativeSelect>
            </div>
          ) : (
            <input type="hidden" name="shootout_winner_team_id" value="" />
          )}
          {closeError ? (
            <p id="close-error" className="text-sm text-destructive" role="alert">
              {closeError}
            </p>
          ) : null}
          {!closed ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={pending}
                onClick={onSaveDraft}
              >
                Guardar borrador
              </Button>
              <Button
                type="submit"
                size="lg"
                disabled={pending}
                className="bg-foreground text-background hover:bg-primary hover:text-foreground"
              >
                Cerrar cédula
              </Button>
            </div>
          ) : null}
        </form>
      </section>

      <ConfirmDialog
        open={confirmCloseOpen}
        onOpenChange={setConfirmCloseOpen}
        variant="default"
        title="¿Cerrar la cédula?"
        description="Al cerrarla, el marcador se vuelve oficial y la cédula queda en solo lectura. Solo el administrador puede reabrirla."
        confirmLabel="Sí, cerrar cédula"
        pendingLabel="Cerrando…"
        successMessage="Cédula cerrada. El resultado ya es oficial."
        onConfirm={confirmClose}
        onSuccess={() => router.refresh()}
      >
        <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 rounded-lg border border-border bg-secondary/50 p-3 text-sm">
          <dt className="text-muted-foreground">{homeTeamName}</dt>
          <dd className="font-mono font-semibold tabular-nums">{estimatedHome}</dd>
          <dt className="text-muted-foreground">{awayTeamName}</dt>
          <dd className="font-mono font-semibold tabular-nums">{estimatedAway}</dd>
          {showShootout ? (
            <>
              <dt className="text-muted-foreground">Ganador por penales</dt>
              <dd className="font-semibold">{shootoutWinnerName ?? "Sin definir"}</dd>
            </>
          ) : null}
          <dt className="text-muted-foreground">Participantes</dt>
          <dd className="font-mono font-semibold tabular-nums">{selected.size}</dd>
        </dl>
      </ConfirmDialog>
    </div>
  );
}

function SetInputs({
  idPrefix,
  setNumber,
  home,
  away,
  homeTeamName,
  awayTeamName,
  disabled,
}: {
  idPrefix: string;
  setNumber: number;
  home: number;
  away: number;
  homeTeamName: string;
  awayTeamName: string;
  disabled: boolean;
}) {
  return (
    <>
      <div className="grid gap-1">
        <Label htmlFor={`${idPrefix}-number`} className="text-xs">
          Set
        </Label>
        <Input
          id={`${idPrefix}-number`}
          name="set_number"
          type="number"
          inputMode="numeric"
          min={1}
          defaultValue={setNumber}
          className="h-11 w-16 font-mono"
          disabled={disabled}
        />
      </div>
      <div className="grid gap-1">
        <Label htmlFor={`${idPrefix}-home`} className="max-w-24 truncate text-xs">
          {homeTeamName}
        </Label>
        <Input
          id={`${idPrefix}-home`}
          name="home_set_score"
          type="number"
          inputMode="numeric"
          min={0}
          defaultValue={home}
          className="h-11 w-20 font-mono"
          disabled={disabled}
        />
      </div>
      <div className="grid gap-1">
        <Label htmlFor={`${idPrefix}-away`} className="max-w-24 truncate text-xs">
          {awayTeamName}
        </Label>
        <Input
          id={`${idPrefix}-away`}
          name="away_set_score"
          type="number"
          inputMode="numeric"
          min={0}
          defaultValue={away}
          className="h-11 w-20 font-mono"
          disabled={disabled}
        />
      </div>
    </>
  );
}

function PlayerColumn({
  title,
  players,
  selected,
  disabled,
  onToggle,
}: {
  title: string;
  players: EligiblePlayer[];
  selected: Set<string>;
  disabled: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-foreground">{title}</legend>
      {players.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin elegibles.</p>
      ) : (
        <ul className="space-y-1">
          {players.map((p) => (
            <li key={p.id}>
              <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 text-sm hover:bg-secondary/60">
                <input
                  type="checkbox"
                  className="size-5 accent-primary"
                  checked={selected.has(p.id)}
                  disabled={disabled}
                  onChange={() => onToggle(p.id)}
                />
                <span className="font-medium text-foreground">
                  {p.jersey != null ? `#${p.jersey} ` : ""}
                  {p.name}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </fieldset>
  );
}
