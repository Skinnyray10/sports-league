import Link from "next/link";
import { notFound } from "next/navigation";
import { getMatchAccess } from "@/components/matches/access";
import { MatchPageHeader } from "@/components/matches/page-header";
import { MatchResultForm } from "@/components/matches/match-result-form";
import { MatchSetsEditor } from "@/components/matches/match-sets-editor";
import { MatchStatusBadge } from "@/components/matches/match-status-badge";
import { createClient } from "@/lib/supabase/server";
import type { ScoreType } from "@/types/database";
import { scoreNoun, sportLabel } from "@/lib/labels";

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
      tournament:tournaments(
        id,
        name,
        season,
        sport:sports(name, score_type, allows_draws)
      ),
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
  const sport = tournament ? unwrapOne(tournament.sport) : null;
  const homeTeam = unwrapOne(match.home_team);
  const awayTeam = unwrapOne(match.away_team);
  const scoreType = (sport?.score_type ?? "goals") as ScoreType;
  const usesSets = scoreType === "sets";
  const scoreLabel = scoreNoun(scoreType);

  const { data: sets, error: setsError } = usesSets
    ? await supabase
        .from("match_sets")
        .select("*")
        .eq("match_id", matchId)
        .eq("organization_id", orgId)
        .order("set_number", { ascending: true })
    : { data: [], error: null };

  if (setsError) throw setsError;

  return (
    <div className="mx-auto max-w-3xl">
      <MatchPageHeader
        title={`${homeTeam?.name ?? "Local"} vs ${awayTeam?.name ?? "Visitante"}`}
        description={
          tournament
            ? `${tournament.name} · ${tournament.season}${
                sport ? ` · ${sportLabel(sport.name)}` : ""
              }`
            : "Detalle del partido"
        }
        actions={
          <Link
            href={`/${orgSlug}/matches`}
            className="text-sm font-medium text-[#5C6570] underline-offset-4 hover:text-[#0A0A0A] hover:underline"
          >
            Volver a partidos
          </Link>
        }
      />

      <div className="mb-8 flex flex-wrap items-center gap-3 border border-[#D0D5DB] bg-white px-5 py-4">
        <MatchStatusBadge status={match.status} />
        <p className="font-mono text-2xl font-semibold tabular-nums tracking-tight text-[#0A0A0A]">
          {match.home_score}–{match.away_score}
        </p>
        <p className="text-sm text-[#5C6570]">
          {scoreLabel} ·{" "}
          {match.scheduled_at
            ? new Intl.DateTimeFormat("es-MX", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(match.scheduled_at))
            : "Sin fecha"}
          {match.court_info ? ` · ${match.court_info}` : ""}
        </p>
      </div>

      <div className="grid gap-6">
        <MatchResultForm
          orgSlug={orgSlug}
          matchId={match.id}
          homeScore={match.home_score}
          awayScore={match.away_score}
          status={match.status}
          scoreLabel={scoreLabel}
          canUpdateResult={access.canUpdateResult}
          canEditSchedule={access.canEditSchedule}
          canDelete={access.canDeleteMatch}
          round={match.round}
          stage={match.stage}
          courtInfo={match.court_info}
          scheduledAt={match.scheduled_at}
        />

        {usesSets ? (
          <MatchSetsEditor
            orgSlug={orgSlug}
            matchId={match.id}
            sets={sets ?? []}
            canEdit={access.canUpdateResult}
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
