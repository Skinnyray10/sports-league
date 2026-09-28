import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { requireOrgRole } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { MatchSheetForm } from "@/components/referee/match-sheet-form";
import { ensureMatchSheet } from "@/app/(app)/[orgSlug]/referee/actions";
import type { Branch, MatchEventType, ScoreType } from "@/types/database";

type PageProps = {
  params: Promise<{ orgSlug: string; matchId: string }>;
};

export default async function RefereeMatchSheetPage({ params }: PageProps) {
  const { orgSlug, matchId } = await params;
  const user = await requireUser();
  const membership = await requireOrgRole(orgSlug, ["referee", "admin"]);
  const supabase = await createClient();
  const orgId = membership.organization_id;

  const { data: match } = await supabase
    .from("matches")
    .select(
      `
      *,
      home_team:teams!matches_home_team_id_fkey(id, name),
      away_team:teams!matches_away_team_id_fkey(id, name),
      division:divisions(
        branch,
        sport:sports(key, name, score_type, draw_requires_shootout)
      )
    `
    )
    .eq("id", matchId)
    .eq("organization_id", orgId)
    .maybeSingle();

  if (!match) notFound();

  const { data: roles } = await supabase
    .from("memberships")
    .select("role")
    .eq("organization_id", orgId)
    .eq("user_id", user.id);
  const isAdmin = (roles ?? []).some((r) => r.role === "admin");
  if (!isAdmin && match.referee_id !== user.id) {
    notFound();
  }

  const ensured = await ensureMatchSheet(orgSlug, matchId);
  if (!ensured.ok || !ensured.sheetId) {
    throw new Error(ensured.ok ? "Sin cédula" : ensured.error);
  }

  const sheetId = ensured.sheetId;

  const { data: sheet } = await supabase
    .from("match_sheets")
    .select("*")
    .eq("id", sheetId)
    .single();

  const home = unwrap(match.home_team);
  const away = unwrap(match.away_team);
  const division = unwrap(match.division);
  const sport = unwrap(division?.sport ?? null);

  const [{ data: homeRegs }, { data: awayRegs }, { data: participants }, { data: events }, { data: sets }] =
    await Promise.all([
      supabase
        .from("player_registrations")
        .select(
          "id, jersey_number, player:players(first_names, last_names)"
        )
        .eq("team_id", match.home_team_id)
        .eq("status", "aprobado")
        .eq("eligibility", "elegible"),
      supabase
        .from("player_registrations")
        .select(
          "id, jersey_number, player:players(first_names, last_names)"
        )
        .eq("team_id", match.away_team_id)
        .eq("status", "aprobado")
        .eq("eligibility", "elegible"),
      supabase
        .from("match_participants")
        .select("player_registration_id, team_id")
        .eq("match_sheet_id", sheetId),
      supabase
        .from("match_events")
        .select("*")
        .eq("match_sheet_id", sheetId)
        .order("created_at", { ascending: true }),
      supabase
        .from("match_sets")
        .select("*")
        .eq("match_id", matchId)
        .order("set_number"),
    ]);

  const mapRegs = (
    regs: typeof homeRegs,
    teamId: string,
    teamName: string
  ) =>
    (regs ?? []).map((r) => {
      const p = unwrap(r.player);
      return {
        id: r.id,
        teamId,
        teamName,
        jersey: r.jersey_number,
        name: `${p?.first_names ?? ""} ${p?.last_names ?? ""}`.trim(),
      };
    });

  return (
    <MatchSheetForm
      orgSlug={orgSlug}
      matchId={matchId}
      sheetId={sheetId}
      closed={!!sheet?.closed_at}
      observations={sheet?.observations ?? ""}
      refereeName={sheet?.referee_name ?? ""}
      homeTeamId={match.home_team_id}
      awayTeamId={match.away_team_id}
      homeTeamName={home?.name ?? "Local"}
      awayTeamName={away?.name ?? "Visitante"}
      sportKey={sport?.key ?? ""}
      sportName={sport?.name ?? ""}
      branch={(division?.branch as Branch) ?? "varonil"}
      scoreType={(sport?.score_type as ScoreType) ?? "goals"}
      drawRequiresShootout={sport?.draw_requires_shootout ?? false}
      shootoutWinnerTeamId={match.shootout_winner_team_id}
      homeScore={match.home_score}
      awayScore={match.away_score}
      eligiblePlayers={[
        ...mapRegs(homeRegs, match.home_team_id, home?.name ?? "Local"),
        ...mapRegs(awayRegs, match.away_team_id, away?.name ?? "Visitante"),
      ]}
      selectedRegistrationIds={(participants ?? []).map(
        (p) => p.player_registration_id
      )}
      events={(events ?? []).map((e) => ({
        id: e.id,
        playerRegistrationId: e.player_registration_id,
        teamId: e.team_id,
        eventType: e.event_type as MatchEventType,
        quantity: e.quantity,
        minute: e.minute,
      }))}
      sets={(sets ?? []).map((s) => ({
        id: s.id,
        setNumber: s.set_number,
        home: s.home_set_score,
        away: s.away_set_score,
      }))}
    />
  );
}

function unwrap<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}
