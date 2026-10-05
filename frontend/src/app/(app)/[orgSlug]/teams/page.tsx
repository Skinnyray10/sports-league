import { createClient } from "@/lib/supabase/server";
import { getOrgAccess } from "@/components/ops/access";
import { ModulePageHeader } from "@/components/ops/module-page-header";
import { CreateTeamDialog } from "@/components/teams/create-team-dialog";
import { TeamsTable, type TeamListRow } from "@/components/teams/teams-table";
import { BRANCH_LABELS, sportLabel } from "@/lib/labels";
import type { Branch } from "@/types/database";
import { unwrapOne } from "@/lib/utils";

type TeamsPageProps = {
  params: Promise<{ orgSlug: string }>;
};

export default async function TeamsPage({ params }: TeamsPageProps) {
  const { orgSlug } = await params;
  const access = await getOrgAccess(orgSlug);
  const orgId = access.membership.organization_id;
  const supabase = await createClient();

  const [
    { data: teamsRaw, error: teamsError },
    { data: clubs, error: clubsError },
    { data: divisionsRaw, error: divisionsError },
    { data: groups, error: groupsError },
  ] = await Promise.all([
    supabase
      .from("teams")
      .select(
        "id, name, logo_url, club:clubs(name), group:groups(name), division:divisions(name, branch, sport:sports(key, name), category:categories(name), tournament:tournaments(name))"
      )
      .eq("organization_id", orgId)
      .order("name", { ascending: true }),
    supabase
      .from("clubs")
      .select("id, name")
      .eq("organization_id", orgId)
      .order("name", { ascending: true }),
    supabase
      .from("divisions")
      .select(
        "id, name, branch, sport:sports(key, name), category:categories(name), tournament:tournaments(name)"
      )
      .eq("organization_id", orgId)
      .order("created_at", { ascending: true }),
    supabase
      .from("groups")
      .select("id, name, division_id")
      .eq("organization_id", orgId)
      .order("name", { ascending: true }),
  ]);

  if (teamsError) throw teamsError;
  if (clubsError) throw clubsError;
  if (divisionsError) throw divisionsError;
  if (groupsError) throw groupsError;

  const teams: TeamListRow[] = (teamsRaw ?? []).flatMap((row) => {
    const club = unwrapOne(
      row.club as { name: string } | { name: string }[] | null
    );
    const group = unwrapOne(
      row.group as { name: string } | { name: string }[] | null
    );
    const division = unwrapOne(
      row.division as
        | {
            name: string | null;
            branch: Branch;
            sport: { key: string; name: string } | { key: string; name: string }[] | null;
            category: { name: string } | { name: string }[] | null;
            tournament: { name: string } | { name: string }[] | null;
          }
        | {
            name: string | null;
            branch: Branch;
            sport: { key: string; name: string } | { key: string; name: string }[] | null;
            category: { name: string } | { name: string }[] | null;
            tournament: { name: string } | { name: string }[] | null;
          }[]
        | null
    );
    if (!club || !division) return [];
    const sport = unwrapOne(division.sport);
    const category = unwrapOne(division.category);
    if (!sport || !category) return [];

    return [
      {
        id: row.id,
        name: row.name,
        logo_url: row.logo_url,
        club_name: club.name,
        sport_key: sport.key,
        branch: division.branch,
        category_name: category.name,
        group_name: group?.name ?? null,
        division_label: `${sportLabel(sport.key)} · ${BRANCH_LABELS[division.branch]} · ${category.name}`,
      },
    ];
  });

  const divisions = (divisionsRaw ?? []).flatMap((row) => {
    const sport = unwrapOne(
      row.sport as
        | { key: string; name: string }
        | { key: string; name: string }[]
        | null
    );
    const category = unwrapOne(
      row.category as { name: string } | { name: string }[] | null
    );
    const tournament = unwrapOne(
      row.tournament as { name: string } | { name: string }[] | null
    );
    if (!sport || !category || !tournament) return [];
    return [
      {
        id: row.id,
        label:
          row.name?.trim() ||
          `${sportLabel(sport.key)} · ${BRANCH_LABELS[row.branch as Branch]} · ${category.name}`,
        tournament_name: tournament.name,
        sport_key: sport.key,
        branch: row.branch as Branch,
        category_name: category.name,
      },
    ];
  });

  return (
    <section className="mx-auto w-full max-w-5xl">
      <ModulePageHeader
        band="teams"
        title="Equipos"
        description="Cada equipo pertenece a un club y a una división (deporte, rama y categoría)."
        actions={
          access.canManageStaff ? (
            <CreateTeamDialog
              orgSlug={orgSlug}
              clubs={clubs ?? []}
              divisions={divisions}
              groups={groups ?? []}
            />
          ) : null
        }
      />
      <TeamsTable
        orgSlug={orgSlug}
        teams={teams}
        canManageStaff={access.canManageStaff}
        managedTeamId={access.managedTeamId}
      />
    </section>
  );
}
