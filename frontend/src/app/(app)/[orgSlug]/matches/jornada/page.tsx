import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { getMatchAccess } from "@/components/matches/access";
import {
  JornadaScheduleForm,
  type JornadaMatch,
} from "@/components/matches/jornada-schedule-form";
import { ModulePageHeader } from "@/components/ops/module-page-header";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { BRANCH_LABELS, MATCH_STAGE_LABELS, sportLabel } from "@/lib/labels";
import { toMxParts } from "@/lib/mx-time";
import { createClient } from "@/lib/supabase/server";
import { cn, unwrapOne } from "@/lib/utils";
import type { Branch } from "@/types/database";

type PageProps = {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ division?: string; j?: string }>;
};

const DONE = new Set(["finalizado", "cancelado"]);
const PLAYOFFS = "liguilla";

export default async function JornadaPage({ params, searchParams }: PageProps) {
  const { orgSlug } = await params;
  const sp = await searchParams;
  const access = await getMatchAccess(orgSlug);
  if (!access.canEditSchedule) notFound();
  const orgId = access.membership.organization_id;
  const supabase = await createClient();

  const { data: divisionsRaw, error: divisionsError } = await supabase
    .from("divisions")
    .select(
      "id, name, branch, tournament:tournaments(name), sport:sports(key), category:categories(name)"
    )
    .eq("organization_id", orgId)
    .order("created_at");
  if (divisionsError) throw divisionsError;

  const divisions = (divisionsRaw ?? []).map((d) => {
    const tournament = unwrapOne(d.tournament);
    const sport = unwrapOne(d.sport);
    const category = unwrapOne(d.category);
    return {
      id: d.id,
      label:
        d.name?.trim() ||
        `${tournament?.name ?? "Torneo"} · ${sportLabel(sport?.key ?? "")} · ${BRANCH_LABELS[d.branch as Branch]} · ${category?.name ?? ""}`,
    };
  });

  const divisionId =
    divisions.find((d) => d.id === sp.division)?.id ?? divisions[0]?.id;

  const [{ data: matchesRaw, error: matchesError }, { data: teamsRaw, error: teamsError }] =
    divisionId
      ? await Promise.all([
          supabase
            .from("matches")
            .select(
              `id, jornada, stage, status, scheduled_at, venue, home_score, away_score,
               home_team:teams!matches_home_team_id_fkey(name),
               away_team:teams!matches_away_team_id_fkey(name)`
            )
            .eq("organization_id", orgId)
            .eq("division_id", divisionId)
            .order("scheduled_at", { ascending: true, nullsFirst: true }),
          supabase
            .from("teams")
            .select("name")
            .eq("organization_id", orgId)
            .eq("division_id", divisionId)
            .order("name"),
        ])
      : [{ data: [], error: null }, { data: [], error: null }];
  if (matchesError) throw matchesError;
  if (teamsError) throw teamsError;

  const all = (matchesRaw ?? []).map((m) => ({
    id: m.id,
    jornada: m.jornada,
    stage: m.stage,
    status: m.status,
    scheduledAt: m.scheduled_at,
    venue: m.venue,
    homeScore: m.home_score,
    awayScore: m.away_score,
    home: unwrapOne(m.home_team)?.name ?? "Local",
    away: unwrapOne(m.away_team)?.name ?? "Visitante",
  }));

  const keyOf = (m: (typeof all)[number]) =>
    m.stage === "regular" ? String(m.jornada ?? "") : PLAYOFFS;
  const keys = Array.from(new Set(all.map(keyOf))).sort((a, b) =>
    a === PLAYOFFS ? 1 : b === PLAYOFFS ? -1 : Number(a) - Number(b)
  );
  // Por defecto, la primera jornada que todavía tenga partidos por jugar.
  const pendingKey = keys.find((k) =>
    all.some((m) => keyOf(m) === k && !DONE.has(m.status))
  );
  const selected = keys.includes(sp.j ?? "")
    ? sp.j!
    : (pendingKey ?? keys.at(-1));

  const inJornada = all.filter((m) => keyOf(m) === selected);
  const playing = new Set(inJornada.flatMap((m) => [m.home, m.away]));
  const resting =
    selected === PLAYOFFS
      ? []
      : (teamsRaw ?? []).map((t) => t.name).filter((n) => !playing.has(n));
  const venues = Array.from(
    new Set(all.map((m) => m.venue).filter((v): v is string => !!v))
  ).sort();

  const formMatches: JornadaMatch[] = inJornada.map((m) => ({
    id: m.id,
    home: m.home,
    away: m.away,
    stageLabel: m.stage === "regular" ? null : MATCH_STAGE_LABELS[m.stage],
    locked: DONE.has(m.status),
    result: m.status === "finalizado" ? `${m.homeScore} - ${m.awayScore}` : null,
    venue: m.venue ?? "",
    ...toMxParts(m.scheduledAt),
  }));

  const jornadaHref = (k: string) =>
    `/${orgSlug}/matches/jornada?division=${divisionId}&j=${k}`;

  return (
    <div className="mx-auto max-w-3xl">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
        render={<Link href={`/${orgSlug}/matches`} />}
      >
        <ArrowLeftIcon data-icon="inline-start" />
        Partidos
      </Button>

      <ModulePageHeader
        band="matches"
        title="Armar jornada"
        description="Después de la junta, asigna día, hora y cancha a cada partido. Los enfrentamientos ya están definidos por el rol."
      />

      {divisions.length > 1 ? (
        <form className="mb-4 flex gap-2" action={`/${orgSlug}/matches/jornada`}>
          <NativeSelect name="division" defaultValue={divisionId} aria-label="División">
            {divisions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </NativeSelect>
          <Button type="submit" variant="outline">
            Ver
          </Button>
        </form>
      ) : null}

      {keys.length === 0 ? (
        <div className="border border-dashed border-border bg-card px-6 py-10 text-center">
          <p className="font-medium text-foreground">Todavía no hay rol de juegos</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Genéralo desde el torneo, en la tarjeta de la división.
          </p>
        </div>
      ) : (
        <>
          <nav
            aria-label="Jornadas"
            className="mb-4 flex gap-2 overflow-x-auto pb-1"
          >
            {keys.map((k) => (
              <Link
                key={k}
                href={jornadaHref(k)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1 text-sm",
                  k === selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:bg-secondary"
                )}
              >
                {k === PLAYOFFS ? "Liguilla" : `J-${k}`}
              </Link>
            ))}
          </nav>

          <JornadaScheduleForm
            key={`${divisionId}-${selected}`}
            orgSlug={orgSlug}
            matches={formMatches}
            venues={venues}
          />

          {resting.length > 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Descansa: {resting.join(", ")}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
