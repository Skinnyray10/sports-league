import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getOrgAccess } from "@/components/ops/access";
import { ModulePageHeader } from "@/components/ops/module-page-header";
import { DeleteTeamButton } from "@/components/teams/delete-team-button";
import { TeamEditForm } from "@/components/teams/team-edit-form";
import { Button } from "@/components/ui/button";

type TeamDetailPageProps = {
  params: Promise<{ orgSlug: string; teamId: string }>;
};

export default async function TeamDetailPage({ params }: TeamDetailPageProps) {
  const { orgSlug, teamId } = await params;
  const access = await getOrgAccess(orgSlug);
  const supabase = await createClient();

  const { data: team, error } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .eq("organization_id", access.membership.organization_id)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!team) {
    notFound();
  }

  const canEdit = access.canUpdateTeam(team.id);

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 rounded-[2px] px-0 text-[#5C6570] hover:bg-transparent hover:text-[#0A0A0A]"
        render={<Link href={`/${orgSlug}/teams`} />}
      >
        <ArrowLeftIcon data-icon="inline-start" />
        Todos los equipos
      </Button>

      <ModulePageHeader
        band="teams"
        title={team.name}
        description={
          canEdit
            ? "Los cambios se reflejan en todos sus torneos y partidos."
            : "Datos del equipo. Solo lectura con tu rol actual."
        }
        actions={
          access.canManageStaff ? (
            <DeleteTeamButton
              orgSlug={orgSlug}
              teamId={team.id}
              teamName={team.name}
            />
          ) : null
        }
      />

      {canEdit ? (
        <div className="border border-[#D0D5DB] bg-white p-5">
          <TeamEditForm
            orgSlug={orgSlug}
            teamId={team.id}
            initialName={team.name}
            initialLogoUrl={team.logo_url}
          />
        </div>
      ) : (
        <dl className="grid max-w-lg gap-4 border border-[#D0D5DB] bg-white p-5 text-sm">
          <div>
            <dt className="font-medium text-[#5C6570]">Nombre</dt>
            <dd className="mt-1 text-[#0A0A0A]">{team.name}</dd>
          </div>
          <div>
            <dt className="font-medium text-[#5C6570]">Logo</dt>
            <dd className="mt-1 break-all font-mono text-xs text-[#0A0A0A]">
              {team.logo_url ?? "—"}
            </dd>
          </div>
        </dl>
      )}
    </section>
  );
}
