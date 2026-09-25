import { redirect } from "next/navigation";
import { getOrgAccess } from "@/components/ops/access";
import { ModulePageHeader } from "@/components/ops/module-page-header";
import { PlayersTable } from "@/components/players/players-table";
import { RegisterPlayerDialog } from "@/components/players/register-player-dialog";
import { createClient } from "@/lib/supabase/server";
import type { ApprovalStatus, EligibilityStatus } from "@/types/database";

type PageProps = {
  params: Promise<{ orgSlug: string }>;
};

export default async function PlayersPage({ params }: PageProps) {
  const { orgSlug } = await params;
  const access = await getOrgAccess(orgSlug);

  if (!access.isDelegado && !access.isAdmin) {
    redirect(`/${orgSlug}`);
  }

  const teamId = access.managedTeamId;
  const supabase = await createClient();
  const orgId = access.membership.organization_id;

  let teamName: string | null = null;
  if (teamId) {
    const { data: team } = await supabase
      .from("teams")
      .select("name")
      .eq("id", teamId)
      .eq("organization_id", orgId)
      .maybeSingle();
    teamName = team?.name ?? null;
  }

  const rows =
    teamId == null
      ? []
      : await (async () => {
          const { data, error } = await supabase
            .from("player_registrations")
            .select(
              `
              id,
              folio,
              jersey_number,
              status,
              eligibility,
              player:players(
                first_names,
                last_names,
                id_number,
                classification,
                photo_url
              )
            `
            )
            .eq("organization_id", orgId)
            .eq("team_id", teamId)
            .order("created_at", { ascending: true });

          if (error) throw error;

          return (data ?? []).map((row) => {
            const player = unwrapOne(row.player);
            return {
              id: row.id,
              folio: row.folio,
              jerseyNumber: row.jersey_number,
              status: row.status as ApprovalStatus,
              eligibility: row.eligibility as EligibilityStatus,
              firstNames: player?.first_names ?? "",
              lastNames: player?.last_names ?? "",
              idNumber: player?.id_number ?? null,
              classification: player?.classification ?? null,
              photoUrl: player?.photo_url ?? null,
            };
          });
        })();

  return (
    <section className="mx-auto w-full max-w-5xl">
      <ModulePageHeader
        band="players"
        title="Jugadores"
        description={
          teamId
            ? `Plantilla de ${teamName ?? "tu equipo"}. Solicita credenciales y sigue el estado.`
            : "Todavía no tienes un equipo asignado como delegado."
        }
        actions={
          teamId && access.isDelegado ? (
            <RegisterPlayerDialog orgSlug={orgSlug} />
          ) : null
        }
      />

      {!teamId ? (
        <div className="border border-dashed border-border bg-card px-6 py-12 text-center">
          <p className="text-base font-medium text-foreground">
            Sin equipo asignado
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Pídele al administrador un invite de delegado ligado a un equipo.
          </p>
        </div>
      ) : (
        <PlayersTable orgSlug={orgSlug} rows={rows} />
      )}
    </section>
  );
}

function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}
