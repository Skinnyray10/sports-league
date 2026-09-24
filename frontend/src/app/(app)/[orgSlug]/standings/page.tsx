import { notFound } from "next/navigation";
import { getMembership } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { StandingsPageHeader } from "@/components/standings/page-header";
import {
  StandingsTable,
  toStandingRow,
} from "@/components/standings/standings-table";
import {
  TournamentFilter,
  type TournamentFilterOption,
} from "@/components/standings/tournament-filter";

type PageProps = {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ tournament?: string | string[] }>;
};

export default async function StandingsPage({
  params,
  searchParams,
}: PageProps) {
  const { orgSlug } = await params;
  const sp = await searchParams;
  const membership = await getMembership(orgSlug);
  if (!membership) notFound();

  const orgId = membership.organization_id;
  const supabase = await createClient();

  const { data: tournamentsRaw, error: tournamentsError } = await supabase
    .from("tournaments")
    .select("id, name, season")
    .eq("organization_id", orgId)
    .order("name");

  if (tournamentsError) throw tournamentsError;

  const tournaments: TournamentFilterOption[] = (tournamentsRaw ?? []).map(
    (t) => ({ id: t.id, name: t.name, season: t.season })
  );

  const tournamentParam = Array.isArray(sp.tournament)
    ? sp.tournament[0]
    : sp.tournament;
  const selectedId =
    tournamentParam && tournaments.some((t) => t.id === tournamentParam)
      ? tournamentParam
      : (tournaments[0]?.id ?? null);

  const rows =
    selectedId == null
      ? []
      : await loadStandings(supabase, orgId, selectedId);

  return (
    <div className="mx-auto max-w-6xl">
      <StandingsPageHeader
        title="Posiciones"
        description="Se calcula con los partidos finalizados. Ordena por puntos, luego diferencia."
        actions={
          <TournamentFilter
            orgSlug={orgSlug}
            tournaments={tournaments}
            selectedId={selectedId}
          />
        }
      />
      <StandingsTable rows={rows} hasTournament={selectedId != null} />
    </div>
  );
}

async function loadStandings(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  tournamentId: string
) {
  const { data, error } = await supabase
    .from("standings")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("tournament_id", tournamentId);

  if (error) throw error;

  return (data ?? []).map(toStandingRow);
}
