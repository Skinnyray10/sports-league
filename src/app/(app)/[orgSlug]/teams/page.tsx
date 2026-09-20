import { createClient } from "@/lib/supabase/server";
import { getOrgAccess } from "@/components/ops/access";
import { ModulePageHeader } from "@/components/ops/module-page-header";
import { CreateTeamDialog } from "@/components/teams/create-team-dialog";
import { TeamsTable } from "@/components/teams/teams-table";

type TeamsPageProps = {
  params: Promise<{ orgSlug: string }>;
};

export default async function TeamsPage({ params }: TeamsPageProps) {
  const { orgSlug } = await params;
  const access = await getOrgAccess(orgSlug);
  const supabase = await createClient();

  const { data: teams, error } = await supabase
    .from("teams")
    .select("*")
    .eq("organization_id", access.membership.organization_id)
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <ModulePageHeader
        band="teams"
        title="Teams"
        description="Roster of clubs in this organization. Enroll them into tournaments when ready."
        actions={
          access.canManageStaff ? (
            <CreateTeamDialog orgSlug={orgSlug} />
          ) : null
        }
      />
      <TeamsTable
        orgSlug={orgSlug}
        teams={teams ?? []}
        canManageStaff={access.canManageStaff}
        managedTeamId={access.managedTeamId}
      />
    </section>
  );
}
