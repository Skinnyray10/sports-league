import { requireOrgRole } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { ModulePageHeader } from "@/components/ops/module-page-header";
import { CreateClubDialog } from "@/components/clubs/create-club-dialog";
import { ClubsTable } from "@/components/clubs/clubs-table";

type ClubsPageProps = {
  params: Promise<{ orgSlug: string }>;
};

export default async function ClubsPage({ params }: ClubsPageProps) {
  const { orgSlug } = await params;
  const membership = await requireOrgRole(orgSlug, ["admin"]);
  const supabase = await createClient();

  const { data: clubs, error } = await supabase
    .from("clubs")
    .select("*")
    .eq("organization_id", membership.organization_id)
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <ModulePageHeader
        band="clubs"
        title="Clubes"
        description="Los clubes agrupan equipos. Cada equipo pertenece a un club y a una división."
        actions={<CreateClubDialog orgSlug={orgSlug} />}
      />
      <ClubsTable orgSlug={orgSlug} clubs={clubs ?? []} />
    </section>
  );
}
