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
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Branch, TournamentStatus } from "@/types/database";
import {
  TOURNAMENT_STATUS_LABELS,
  formatLabel,
  legsLabel,
} from "@/lib/labels";

type TournamentDetailPageProps = {
  params: Promise<{ orgSlug: string; tournamentId: string }>;
};

function one<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

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
  ]);

  if (tournamentError) throw tournamentError;
  if (divisionsError) throw divisionsError;
  if (groupsError) throw groupsError;
  if (orgSportsError) throw orgSportsError;
  if (branchesError) throw branchesError;
  if (categoriesError) throw categoriesError;
  if (!tournament) notFound();

  const groupsByDivision = new Map<string, { id: string; name: string }[]>();
  for (const g of groupsRaw ?? []) {
    const list = groupsByDivision.get(g.division_id) ?? [];
    list.push({ id: g.id, name: g.name });
    groupsByDivision.set(g.division_id, list);
  }

  const divisions: DivisionView[] = (divisionsRaw ?? []).flatMap((row) => {
    const sport = one(
      row.sport as
        | { id: string; key: string; name: string }
        | { id: string; key: string; name: string }[]
        | null
    );
    const category = one(
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
      },
    ];
  });

  const sports = (orgSportsRaw ?? []).flatMap((row) => {
    const sport = one(
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
          <TabsTrigger value="divisions" className="rounded-[2px]">
            Divisiones
          </TabsTrigger>
          <TabsTrigger value="settings" className="rounded-[2px]">
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
            <div className="border border-[#D0D5DB] bg-white p-5">
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
