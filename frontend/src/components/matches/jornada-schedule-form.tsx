"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveJornadaSchedule } from "@/app/(app)/[orgSlug]/matches/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type JornadaMatch = {
  id: string;
  home: string;
  away: string;
  stageLabel: string | null;
  locked: boolean;
  result: string | null;
  date: string;
  time: string;
  venue: string;
};

type Row = Pick<JornadaMatch, "date" | "time" | "venue">;

type JornadaScheduleFormProps = {
  orgSlug: string;
  matches: JornadaMatch[];
  venues: string[];
};

export function JornadaScheduleForm({
  orgSlug,
  matches,
  venues,
}: JornadaScheduleFormProps) {
  const router = useRouter();
  const [rows, setRows] = React.useState<Record<string, Row>>(() =>
    Object.fromEntries(
      matches.map((m) => [m.id, { date: m.date, time: m.time, venue: m.venue }])
    )
  );
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function update(id: string, patch: Partial<Row>) {
    setRows((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  // Al elegir un día, se copia a los partidos de abajo que aún no tienen día.
  function updateDate(index: number, date: string) {
    setRows((prev) => {
      const next = { ...prev };
      matches.forEach((m, i) => {
        if (i === index || (i > index && !m.locked && !next[m.id].date)) {
          next[m.id] = { ...next[m.id], date };
        }
      });
      return next;
    });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const entries = matches
      .filter((m) => !m.locked)
      .map((m) => ({ matchId: m.id, ...rows[m.id] }));
    startTransition(async () => {
      const result = await saveJornadaSchedule(orgSlug, entries);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success("Horarios guardados.");
      router.refresh();
    });
  }

  return (
    <form data-guia="jornada" onSubmit={onSubmit} className="space-y-3">
      <datalist id="jornada-venues">
        {venues.map((v) => (
          <option key={v} value={v} />
        ))}
      </datalist>

      {matches.map((m, i) => (
        <fieldset
          key={m.id}
          disabled={pending || m.locked}
          className="border border-border bg-card p-4"
        >
          <legend className="sr-only">
            {m.home} contra {m.away}
          </legend>
          <p className="mb-3 flex flex-wrap items-baseline gap-x-2 font-medium text-foreground">
            <span className="text-muted-foreground">{i + 1}.</span>
            {m.home} <span className="text-muted-foreground">vs</span> {m.away}
            {m.stageLabel ? (
              <span className="text-sm text-muted-foreground">
                · {m.stageLabel}
              </span>
            ) : null}
            {m.result ? (
              <span className="ml-auto text-sm text-muted-foreground">
                Final {m.result}
              </span>
            ) : m.locked ? (
              <span className="ml-auto text-sm text-muted-foreground">
                Cancelado
              </span>
            ) : null}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1fr_7rem_1fr]">
            <div className="grid gap-1.5">
              <Label htmlFor={`date-${m.id}`}>Día</Label>
              <Input
                id={`date-${m.id}`}
                type="date"
                value={rows[m.id].date}
                onChange={(e) => updateDate(i, e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`time-${m.id}`}>Hora</Label>
              <Input
                id={`time-${m.id}`}
                type="time"
                step={300}
                value={rows[m.id].time}
                onChange={(e) => update(m.id, { time: e.target.value })}
              />
            </div>
            <div className="col-span-2 grid gap-1.5 sm:col-span-1">
              <Label htmlFor={`venue-${m.id}`}>Cancha</Label>
              <Input
                id={`venue-${m.id}`}
                list="jornada-venues"
                maxLength={120}
                placeholder="Ej. Nogales 1"
                value={rows[m.id].venue}
                onChange={(e) => update(m.id, { venue: e.target.value })}
              />
            </div>
          </div>
        </fieldset>
      ))}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="sticky bottom-0 -mx-4 border-t border-border bg-background/95 px-4 py-3 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0">
        <Button
          type="submit"
          className="w-full sm:w-auto"
          disabled={pending || matches.every((m) => m.locked)}
        >
          {pending ? "Guardando…" : "Guardar horarios"}
        </Button>
      </div>
    </form>
  );
}
