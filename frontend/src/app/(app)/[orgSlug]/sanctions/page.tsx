import { requireOrgRole } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { ModulePageHeader } from "@/components/ops/module-page-header";
import { EmptyState } from "@/components/states/empty-state";
import {
  CreateSanctionDialog,
  type PlayerOption,
} from "@/components/sanctions/create-sanction-dialog";
import {
  SanctionsTable,
  type SanctionRow,
} from "@/components/sanctions/sanctions-table";
import { unwrapOne } from "@/lib/utils";

type PageProps = {
  params: Promise<{ orgSlug: string }>;
};

export default async function SanctionsPage({ params }: PageProps) {
  const { orgSlug } = await params;
  const membership = await requireOrgRole(orgSlug, ["admin"]);
  const orgId = membership.organization_id;
  const supabase = await createClient();

  const [
    { data: sanctionsRaw, error: sanctionsError },
    { data: registrationsRaw, error: registrationsError },
  ] = await Promise.all([
    supabase
      .from("sanctions")
      .select(
        `id, reason, jornada, sanction, created_at,
         team:teams(name),
         registration:player_registrations(player:players(first_names, last_names))`
      )
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false }),
    supabase
      .from("player_registrations")
      .select("id, team:teams(name), player:players(first_names, last_names)")
      .eq("organization_id", orgId),
  ]);
  if (sanctionsError) throw sanctionsError;
  if (registrationsError) throw registrationsError;

  const fullName = (
    p: { first_names: string; last_names: string } | null
  ): string => (p ? `${p.first_names} ${p.last_names}`.trim() : "Jugador");

  const sanctions: SanctionRow[] = (sanctionsRaw ?? []).map((s) => {
    const registration = unwrapOne(s.registration);
    return {
      id: s.id,
      playerName: fullName(registration ? unwrapOne(registration.player) : null),
      teamName: unwrapOne(s.team)?.name ?? "Equipo",
      reason: s.reason,
      jornada: s.jornada,
      sanction: s.sanction,
      createdAt: s.created_at,
    };
  });

  const players: PlayerOption[] = (registrationsRaw ?? [])
    .map((r) => ({
      id: r.id,
      name: fullName(unwrapOne(r.player)),
      teamName: unwrapOne(r.team)?.name ?? "Equipo",
    }))
    .sort(
      (a, b) =>
        a.teamName.localeCompare(b.teamName, "es") ||
        a.name.localeCompare(b.name, "es")
    );

  return (
    <section className="mx-auto w-full max-w-5xl">
      <ModulePageHeader
        band="approvals"
        title="Castigados"
        description="Jugadores castigados: la falta, en qué jornada fue y cuántos juegos se pierde."
        actions={
          sanctions.length > 0 ? (
            <CreateSanctionDialog orgSlug={orgSlug} players={players} />
          ) : null
        }
      />
      {sanctions.length > 0 ? (
        <SanctionsTable orgSlug={orgSlug} sanctions={sanctions} />
      ) : players.length === 0 ? (
        <EmptyState
          title="No hay castigados"
          description="Cuando los delegados registren a sus jugadores, aquí podrás anotar los castigos."
        />
      ) : (
        <EmptyState
          title="No hay castigados"
          description="Si un jugador recibe un castigo, anota la falta y cuántos juegos se pierde."
          action={
            <CreateSanctionDialog
              orgSlug={orgSlug}
              players={players}
              label="Agregar un castigo"
            />
          }
        />
      )}
    </section>
  );
}
