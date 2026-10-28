import { requireOrgRole } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { ModulePageHeader } from "@/components/ops/module-page-header";
import { CreateClubDialog } from "@/components/clubs/create-club-dialog";
import { ClubsTable } from "@/components/clubs/clubs-table";
import { EmptyState } from "@/components/states/empty-state";

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
    <section className="mx-auto w-full max-w-5xl">
      <ModulePageHeader
        band="clubs"
        title="Clubes"
        description="Los clubes agrupan equipos. Cada equipo pertenece a un club y a una división."
        actions={clubs?.length ? <CreateClubDialog orgSlug={orgSlug} /> : null}
      />
      {clubs?.length ? (
        <ClubsTable orgSlug={orgSlug} clubs={clubs} />
      ) : (
        <EmptyState
          title="Todavía no hay clubes"
          description="Un club es la institución o empresa que inscribe equipos. Empieza por aquí."
          action={<CreateClubDialog orgSlug={orgSlug} label="Agregar tu primer club" />}
        />
      )}
    </section>
  );
}
