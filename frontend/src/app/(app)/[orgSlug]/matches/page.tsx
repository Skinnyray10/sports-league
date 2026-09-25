import Link from "next/link";
import { getMatchAccess } from "@/components/matches/access";
import {
  CreateMatchDialog,
  type DivisionOption,
  type GroupOption,
  type TeamOption,
} from "@/components/matches/create-match-dialog";
import {
  MatchesFilters,
  type MatchFilterOption,
  type MatchFiltersState,
} from "@/components/matches/matches-filters";
import { MatchPageHeader } from "@/components/matches/page-header";
import {
  MatchesTable,
  type MatchListRow,
} from "@/components/matches/matches-table";
import { BRANCH_LABELS, sportLabel } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import type { Branch, MatchStatus } from "@/types/database";

type PageProps = {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{
    deporte?: string | string[];
    rama?: string | string[];
    categoria?: string | string[];
    grupo?: string | string[];
    jornada?: string | string[];
  }>;
};

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value || undefined;
}

export default async function MatchesPage({ params, searchParams }: PageProps) {
  const { orgSlug } = await params;
  const sp = await searchParams;
  const access = await getMatchAccess(orgSlug);
  const orgId = access.membership.organization_id;
  const supabase = await createClient();

  const filters: MatchFiltersState = {
    sport: firstParam(sp.deporte),
    branch: firstParam(sp.rama),
    category: firstParam(sp.categoria),
    group: firstParam(sp.grupo),
    jornada: firstParam(sp.jornada),
  };

  const [
    { data: matchesRaw, error: matchesError },
    { data: divisionsRaw, error: divisionsError },
    { data: teamsRaw, error: teamsError },
    { data: groupsRaw, error: groupsError },
    { data: categoriesRaw, error: categoriesError },
    { data: sportsRaw, error: sportsError },
  ] = await Promise.all([
    supabase
      .from("matches")
      .select(
        `
        id,
        status,
        home_score,
        away_score,
        scheduled_at,
        jornada,
        stage,
        venue,
        group_id,
        division:divisions(
          branch,
          sport_id,
          category_id,
          sport:sports(id, key, name),
          category:categories(id, name)
        ),
        tournament:tournaments(name),
        group:groups(name),
        home_team:teams!matches_home_team_id_fkey(name),
        away_team:teams!matches_away_team_id_fkey(name)
      `
      )
      .eq("organization_id", orgId)
      .order("scheduled_at", { ascending: true, nullsFirst: false }),
    supabase
      .from("divisions")
      .select(
        `
        id,
        tournament_id,
        sport_id,
        branch,
        category_id,
        name,
        tournament:tournaments(name),
        sport:sports(id, key, name),
        category:categories(id, name)
      `
      )
      .eq("organization_id", orgId)
      .order("created_at"),
    supabase
      .from("teams")
      .select("id, name, division_id, group_id")
      .eq("organization_id", orgId)
      .order("name"),
    supabase
      .from("groups")
      .select("id, name, division_id")
      .eq("organization_id", orgId)
      .order("name"),
    supabase
      .from("categories")
      .select("id, name")
      .eq("organization_id", orgId)
      .order("sort_order"),
    supabase.from("sports").select("id, key, name").order("name"),
  ]);

  if (matchesError) throw matchesError;
  if (divisionsError) throw divisionsError;
  if (teamsError) throw teamsError;
  if (groupsError) throw groupsError;
  if (categoriesError) throw categoriesError;
  if (sportsError) throw sportsError;

  type MatchRow = MatchListRow & {
    sportId: string | null;
    categoryId: string | null;
    groupId: string | null;
  };

  const allMatches: MatchRow[] = (matchesRaw ?? []).map((row) => {
    const tournament = unwrapOne(row.tournament);
    const division = unwrapOne(row.division);
    const sport = division ? unwrapOne(division.sport) : null;
    const category = division ? unwrapOne(division.category) : null;
    const group = unwrapOne(row.group);
    const homeTeam = unwrapOne(row.home_team);
    const awayTeam = unwrapOne(row.away_team);
    return {
      id: row.id,
      status: row.status as MatchStatus,
      homeScore: row.home_score,
      awayScore: row.away_score,
      scheduledAt: row.scheduled_at,
      jornada: row.jornada,
      stage: row.stage,
      venue: row.venue,
      tournamentName: tournament?.name ?? "Torneo",
      sportKey: sport?.key ?? sport?.name ?? "",
      branch: (division?.branch as Branch | null) ?? null,
      categoryName: category?.name ?? null,
      groupName: group?.name ?? null,
      homeTeamName: homeTeam?.name ?? "Local",
      awayTeamName: awayTeam?.name ?? "Visitante",
      sportId: division?.sport_id ?? null,
      categoryId: division?.category_id ?? null,
      groupId: row.group_id,
    };
  });

  const matches: MatchListRow[] = allMatches.filter((row) => {
    if (filters.sport && row.sportId !== filters.sport) return false;
    if (filters.branch && row.branch !== filters.branch) return false;
    if (filters.category && row.categoryId !== filters.category) return false;
    if (filters.group && row.groupId !== filters.group) return false;
    if (filters.jornada && String(row.jornada ?? "") !== filters.jornada) {
      return false;
    }
    return true;
  });

  const divisions: DivisionOption[] = (divisionsRaw ?? []).map((d) => {
    const tournament = unwrapOne(d.tournament);
    const sport = unwrapOne(d.sport);
    const category = unwrapOne(d.category);
    const branch = d.branch as Branch;
    const sportName = sport?.name ?? "Deporte";
    const categoryName = category?.name ?? "Categoría";
    const label =
      d.name?.trim() ||
      `${tournament?.name ?? "Torneo"} · ${sportLabel(sport?.key ?? sportName)} · ${BRANCH_LABELS[branch]} · ${categoryName}`;
    return {
      id: d.id,
      tournamentId: d.tournament_id,
      tournamentName: tournament?.name ?? "Torneo",
      sportId: d.sport_id,
      sportKey: sport?.key ?? "",
      sportName,
      branch,
      categoryId: d.category_id,
      categoryName,
      label,
    };
  });

  const teams: TeamOption[] = (teamsRaw ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    divisionId: t.division_id,
    groupId: t.group_id,
  }));

  const groups: GroupOption[] = (groupsRaw ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    divisionId: g.division_id,
  }));

  const sports: MatchFilterOption[] = (sportsRaw ?? []).map((s) => ({
    id: s.id,
    label: s.key,
  }));

  const categories: MatchFilterOption[] = (categoriesRaw ?? []).map((c) => ({
    id: c.id,
    label: c.name,
  }));

  const groupFilterOptions: MatchFilterOption[] = groups.map((g) => ({
    id: g.id,
    label: g.name,
  }));

  const branchSet = new Set<Branch>();
  for (const d of divisions) branchSet.add(d.branch);
  const branches = Array.from(branchSet);

  const jornadaSet = new Set<number>();
  for (const m of allMatches) {
    if (m.jornada != null) jornadaSet.add(m.jornada);
  }
  const jornadas = Array.from(jornadaSet).sort((a, b) => a - b);

  return (
    <div className="mx-auto max-w-6xl">
      <MatchPageHeader
        title="Partidos"
        description="Programa la jornada, aplaza o cancela con historial, y asigna árbitros. El marcador se cierra en la cédula."
        actions={
          access.canCreateMatch ? (
            divisions.length > 0 ? (
              <CreateMatchDialog
                orgSlug={orgSlug}
                divisions={divisions}
                teams={teams}
                groups={groups}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                <Link
                  href={`/${orgSlug}/tournaments`}
                  className="underline-offset-4 hover:underline"
                >
                  Crea un torneo
                </Link>{" "}
                con divisiones y equipos para poder programar partidos.
              </p>
            )
          ) : null
        }
      />
      <MatchesFilters
        orgSlug={orgSlug}
        filters={filters}
        sports={sports}
        branches={branches}
        categories={categories}
        groups={groupFilterOptions}
        jornadas={jornadas}
      />
      <MatchesTable
        orgSlug={orgSlug}
        matches={matches}
        canCreateMatch={access.canCreateMatch}
      />
    </div>
  );
}

function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}
