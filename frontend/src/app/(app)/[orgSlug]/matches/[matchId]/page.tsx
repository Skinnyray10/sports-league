import Link from "next/link";
import { notFound } from "next/navigation";
import { getMatchAccess, isAssignedReferee } from "@/components/matches/access";
import { MatchPageHeader } from "@/components/matches/page-header";
import { MatchResultForm } from "@/components/matches/match-result-form";
import { MatchSetsEditor } from "@/components/matches/match-sets-editor";
import { MatchStatusBadge } from "@/components/matches/match-status-badge";
import {
  ScheduleChangeHistory,
  type ScheduleChangeRow,
} from "@/components/matches/schedule-change-history";
import { createClient } from "@/lib/supabase/server";
import type { Branch, ScoreType } from "@/types/database";
import {
  BRANCH_LABELS,
  MATCH_STAGE_LABELS,
  scoreNoun,
  sportLabel,
} from "@/lib/labels";

type PageProps = {
  params: Promise<{ orgSlug: string; matchId: string }>;
};

export default async function MatchDetailPage({ params }: PageProps) {
  const { orgSlug, matchId } = await params;
  const access = await getMatchAccess(orgSlug);
  const orgId = access.membership.organization_id;
  const supabase = await createClient();

  const { data: match, error } = await supabase
    .from("matches")
    .select(
      `
      *,
      tournament:tournaments(id, name, season),
      division:divisions(
        id,
        branch,
        sport:sports(name, key, score_type, allows_draws),
        category:categories(name)
      ),
      group:groups(id, name),
      home_team:teams!matches_home_team_id_fkey(id, name),
      away_team:teams!matches_away_team_id_fkey(id, name)
    `
    )
    .eq("id", matchId)
    .eq("organization_id", orgId)
    .maybeSingle();

  if (error) throw error;
  if (!match) notFound();

  const tournament = unwrapOne(match.tournament);
  const division = unwrapOne(match.division);
  const sport = division ? unwrapOne(division.sport) : null;
  const category = division ? unwrapOne(division.category) : null;
  const group = unwrapOne(match.group);
  const homeTeam = unwrapOne(match.home_team);
  const awayTeam = unwrapOne(match.away_team);
  const scoreType = (sport?.score_type ?? "goals") as ScoreType;
  const usesSets = scoreType === "sets";
  const scoreLabel = scoreNoun(scoreType);
  const branch = division?.branch as Branch | undefined;

  const [
    { data: sets, error: setsError },
    { data: changesRaw, error: changesError },
    { data: refereeMemberships, error: refereesError },
  ] = await Promise.all([
    usesSets
      ? supabase
          .from("match_sets")
          .select("*")
          .eq("match_id", matchId)
          .eq("organization_id", orgId)
          .order("set_number", { ascending: true })
      : Promise.resolve({ data: [] as never[], error: null }),
    supabase
      .from("match_schedule_changes")
      .select(
        "id, change_type, reason, previous_scheduled_at, new_scheduled_at, previous_venue, new_venue, previous_status, new_status, created_at"
      )
      .eq("match_id", matchId)
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false }),
    supabase
      .from("memberships")
      .select("user_id")
      .eq("organization_id", orgId)
      .eq("role", "referee"),
  ]);

  if (setsError) throw setsError;
  if (changesError) throw changesError;
  if (refereesError) throw refereesError;

  const refereeIds = (refereeMemberships ?? []).map((m) => m.user_id);
  const profileIds = Array.from(
    new Set([
      ...refereeIds,
      ...(match.referee_id ? [match.referee_id] : []),
    ])
  );

  const { data: profiles } =
    profileIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, nombre, apellido")
          .in("id", profileIds)
      : { data: [] };

  const profileMap = new Map(
    (profiles ?? []).map((p) => [
      p.id,
      `${p.nombre} ${p.apellido}`.trim() || "Árbitro",
    ])
  );

  const referees = refereeIds.map((userId) => ({
    userId,
    label: profileMap.get(userId) ?? "Árbitro",
  }));

  const refereeName = match.referee_id
    ? (profileMap.get(match.referee_id) ?? "Árbitro asignado")
    : null;

  const changes: ScheduleChangeRow[] = (changesRaw ?? []).map((c) => ({
    id: c.id,
    changeType: c.change_type,
    reason: c.reason,
    previousScheduledAt: c.previous_scheduled_at,
    newScheduledAt: c.new_scheduled_at,
    previousVenue: c.previous_venue,
    newVenue: c.new_venue,
    previousStatus: c.previous_status,
    newStatus: c.new_status,
    createdAt: c.created_at,
  }));

  const assigned =
    isAssignedReferee(match, access.membership.user_id) &&
    access.roles.includes("referee");
  const canViewSheet =
    assigned ||
    access.roles.includes("admin") ||
    access.roles.includes("team_manager");

  const descriptionParts = [
    tournament ? `${tournament.name} · ${tournament.season}` : null,
    sport ? sportLabel(sport.key ?? sport.name) : null,
    branch ? BRANCH_LABELS[branch] : null,
    category?.name ?? null,
    group?.name ?? null,
  ].filter(Boolean);

  return (
    <div className="mx-auto max-w-3xl">
      <MatchPageHeader
        title={`${homeTeam?.name ?? "Local"} vs ${awayTeam?.name ?? "Visitante"}`}
        description={
          descriptionParts.length > 0
            ? descriptionParts.join(" · ")
            : "Detalle del partido"
        }
        actions={
          <Link
            href={`/${orgSlug}/matches`}
            className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Volver a partidos
          </Link>
        }
      />

      <div className="mb-8 flex flex-wrap items-center gap-3 border border-border bg-card px-5 py-4">
        <MatchStatusBadge status={match.status} />
        <p className="font-mono text-2xl font-semibold tabular-nums tracking-tight text-foreground">
          {match.status === "finalizado"
            ? `${match.home_score}–${match.away_score}`
            : "vs"}
        </p>
        <div className="text-sm text-muted-foreground">
          <p>
            {match.scheduled_at
              ? new Intl.DateTimeFormat("es-MX", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(match.scheduled_at))
              : "Sin fecha"}
            {match.venue ? ` · ${match.venue}` : ""}
          </p>
          <p className="mt-0.5">
            {match.jornada != null ? `Jornada ${match.jornada}` : "Sin jornada"}
            {" · "}
            {MATCH_STAGE_LABELS[match.stage] ?? match.stage}
            {refereeName ? ` · Árbitro: ${refereeName}` : " · Sin árbitro"}
          </p>
          {match.status_reason ? (
            <p className="mt-0.5 italic">{match.status_reason}</p>
          ) : null}
          {assigned ? (
            <p className="mt-1 text-foreground">
              Estás asignado como árbitro.{" "}
              <Link
                href={`/${orgSlug}/referee/${match.id}`}
                className="font-medium underline underline-offset-4"
              >
                Abrir cédula
              </Link>
            </p>
          ) : canViewSheet ? (
            <p className="mt-1">
              <Link
                href={`/${orgSlug}/referee/${match.id}`}
                className="font-medium text-foreground underline underline-offset-4"
              >
                Ver cédula
              </Link>
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6">
        <MatchResultForm
          orgSlug={orgSlug}
          matchId={match.id}
          homeScore={match.home_score}
          awayScore={match.away_score}
          status={match.status}
          scoreLabel={scoreLabel}
          canEditSchedule={access.canEditSchedule}
          canAssignReferee={access.canAssignReferee}
          canDelete={access.canDeleteMatch}
          jornada={match.jornada}
          stage={match.stage}
          venue={match.venue}
          scheduledAt={match.scheduled_at}
          refereeId={match.referee_id}
          referees={referees}
        />

        <ScheduleChangeHistory changes={changes} />

        {usesSets ? (
          <MatchSetsEditor
            orgSlug={orgSlug}
            matchId={match.id}
            sets={sets ?? []}
            canEdit={access.canEditSchedule && match.status !== "finalizado"}
          />
        ) : null}
      </div>
    </div>
  );
}

function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}
