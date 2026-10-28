"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClockIcon, ShuffleIcon, Trash2Icon, TrophyIcon } from "lucide-react";
import {
  advancePlayoffs,
  deleteRoundRobin,
  generatePlayoffs,
  generateRoundRobin,
} from "@/app/(app)/[orgSlug]/tournaments/fixture-actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { PLAYOFF_SIZES } from "@/lib/fixtures";
import { MATCH_STAGE_LABELS } from "@/lib/labels";

export type DivisionFixtureSummary = {
  teamCount: number;
  regularMatches: number;
  regularPlayed: number;
  jornadas: number;
  playoffStages: string[];
};

type DivisionFixturesProps = {
  orgSlug: string;
  tournamentId: string;
  divisionId: string;
  summary: DivisionFixtureSummary;
};

export function DivisionFixtures({
  orgSlug,
  tournamentId,
  divisionId,
  summary,
}: DivisionFixturesProps) {
  const router = useRouter();
  const [size, setSize] = React.useState("8");
  const refresh = () => router.refresh();
  const hasRegular = summary.regularMatches > 0;
  const hasPlayoffs = summary.playoffStages.length > 0;
  const playoffsDone = summary.playoffStages.includes("final");

  return (
    <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center">
      {hasRegular ? (
        <>
          <p className="text-sm text-muted-foreground sm:mr-auto">
            Rol: {summary.regularMatches} partidos en {summary.jornadas}{" "}
            jornadas · {summary.regularPlayed} jugados
          </p>
          <Button
            variant="outline"
            size="sm"
            render={
              <Link
                href={`/${orgSlug}/matches/jornada?division=${divisionId}`}
              />
            }
          >
            <CalendarClockIcon data-icon="inline-start" />
            Armar jornada
          </Button>
          {summary.regularPlayed === 0 ? (
            <ConfirmDialog
              trigger={<Button type="button" variant="ghost" size="sm" />}
              triggerContent={
                <>
                  <Trash2Icon data-icon="inline-start" />
                  Borrar rol
                </>
              }
              title="¿Borrar el rol de juegos?"
              description="Se eliminan todos los partidos de temporada regular de esta división. Sólo es posible mientras no se haya jugado ninguno."
              confirmLabel="Borrar rol"
              pendingLabel="Borrando…"
              successMessage="Rol borrado."
              onConfirm={() =>
                deleteRoundRobin(orgSlug, tournamentId, divisionId)
              }
              onSuccess={refresh}
            />
          ) : null}
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground sm:mr-auto">
            {summary.teamCount < 2
              ? "Agrega al menos dos equipos para generar el rol."
              : `${summary.teamCount} equipos, todavía sin rol de juegos.`}
          </p>
          <ConfirmDialog
            trigger={
              <Button
                type="button"
                size="sm"
                data-guia="rol"
                disabled={summary.teamCount < 2}
              />
            }
            triggerContent={
              <>
                <ShuffleIcon data-icon="inline-start" />
                Generar rol de juegos
              </>
            }
            variant="default"
            title="¿Generar el rol de juegos?"
            description="Se crean todos los enfrentamientos (todos contra todos), repartidos por jornada y sin hora ni cancha. Los horarios se asignan cada semana en «Armar jornada»."
            confirmLabel="Generar rol"
            pendingLabel="Generando…"
            successMessage="Rol de juegos generado."
            onConfirm={() =>
              generateRoundRobin(orgSlug, tournamentId, divisionId)
            }
            onSuccess={refresh}
          />
        </>
      )}

      {hasRegular && !hasPlayoffs ? (
        <ConfirmDialog
          trigger={<Button type="button" variant="outline" size="sm" />}
          triggerContent={
            <>
              <TrophyIcon data-icon="inline-start" />
              Generar liguilla
            </>
          }
          variant="default"
          title="¿Generar la liguilla?"
          description="Se toma la tabla de temporada regular: el 1° juega contra el último clasificado, el 2° contra el penúltimo, y así. El mejor lugar es local."
          confirmLabel="Generar liguilla"
          pendingLabel="Generando…"
          successMessage="Liguilla generada."
          onConfirm={() =>
            generatePlayoffs(orgSlug, tournamentId, divisionId, Number(size))
          }
          onSuccess={refresh}
        >
          <div className="grid gap-2">
            <Label htmlFor={`playoff-size-${divisionId}`}>
              ¿Cuántos equipos clasifican?
            </Label>
            <NativeSelect
              id={`playoff-size-${divisionId}`}
              value={size}
              onChange={(e) => setSize(e.target.value)}
            >
              {[...PLAYOFF_SIZES].reverse().map((n) => (
                <option key={n} value={n}>
                  {n} equipos
                </option>
              ))}
            </NativeSelect>
          </div>
        </ConfirmDialog>
      ) : null}

      {hasPlayoffs ? (
        playoffsDone ? (
          <p className="text-sm text-muted-foreground">
            Liguilla completa: final programada.
          </p>
        ) : (
          <ConfirmDialog
            trigger={<Button type="button" variant="outline" size="sm" />}
            triggerContent={
              <>
                <TrophyIcon data-icon="inline-start" />
                Siguiente ronda
              </>
            }
            variant="default"
            title="¿Generar la siguiente ronda?"
            description={`Los ganadores de ${MATCH_STAGE_LABELS[summary.playoffStages.at(-1) ?? ""] ?? "la ronda"} se acomodan otra vez por su lugar en la tabla: el mejor contra el peor. Después de semifinales se crean la final y el partido por el tercer lugar.`}
            confirmLabel="Generar ronda"
            pendingLabel="Generando…"
            successMessage="Siguiente ronda generada."
            onConfirm={() =>
              advancePlayoffs(orgSlug, tournamentId, divisionId)
            }
            onSuccess={refresh}
          />
        )
      ) : null}
    </div>
  );
}
