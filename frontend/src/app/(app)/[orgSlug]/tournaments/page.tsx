import { createClient } from "@/lib/supabase/server";
import { getOrgAccess } from "@/components/ops/access";
import { ModulePageHeader } from "@/components/ops/module-page-header";
import { CreateTournamentDialog } from "@/components/tournaments/create-tournament-dialog";
import { TournamentsList } from "@/components/tournaments/tournaments-list";
import type { TournamentStatus } from "@/types/database";

type TournamentsPageProps = {
  params: Promise<{ orgSlug: string }>;
};

export default async function TournamentsPage({
  params,
}: TournamentsPageProps) {
  const { orgSlug } = await params;
  const access = await getOrgAccess(orgSlug);
  const supabase = await createClient();
  const orgId = access.membership.organization_id;

  const [
    { data: tournaments, error: tournamentsError },
    { data: divisions, error: divisionsError },
  ] = await Promise.all([
    supabase
      .from("tournaments")
      .select("id, name, season, format, legs, status, created_at")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false }),
    supabase
      .from("divisions")
      .select("id, tournament_id")
      .eq("organization_id", orgId),
  ]);

  if (tournamentsError) throw tournamentsError;
  if (divisionsError) throw divisionsError;

  const divisionCountByTournament = new Map<string, number>();
  for (const d of divisions ?? []) {
    divisionCountByTournament.set(
      d.tournament_id,
      (divisionCountByTournament.get(d.tournament_id) ?? 0) + 1
    );
  }

  const rows = (tournaments ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    season: row.season,
    format: row.format,
    legs: row.legs,
    status: row.status as TournamentStatus,
    division_count: divisionCountByTournament.get(row.id) ?? 0,
  }));

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <ModulePageHeader
        band="tournaments"
        title="Torneos"
        description="Las competencias de tu organización. Dentro de cada torneo defines divisiones por deporte, rama y categoría."
        actions={
          access.canManageStaff ? (
            <CreateTournamentDialog orgSlug={orgSlug} />
          ) : null
        }
      />
      <TournamentsList
        orgSlug={orgSlug}
        tournaments={rows}
        canManageStaff={access.canManageStaff}
      />
    </section>
  );
}
