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

  const [{ data: tournaments, error: tournamentsError }, { data: sports, error: sportsError }] =
    await Promise.all([
      supabase
        .from("tournaments")
        .select("id, name, season, format, legs, status, sport:sports(name)")
        .eq("organization_id", access.membership.organization_id)
        .order("created_at", { ascending: false }),
      supabase.from("sports").select("id, name").order("name", { ascending: true }),
    ]);

  if (tournamentsError) {
    throw tournamentsError;
  }
  if (sportsError) {
    throw sportsError;
  }

  const rows = (tournaments ?? []).map((row) => {
    const sport = row.sport as { name: string } | { name: string }[] | null;
    const sportName = Array.isArray(sport)
      ? sport[0]?.name
      : sport?.name;
    return {
      id: row.id,
      name: row.name,
      season: row.season,
      format: row.format,
      legs: row.legs,
      status: row.status as TournamentStatus,
      sport_name: sportName ?? "—",
    };
  });

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <ModulePageHeader
        band="tournaments"
        title="Torneos"
        description="Las competencias de tu organización. Al crear una, inscribes los equipos que van a jugar."
        actions={
          access.canManageStaff ? (
            <CreateTournamentDialog
              orgSlug={orgSlug}
              sports={sports ?? []}
            />
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
