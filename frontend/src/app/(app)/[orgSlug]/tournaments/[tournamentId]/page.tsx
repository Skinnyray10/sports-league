import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getOrgAccess } from "@/components/ops/access";
import { ModulePageHeader } from "@/components/ops/module-page-header";
import { DeleteTournamentButton } from "@/components/tournaments/delete-tournament-button";
import { TournamentEditForm } from "@/components/tournaments/tournament-edit-form";
import {
  TournamentDivisions,
  type DivisionView,
} from "@/components/tournaments/tournament-divisions";
import type { DivisionFixtureSummary } from "@/components/tournaments/division-fixtures";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Branch, TournamentStatus } from "@/types/database";
import {
  TOURNAMENT_STATUS_LABELS,
  formatLabel,
  legsLabel,
} from "@/lib/labels";
import { unwrapOne } from "@/lib/utils";

const PLAYOFF_STAGE_ORDER = ["cuartos", "semifinal", "tercer_lugar", "final"];

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
    { data: divisionsRaw, error: divisionsError },
    { data: groupsRaw, error: groupsError },
    { data: orgSportsRaw, error: orgSportsError },
    { data: branchesRaw, error: branchesError },
    { data: categories, error: categoriesError },
    { data: teamsRaw, error: teamsError },
    { data: matchesRaw, error: matchesError },
  ] = await Promise.all([
    supabase
      .from("tournaments")
      .select("*")
      .eq("id", tournamentId)
      .eq("organization_id", orgId)
      .maybeSingle(),
    supabase
      .from("divisions")
      .select(
        "id, name, branch, sport:sports(id, key, name), category:categories(id, name)"
      )
      .eq("tournament_id", tournamentId)
      .eq("organization_id", orgId)
      .order("created_at", { ascending: true }),
    supabase
      .from("groups")
      .select("id, name, division_id")
      .eq("organization_id", orgId)
      .order("name", { ascending: true }),
    supabase
      .from("org_sports")
      .select("active, sport:sports(id, key, name)")
      .eq("organization_id", orgId)
      .eq("active", true),
    supabase
      .from("org_sport_branches")
      .select("sport_id, branch, active")
      .eq("organization_id", orgId)
      .eq("active", true),
    supabase
      .from("categories")
      .select("id, name")
      .eq("organization_id", orgId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("teams")
      .select("division_id")
      .eq("organization_id", orgId),
    supabase
      .from("matches")
      .select("division_id, stage, status, jornada")
      .eq("organization_id", orgId)
      .eq("tournament_id", tournamentId),
  ]);

  if (tournamentError) throw tournamentError;
  if (divisionsError) throw divisionsError;
  if (groupsError) throw groupsError;
  if (orgSportsError) throw orgSportsError;
  if (branchesError) throw branchesError;
  if (categoriesError) throw categoriesError;
  if (teamsError) throw teamsError;
  if (matchesError) throw matchesError;
  if (!tournament) notFound();

  const groupsByDivision = new Map<string, { id: string; name: string }[]>();
  for (const g of groupsRaw ?? []) {
    const list = groupsByDivision.get(g.division_id) ?? [];
    list.push({ id: g.id, name: g.name });
    groupsByDivision.set(g.division_id, list);
  }

  const fixtureSummary = (divisionId: string): DivisionFixtureSummary => {
    const matches = (matchesRaw ?? []).filter(
      (m) => m.division_id === divisionId
    );
    const regular = matches.filter((m) => m.stage === "regular");
    const stages = new Set(matches.map((m) => m.stage));
    return {
      teamCount: (teamsRaw ?? []).filter((t) => t.division_id === divisionId)
        .length,
      regularMatches: regular.length,
      regularPlayed: regular.filter(
        (m) => m.status === "finalizado" || m.status === "en_vivo"
      ).length,
      jornadas: new Set(regular.map((m) => m.jornada)).size,
      playoffStages: PLAYOFF_STAGE_ORDER.filter((s) => stages.has(s)),
    };
  };

  const divisions: DivisionView[] = (divisionsRaw ?? []).flatMap((row) => {
    const sport = unwrapOne(
      row.sport as
        | { id: string; key: string; name: string }
        | { id: string; key: string; name: string }[]
        | null
    );
    const category = unwrapOne(
      row.category as
        | { id: string; name: string }
        | { id: string; name: string }[]
        | null
    );
    if (!sport || !category) return [];
    return [
      {
        id: row.id,
        name: row.name,
        branch: row.branch as Branch,
        sport,
        category,
        groups: groupsByDivision.get(row.id) ?? [],
        fixtures: fixtureSummary(row.id),
      },
    ];
  });

  const sports = (orgSportsRaw ?? []).flatMap((row) => {
    const sport = unwrapOne(
      row.sport as
        | { id: string; key: string; name: string }
        | { id: string; key: string; name: string }[]
        | null
    );
    return sport ? [sport] : [];
  });

  const activeBranches = (branchesRaw ?? []).map((b) => ({
    sport_id: b.sport_id,
    branch: b.branch as Branch,
  }));

  return (
    <section className="mx-auto w-full max-w-5xl">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
        render={<Link href={`/${orgSlug}/tournaments`} />}
      >
        <ArrowLeftIcon data-icon="inline-start" />
        Todos los torneos
      </Button>

      <ModulePageHeader
        band="tournaments"
        title={tournament.name}
        description={`Temporada ${tournament.season} · ${formatLabel(tournament.format)} · ${legsLabel(tournament.legs)}`}
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

      <Tabs defaultValue="divisions">
        <TabsList variant="line" className="mb-5 rounded-none">
          <TabsTrigger value="divisions">
            Divisiones
          </TabsTrigger>
          <TabsTrigger value="settings">
            Configuración
          </TabsTrigger>
        </TabsList>

        <TabsContent value="divisions">
          <TournamentDivisions
            orgSlug={orgSlug}
            tournamentId={tournament.id}
            divisions={divisions}
            sports={sports}
            categories={categories ?? []}
            activeBranches={activeBranches}
            canManageStaff={access.canManageStaff}
          />
        </TabsContent>

        <TabsContent value="settings">
          {access.canManageStaff ? (
            <div className="border border-border bg-card p-5">
              <TournamentEditForm
                orgSlug={orgSlug}
                tournamentId={tournament.id}
                initial={{
                  name: tournament.name,
                  season: tournament.season,
                  format: tournament.format,
                  legs: tournament.legs,
                  status: tournament.status as TournamentStatus,
                  startDate: tournament.start_date,
                }}
              />
            </div>
          ) : (
            <dl className="grid max-w-lg gap-4 border border-border bg-card p-5 text-sm">
              <div>
                <dt className="font-medium text-muted-foreground">Temporada</dt>
                <dd className="mt-1 font-mono text-foreground">
                  {tournament.season}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Formato</dt>
                <dd className="mt-1 text-foreground">
                  {formatLabel(tournament.format)} ·{" "}
                  {legsLabel(tournament.legs)}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Estado</dt>
                <dd className="mt-1 text-foreground">
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
