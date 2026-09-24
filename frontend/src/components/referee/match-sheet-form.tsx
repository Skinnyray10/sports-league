"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2Icon } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

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

  function run(
    action: () => Promise<{ ok: true } | { ok: false; error: string }>
  ) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function togglePlayer(id: string) {
    if (closed) return;
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
    run(() => setParticipants(orgSlug, matchId, sheetId, Array.from(next)));
  }

  function onAddEvent(formData: FormData) {
    formData.set("sheet_id", sheetId);
    const regId = String(formData.get("player_registration_id") ?? "");
    const player = playerById.get(regId);
    if (player) formData.set("team_id", player.teamId);
    run(() => addMatchEvent(orgSlug, matchId, formData));
  }

  function onSaveMeta(formData: FormData) {
    formData.set("sheet_id", sheetId);
    run(() => saveSheetMeta(orgSlug, matchId, formData));
  }

  function onClose(formData: FormData) {
    formData.set("sheet_id", sheetId);
    run(() => closeMatchSheet(orgSlug, matchId, sheetId, formData));
  }

  function onUpsertSet(formData: FormData) {
    run(() => upsertMatchSet(orgSlug, matchId, formData));
  }

  function onDeleteSet(setId: string) {
    run(() => deleteMatchSet(orgSlug, matchId, setId));
  }

  const nextSetNumber =
    sets.reduce((max, s) => Math.max(max, s.setNumber), 0) + 1;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <header className="border-b border-[#D0D5DB] pb-5">
        <div className="mb-3 h-1 w-12 bg-[#00B7FF]" aria-hidden />
        <h1 className="text-2xl font-bold tracking-tight text-[#0A0A0A]">
          {homeTeamName} vs {awayTeamName}
        </h1>
        <p className="mt-1 text-sm text-[#5C6570]">
          {sportLabel(sportKey || sportName)} · {BRANCH_LABELS[branch]}
        </p>
        <p className="mt-3 font-mono text-3xl font-semibold tabular-nums text-[#0A0A0A]">
          {estimatedHome}–{estimatedAway}
        </p>
        {closed ? (
          <p className="mt-2 text-sm font-medium text-[#1F6B4A]">
            Cédula cerrada · solo lectura
          </p>
        ) : null}
      </header>

      <section className="border border-[#D0D5DB] bg-white p-4">
        <h2 className="text-base font-semibold text-[#0A0A0A]">
          Participantes
        </h2>
        <p className="mt-1 text-sm text-[#5C6570]">
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
        <section className="border border-[#D0D5DB] bg-white p-4">
          <h2 className="text-base font-semibold text-[#0A0A0A]">Sets</h2>
          <ul className="mt-3 space-y-2">
            {sets.map((s) => (
              <li key={s.id}>
                {closed ? (
                  <p className="font-mono text-sm tabular-nums">
                    Set {s.setNumber}: {s.home}–{s.away}
                  </p>
                ) : (
                  <form
                    action={onUpsertSet}
                    className="flex flex-wrap items-end gap-2"
                  >
                    <input type="hidden" name="set_id" value={s.id} />
                    <Input
                      name="set_number"
                      type="number"
                      min={1}
                      defaultValue={s.setNumber}
                      className="w-16 rounded-[4px] font-mono"
                      disabled={pending}
                    />
                    <Input
                      name="home_set_score"
                      type="number"
                      min={0}
                      defaultValue={s.home}
                      className="w-16 rounded-[4px] font-mono"
                      disabled={pending}
                    />
                    <Input
                      name="away_set_score"
                      type="number"
                      min={0}
                      defaultValue={s.away}
                      className="w-16 rounded-[4px] font-mono"
                      disabled={pending}
                    />
                    <Button
                      type="submit"
                      size="sm"
                      variant="outline"
                      className="rounded-[2px]"
                      disabled={pending}
                    >
                      Guardar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="rounded-[2px] text-[#DC2626]"
                      disabled={pending}
                      onClick={() => onDeleteSet(s.id)}
                    >
                      Quitar
                    </Button>
                  </form>
                )}
              </li>
            ))}
          </ul>
          {!closed ? (
            <form
              action={onUpsertSet}
              className="mt-3 flex flex-wrap items-end gap-2"
            >
              <Input
                name="set_number"
                type="number"
                min={1}
                defaultValue={nextSetNumber}
                className="w-16 rounded-[4px] font-mono"
                disabled={pending}
              />
              <Input
                name="home_set_score"
                type="number"
                min={0}
                defaultValue={0}
                className="w-16 rounded-[4px] font-mono"
                disabled={pending}
              />
              <Input
                name="away_set_score"
                type="number"
                min={0}
                defaultValue={0}
                className="w-16 rounded-[4px] font-mono"
                disabled={pending}
              />
              <Button
                type="submit"
                size="sm"
                className="rounded-[2px] bg-[#00B7FF] text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white"
                disabled={pending}
              >
                Agregar set
              </Button>
            </form>
          ) : null}
        </section>
      ) : null}

      <section className="border border-[#D0D5DB] bg-white p-4">
        <h2 className="text-base font-semibold text-[#0A0A0A]">Eventos</h2>
        {!closed ? (
          <form
            action={onAddEvent}
            className="mt-4 grid gap-3 sm:grid-cols-2"
          >
            <div className="grid gap-1 sm:col-span-2">
              <Label htmlFor="event-player">Jugador en cédula</Label>
              <select
                id="event-player"
                name="player_registration_id"
                required
                disabled={pending}
                className="h-8 rounded-[4px] border border-[#D0D5DB] bg-white px-2 text-sm"
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
              </select>
            </div>
            <div className="grid gap-1">
              <Label htmlFor="event-type">Tipo</Label>
              <select
                id="event-type"
                name="event_type"
                required
                defaultValue={defaultEventType}
                disabled={pending}
                className="h-8 rounded-[4px] border border-[#D0D5DB] bg-white px-2 text-sm"
              >
                {(Object.keys(MATCH_EVENT_LABELS) as MatchEventType[]).map(
                  (t) => (
                    <option key={t} value={t}>
                      {MATCH_EVENT_LABELS[t]}
                    </option>
                  )
                )}
              </select>
            </div>
            <div className="grid gap-1">
              <Label htmlFor="event-qty">Cantidad</Label>
              <Input
                id="event-qty"
                name="quantity"
                type="number"
                min={1}
                defaultValue={1}
                className="rounded-[4px] font-mono"
                disabled={pending}
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="event-minute">Minuto</Label>
              <Input
                id="event-minute"
                name="minute"
                type="number"
                min={0}
                className="rounded-[4px] font-mono"
                disabled={pending}
              />
            </div>
            <div className="sm:col-span-2">
              <Button
                type="submit"
                size="sm"
                disabled={pending}
                className="rounded-[2px] bg-[#00B7FF] text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white"
              >
                Agregar evento
              </Button>
            </div>
          </form>
        ) : null}

        {events.length === 0 ? (
          <p className="mt-4 text-sm text-[#5C6570]">Sin eventos.</p>
        ) : (
          <ul className="mt-4 divide-y divide-[#D0D5DB] border border-[#D0D5DB]">
            {events.map((ev) => {
              const player = playerById.get(ev.playerRegistrationId);
              return (
                <li
                  key={ev.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
                >
                  <span>
                    <span className="font-medium">
                      {MATCH_EVENT_LABELS[ev.eventType]}
                    </span>
                    {ev.quantity > 1 ? ` ×${ev.quantity}` : ""}
                    {" · "}
                    {player?.name ?? "Jugador"}
                    {ev.minute != null ? ` · ${ev.minute}'` : ""}
                  </span>
                  {!closed ? (
                    <Button
                      type="button"
                      size="xs"
                      variant="ghost"
                      className="rounded-[2px] text-[#DC2626]"
                      disabled={pending}
                      onClick={() =>
                        run(() => deleteMatchEvent(orgSlug, matchId, ev.id))
                      }
                    >
                      <Trash2Icon />
                      Quitar
                    </Button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="border border-[#D0D5DB] bg-white p-4">
        <h2 className="text-base font-semibold text-[#0A0A0A]">Cierre</h2>
        <form
          action={closed ? onSaveMeta : onClose}
          className="mt-4 grid gap-4"
        >
          <div className="grid gap-2">
            <Label htmlFor="referee_name">Nombre del árbitro</Label>
            <Input
              id="referee_name"
              name="referee_name"
              required={!closed}
              defaultValue={refereeName}
              className="rounded-[4px]"
              disabled={closed || pending}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="observations">Observaciones</Label>
            <textarea
              id="observations"
              name="observations"
              rows={3}
              defaultValue={observations}
              disabled={closed || pending}
              className="w-full rounded-[4px] border border-[#D0D5DB] bg-white px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
            />
          </div>
          {showShootout || shootoutWinnerTeamId ? (
            <div className="grid gap-2">
              <Label htmlFor="shootout_winner_team_id">
                Ganador por penales (J.E.G.)
              </Label>
              <select
                id="shootout_winner_team_id"
                name="shootout_winner_team_id"
                defaultValue={shootoutWinnerTeamId ?? ""}
                disabled={closed || pending}
                className="h-8 max-w-sm rounded-[4px] border border-[#D0D5DB] bg-white px-2 text-sm"
              >
                <option value="">Sin definir</option>
                <option value={homeTeamId}>{homeTeamName}</option>
                <option value={awayTeamId}>{awayTeamName}</option>
              </select>
            </div>
          ) : (
            <input type="hidden" name="shootout_winner_team_id" value="" />
          )}
          {!closed ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-[2px]"
                disabled={pending}
                onClick={() => {
                  const fd = new FormData();
                  fd.set("sheet_id", sheetId);
                  const nameEl = document.getElementById(
                    "referee_name"
                  ) as HTMLInputElement | null;
                  const obsEl = document.getElementById(
                    "observations"
                  ) as HTMLTextAreaElement | null;
                  const shootEl = document.getElementById(
                    "shootout_winner_team_id"
                  ) as HTMLSelectElement | null;
                  fd.set("referee_name", nameEl?.value ?? "");
                  fd.set("observations", obsEl?.value ?? "");
                  fd.set(
                    "shootout_winner_team_id",
                    shootEl?.value ?? ""
                  );
                  run(() => saveSheetMeta(orgSlug, matchId, fd));
                }}
              >
                Guardar borrador
              </Button>
              <Button
                type="submit"
                disabled={pending}
                className="rounded-[2px] bg-[#0A0A0A] text-white hover:bg-[#00B7FF] hover:text-[#0A0A0A]"
              >
                Cerrar cédula
              </Button>
            </div>
          ) : null}
        </form>
      </section>

      {error ? (
        <p className="text-sm text-[#DC2626]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
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
    <div>
      <h3 className="mb-2 text-sm font-semibold text-[#0A0A0A]">{title}</h3>
      {players.length === 0 ? (
        <p className="text-sm text-[#5C6570]">Sin elegibles.</p>
      ) : (
        <ul className="space-y-2">
          {players.map((p) => (
            <li key={p.id}>
              <label className="flex cursor-pointer items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 accent-[#00B7FF]"
                  checked={selected.has(p.id)}
                  disabled={disabled}
                  onChange={() => onToggle(p.id)}
                />
                <span className="font-medium text-[#0A0A0A]">
                  {p.jersey != null ? `#${p.jersey} ` : ""}
                  {p.name}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
