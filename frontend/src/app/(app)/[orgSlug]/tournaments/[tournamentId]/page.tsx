import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getOrgAccess } from "@/components/ops/access";
import { ModulePageHeader } from "@/components/ops/module-page-header";
import { DeleteTournamentButton } from "@/components/tournaments/delete-tournament-button";
import { TournamentEditForm } from "@/components/tournaments/tournament-edit-form";
import { TournamentEnrollment } from "@/components/tournaments/tournament-enrollment";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TournamentStatus } from "@/types/database";
import {
  TOURNAMENT_STATUS_LABELS,
  formatLabel,
  legsLabel,
  sportLabel,
} from "@/lib/labels";

type TournamentDetailPageProps = {
  params: Promise<{ orgSlug: string; tournamentId: string }>;
};

export default async function TournamentDetailPage({
  params,
}: TournamentDetailPageProps) {
  const { orgSlug, tournamentId } = await params;
  const access = await getOrgAccess(orgSlug);
  const orgId = access.membership.organization_id;
  const supabase = await createClient();

  const [
    { data: tournament, error: tournamentError },
    { data: sports, error: sportsError },
    { data: teams, error: teamsError },
    { data: enrollments, error: enrollError },
  ] = await Promise.all([
    supabase
      .from("tournaments")
      .select("*")
      .eq("id", tournamentId)
      .eq("organization_id", orgId)
      .maybeSingle(),
    supabase.from("sports").select("id, name").order("name", { ascending: true }),
    supabase
      .from("teams")
      .select("id, name")
      .eq("organization_id", orgId)
      .order("name", { ascending: true }),
    supabase
      .from("tournament_teams")
      .select("team_id, team:teams(id, name)")
      .eq("tournament_id", tournamentId)
      .eq("organization_id", orgId),
  ]);

  if (tournamentError) throw tournamentError;
  if (sportsError) throw sportsError;
  if (teamsError) throw teamsError;
  if (enrollError) throw enrollError;
  if (!tournament) notFound();

  const enrolled = (enrollments ?? []).flatMap((row) => {
    const team = row.team as
      | { id: string; name: string }
      | { id: string; name: string }[]
      | null;
    const resolved = Array.isArray(team) ? team[0] : team;
    return resolved ? [{ id: resolved.id, name: resolved.name }] : [];
  });
  const enrolledIds = new Set(enrolled.map((t) => t.id));
  const available = (teams ?? []).filter((t) => !enrolledIds.has(t.id));
  const sportName =
    (sports ?? []).find((s) => s.id === tournament.sport_id)?.name ?? "";

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 rounded-[2px] px-0 text-[#5C6570] hover:bg-transparent hover:text-[#0A0A0A]"
        render={<Link href={`/${orgSlug}/tournaments`} />}
      >
        <ArrowLeftIcon data-icon="inline-start" />
        Todos los torneos
      </Button>

      <ModulePageHeader
        band="tournaments"
        title={tournament.name}
        description={`Temporada ${tournament.season} · ${sportLabel(sportName)} · ${formatLabel(tournament.format)}`}
        actions={
          access.canManageStaff ? (
            <DeleteTournamentButton
              orgSlug={orgSlug}
              tournamentId={tournament.id}
              tournamentName={tournament.name}
            />
          ) : null
        }
      />

      <Tabs defaultValue="enrollment">
        <TabsList variant="line" className="mb-5 rounded-none">
          <TabsTrigger value="enrollment" className="rounded-[2px]">
            Equipos inscritos
          </TabsTrigger>
          <TabsTrigger value="settings" className="rounded-[2px]">
            Configuración
          </TabsTrigger>
        </TabsList>

        <TabsContent value="enrollment">
          <TournamentEnrollment
            orgSlug={orgSlug}
            tournamentId={tournament.id}
            enrolled={enrolled}
            available={available}
            canManageStaff={access.canManageStaff}
          />
        </TabsContent>

        <TabsContent value="settings">
          {access.canManageStaff ? (
            <div className="border border-[#D0D5DB] bg-white p-5">
              <TournamentEditForm
                orgSlug={orgSlug}
                tournamentId={tournament.id}
                sports={sports ?? []}
                initial={{
                  name: tournament.name,
                  season: tournament.season,
                  sportId: tournament.sport_id,
                  format: tournament.format,
                  legs: tournament.legs,
                  status: tournament.status as TournamentStatus,
                  startDate: tournament.start_date,
                }}
              />
            </div>
          ) : (
            <dl className="grid max-w-lg gap-4 border border-[#D0D5DB] bg-white p-5 text-sm">
              <div>
                <dt className="font-medium text-[#5C6570]">Temporada</dt>
                <dd className="mt-1 font-mono text-[#0A0A0A]">
                  {tournament.season}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-[#5C6570]">Formato</dt>
                <dd className="mt-1 text-[#0A0A0A]">
                  {formatLabel(tournament.format)} ·{" "}
                  {legsLabel(tournament.legs)}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-[#5C6570]">Estado</dt>
                <dd className="mt-1 text-[#0A0A0A]">
                  {TOURNAMENT_STATUS_LABELS[tournament.status]}
                </dd>
              </div>
            </dl>
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}
