import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getOrgAccess } from "@/components/ops/access";
import { ModulePageHeader } from "@/components/ops/module-page-header";
import { DeleteTeamButton } from "@/components/teams/delete-team-button";
import { TeamEditForm } from "@/components/teams/team-edit-form";
import { Button } from "@/components/ui/button";
import { BRANCH_LABELS, sportLabel } from "@/lib/labels";
import type { Branch } from "@/types/database";

type TeamDetailPageProps = {
  params: Promise<{ orgSlug: string; teamId: string }>;
};

function one<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export default async function TeamDetailPage({ params }: TeamDetailPageProps) {
  const { orgSlug, teamId } = await params;
  const access = await getOrgAccess(orgSlug);
  const supabase = await createClient();

  const { data: team, error } = await supabase
    .from("teams")
    .select(
      "id, name, logo_url, club:clubs(name), group:groups(name), division:divisions(name, branch, sport:sports(key, name), category:categories(name), tournament:tournaments(name))"
    )
    .eq("id", teamId)
    .eq("organization_id", access.membership.organization_id)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!team) {
    notFound();
  }

  const club = one(team.club as { name: string } | { name: string }[] | null);
  const group = one(
    team.group as { name: string } | { name: string }[] | null
  );
  const division = one(
    team.division as
      | {
          name: string | null;
          branch: Branch;
          sport:
            | { key: string; name: string }
            | { key: string; name: string }[]
            | null;
          category: { name: string } | { name: string }[] | null;
          tournament: { name: string } | { name: string }[] | null;
        }
      | {
          name: string | null;
          branch: Branch;
          sport:
            | { key: string; name: string }
            | { key: string; name: string }[]
            | null;
          category: { name: string } | { name: string }[] | null;
          tournament: { name: string } | { name: string }[] | null;
        }[]
      | null
  );
  const sport = division ? one(division.sport) : null;
  const category = division ? one(division.category) : null;
  const tournament = division ? one(division.tournament) : null;

  const canEdit = access.canUpdateTeam(team.id);
  const divisionSummary =
    sport && category && division
      ? `${sportLabel(sport.key)} · ${BRANCH_LABELS[division.branch]} · ${category.name}`
      : "—";

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 rounded-[2px] px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
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
            ? "Puedes actualizar el nombre y el logo. Club y división se definen al crear el equipo."
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

      <dl className="mb-6 grid max-w-lg gap-4 border border-border bg-card p-5 text-sm">
        <div>
          <dt className="font-medium text-muted-foreground">Club</dt>
          <dd className="mt-1 text-foreground">{club?.name ?? "—"}</dd>
        </div>
        <div>
          <dt className="font-medium text-muted-foreground">Torneo</dt>
          <dd className="mt-1 text-foreground">{tournament?.name ?? "—"}</dd>
        </div>
        <div>
          <dt className="font-medium text-muted-foreground">División</dt>
          <dd className="mt-1 text-foreground">{divisionSummary}</dd>
        </div>
        <div>
          <dt className="font-medium text-muted-foreground">Grupo</dt>
          <dd className="mt-1 text-foreground">{group?.name ?? "—"}</dd>
        </div>
      </dl>

      {canEdit ? (
        <div className="border border-border bg-card p-5">
          <TeamEditForm
            orgSlug={orgSlug}
            teamId={team.id}
            initialName={team.name}
            initialLogoUrl={team.logo_url}
          />
        </div>
      ) : null}
    </section>
  );
}
