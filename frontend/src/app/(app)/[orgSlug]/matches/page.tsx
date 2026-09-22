import Link from "next/link";
import { getMatchAccess } from "@/components/matches/access";
import {
  CreateMatchDialog,
  type EnrollmentOption,
  type TournamentOption,
} from "@/components/matches/create-match-dialog";
import { MatchPageHeader } from "@/components/matches/page-header";
import {
  MatchesTable,
  type MatchListRow,
} from "@/components/matches/matches-table";
import { createClient } from "@/lib/supabase/server";
import type { MatchStatus } from "@/types/database";

type PageProps = {
  params: Promise<{ orgSlug: string }>;
};

export default async function MatchesPage({ params }: PageProps) {
  const { orgSlug } = await params;
  const access = await getMatchAccess(orgSlug);
  const orgId = access.membership.organization_id;
  const supabase = await createClient();

  const [
    { data: matchesRaw, error: matchesError },
    { data: tournamentsRaw, error: tournamentsError },
    { data: enrollmentsRaw, error: enrollmentsError },
  ] = await Promise.all([
    supabase
      .from("matches")
      .select(
        `
        id,
        status,
        home_score,
        away_score,
        scheduled_at,
        round,
        stage,
        tournament:tournaments(name),
        home_team:teams!matches_home_team_id_fkey(name),
        away_team:teams!matches_away_team_id_fkey(name)
      `
      )
      .eq("organization_id", orgId)
      .order("scheduled_at", { ascending: true, nullsFirst: false }),
    supabase
      .from("tournaments")
      .select("id, name, season")
      .eq("organization_id", orgId)
      .order("name"),
    supabase
      .from("tournament_teams")
      .select("tournament_id, team_id, team:teams(name)")
      .eq("organization_id", orgId),
  ]);

  if (matchesError) throw matchesError;
  if (tournamentsError) throw tournamentsError;
  if (enrollmentsError) throw enrollmentsError;

  const matches: MatchListRow[] = (matchesRaw ?? []).map((row) => {
    const tournament = unwrapOne(row.tournament);
    const homeTeam = unwrapOne(row.home_team);
    const awayTeam = unwrapOne(row.away_team);
    return {
      id: row.id,
      status: row.status as MatchStatus,
      homeScore: row.home_score,
      awayScore: row.away_score,
      scheduledAt: row.scheduled_at,
      round: row.round,
      stage: row.stage,
      tournamentName: tournament?.name ?? "Torneo",
      homeTeamName: homeTeam?.name ?? "Local",
      awayTeamName: awayTeam?.name ?? "Visitante",
    };
  });

  const tournaments: TournamentOption[] = (tournamentsRaw ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    season: t.season,
  }));

  const enrollments: EnrollmentOption[] = (enrollmentsRaw ?? []).map((e) => {
    const team = unwrapOne(e.team);
    return {
      tournamentId: e.tournament_id,
      teamId: e.team_id,
      teamName: team?.name ?? "Equipo",
    };
  });

  return (
    <div className="mx-auto max-w-6xl">
      <MatchPageHeader
        title="Partidos"
        description="Programa la jornada, marca los que están en vivo y captura resultados. La tabla se actualiza sola."
        actions={
          access.canCreateMatch ? (
            tournaments.length > 0 ? (
              <CreateMatchDialog
                orgSlug={orgSlug}
                tournaments={tournaments}
                enrollments={enrollments}
              />
            ) : (
              <p className="text-sm text-[#5C6570]">
                <Link
                  href={`/${orgSlug}/tournaments`}
                  className="underline-offset-4 hover:underline"
                >
                  Crea un torneo
                </Link>{" "}
                e inscribe equipos para poder programar partidos.
              </p>
            )
          ) : null
        }
      />
      <MatchesTable
        orgSlug={orgSlug}
        matches={matches}
        canCreateMatch={access.canCreateMatch}
      />
    </div>
  );
}

function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}
