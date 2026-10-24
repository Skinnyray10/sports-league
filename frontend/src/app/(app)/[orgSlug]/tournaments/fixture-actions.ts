"use server";

import { revalidatePath } from "next/cache";
import { requireOrgRole } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { actionError, type ActionResult } from "@/components/ops/access";
import {
  FIRST_PLAYOFF_STAGE,
  PLAYOFF_SIZES,
  matchWinner,
  roundRobin,
  seededPairs,
  type PlayoffSize,
} from "@/lib/fixtures";

type Supabase = Awaited<ReturnType<typeof createClient>>;

const PENDING_STATUSES = ["programado", "en_vivo", "aplazado"];

function revalidateFixtures(orgSlug: string, tournamentId: string) {
  revalidatePath(`/${orgSlug}/tournaments/${tournamentId}`);
  revalidatePath(`/${orgSlug}/matches`);
  revalidatePath(`/${orgSlug}/standings`);
}

async function loadDivision(
  supabase: Supabase,
  orgId: string,
  tournamentId: string,
  divisionId: string
) {
  const { data, error } = await supabase
    .from("divisions")
    .select("id, tournament:tournaments(id, legs)")
    .eq("id", divisionId)
    .eq("tournament_id", tournamentId)
    .eq("organization_id", orgId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const tournament = Array.isArray(data.tournament)
    ? data.tournament[0]
    : data.tournament;
  return { id: data.id, legs: tournament?.legs === 2 ? 2 : 1 } as const;
}

/** Orden de la tabla regular: puntos, diferencia y nombre (igual que Posiciones). */
async function loadSeeds(
  supabase: Supabase,
  orgId: string,
  divisionId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("standings")
    .select("team_id, team_name, puntos, diferencia")
    .eq("organization_id", orgId)
    .eq("division_id", divisionId);
  if (error) throw error;
  return (data ?? [])
    .map((r) => ({
      id: r.team_id as string,
      name: String(r.team_name),
      puntos: Number(r.puntos),
      diferencia: Number(r.diferencia),
    }))
    .sort(
      (a, b) =>
        b.puntos - a.puntos ||
        b.diferencia - a.diferencia ||
        a.name.localeCompare(b.name, "es")
    )
    .map((r) => r.id);
}

export async function generateRoundRobin(
  orgSlug: string,
  tournamentId: string,
  divisionId: string
): Promise<ActionResult> {
  try {
    const membership = await requireOrgRole(orgSlug, ["admin"]);
    const orgId = membership.organization_id;
    const supabase = await createClient();

    const division = await loadDivision(supabase, orgId, tournamentId, divisionId);
    if (!division) {
      return { ok: false, error: "Esa división no existe en este torneo." };
    }

    const { count, error: countError } = await supabase
      .from("matches")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("division_id", divisionId)
      .eq("stage", "regular");
    if (countError) {
      return actionError(countError, "No pudimos revisar los partidos.");
    }
    if ((count ?? 0) > 0) {
      return {
        ok: false,
        error:
          "Esta división ya tiene rol de juegos. Bórralo primero si quieres generarlo de nuevo.",
      };
    }

    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("id, group_id")
      .eq("organization_id", orgId)
      .eq("division_id", divisionId)
      .order("name");
    if (teamsError) {
      return actionError(teamsError, "No pudimos leer los equipos.");
    }

    // Si hay grupos, cada grupo juega su propio todos contra todos.
    const byGroup = new Map<string | null, string[]>();
    for (const t of teams ?? []) {
      const list = byGroup.get(t.group_id) ?? [];
      list.push(t.id);
      byGroup.set(t.group_id, list);
    }

    const rows = [...byGroup].flatMap(([groupId, ids]) =>
      roundRobin(ids, division.legs).map((p) => ({
        organization_id: orgId,
        tournament_id: tournamentId,
        division_id: divisionId,
        group_id: groupId,
        home_team_id: p.home,
        away_team_id: p.away,
        jornada: p.jornada,
        stage: "regular",
        status: "programado" as const,
      }))
    );

    if (rows.length === 0) {
      return {
        ok: false,
        error: "Agrega al menos dos equipos a la división para generar el rol.",
      };
    }

    const { error } = await supabase.from("matches").insert(rows);
    if (error) {
      return actionError(error, "No pudimos generar el rol de juegos.");
    }

    revalidateFixtures(orgSlug, tournamentId);
    return { ok: true };
  } catch (error) {
    return actionError(error, "No pudimos generar el rol de juegos.");
  }
}

export async function generatePlayoffs(
  orgSlug: string,
  tournamentId: string,
  divisionId: string,
  size: number
): Promise<ActionResult> {
  try {
    const membership = await requireOrgRole(orgSlug, ["admin"]);
    const orgId = membership.organization_id;
    const supabase = await createClient();

    if (!PLAYOFF_SIZES.includes(size as PlayoffSize)) {
      return { ok: false, error: "La liguilla puede ser de 2, 4 u 8 equipos." };
    }

    const division = await loadDivision(supabase, orgId, tournamentId, divisionId);
    if (!division) {
      return { ok: false, error: "Esa división no existe en este torneo." };
    }

    const { data: matches, error: matchesError } = await supabase
      .from("matches")
      .select("stage, status")
      .eq("organization_id", orgId)
      .eq("division_id", divisionId);
    if (matchesError) {
      return actionError(matchesError, "No pudimos revisar los partidos.");
    }
    if ((matches ?? []).some((m) => m.stage !== "regular")) {
      return { ok: false, error: "La liguilla de esta división ya existe." };
    }
    const pending = (matches ?? []).filter((m) =>
      PENDING_STATUSES.includes(m.status)
    ).length;
    if (pending > 0) {
      return {
        ok: false,
        error: `Faltan ${pending} partidos de temporada regular por terminar (o cancelar).`,
      };
    }

    const seeds = await loadSeeds(supabase, orgId, divisionId);
    if (seeds.length < size) {
      return {
        ok: false,
        error: `La división sólo tiene ${seeds.length} equipos; no alcanza para una liguilla de ${size}.`,
      };
    }

    const stage = FIRST_PLAYOFF_STAGE[size as PlayoffSize];
    const rows = seededPairs(seeds.slice(0, size)).map((p) => ({
      organization_id: orgId,
      tournament_id: tournamentId,
      division_id: divisionId,
      home_team_id: p.home,
      away_team_id: p.away,
      stage,
      status: "programado" as const,
    }));

    const { error } = await supabase.from("matches").insert(rows);
    if (error) {
      return actionError(error, "No pudimos generar la liguilla.");
    }

    revalidateFixtures(orgSlug, tournamentId);
    return { ok: true };
  } catch (error) {
    return actionError(error, "No pudimos generar la liguilla.");
  }
}

/** Cuartos → semifinal; semifinal → final y tercer lugar. Reacomoda por tabla. */
export async function advancePlayoffs(
  orgSlug: string,
  tournamentId: string,
  divisionId: string
): Promise<ActionResult> {
  try {
    const membership = await requireOrgRole(orgSlug, ["admin"]);
    const orgId = membership.organization_id;
    const supabase = await createClient();

    const division = await loadDivision(supabase, orgId, tournamentId, divisionId);
    if (!division) {
      return { ok: false, error: "Esa división no existe en este torneo." };
    }

    const { data: matches, error: matchesError } = await supabase
      .from("matches")
      .select(
        "stage, status, home_team_id, away_team_id, home_score, away_score, shootout_winner_team_id"
      )
      .eq("organization_id", orgId)
      .eq("division_id", divisionId)
      .neq("stage", "regular");
    if (matchesError) {
      return actionError(matchesError, "No pudimos revisar la liguilla.");
    }

    const stages = new Set((matches ?? []).map((m) => m.stage));
    if (stages.size === 0) {
      return { ok: false, error: "Primero genera la liguilla." };
    }
    if (stages.has("final")) {
      return { ok: false, error: "La final ya está programada." };
    }
    const current = stages.has("semifinal") ? "semifinal" : "cuartos";
    const round = (matches ?? []).filter(
      (m) => m.stage === current && m.status !== "cancelado"
    );

    const winners: string[] = [];
    const losers: string[] = [];
    for (const m of round) {
      const winner = m.status === "finalizado" ? matchWinner(m) : null;
      if (!winner) {
        return {
          ok: false,
          error: `Faltan resultados de ${current === "cuartos" ? "cuartos de final" : "semifinales"} (en empate, marca quién ganó en penales).`,
        };
      }
      winners.push(winner);
      losers.push(winner === m.home_team_id ? m.away_team_id : m.home_team_id);
    }

    const seeds = await loadSeeds(supabase, orgId, divisionId);
    const bySeed = (ids: string[]) =>
      [...ids].sort((a, b) => seeds.indexOf(a) - seeds.indexOf(b));

    const base = {
      organization_id: orgId,
      tournament_id: tournamentId,
      division_id: divisionId,
      status: "programado" as const,
    };
    const rows =
      current === "cuartos"
        ? seededPairs(bySeed(winners)).map((p) => ({
            ...base,
            home_team_id: p.home,
            away_team_id: p.away,
            stage: "semifinal",
          }))
        : [
            ...seededPairs(bySeed(winners)).map((p) => ({
              ...base,
              home_team_id: p.home,
              away_team_id: p.away,
              stage: "final",
            })),
            ...seededPairs(bySeed(losers)).map((p) => ({
              ...base,
              home_team_id: p.home,
              away_team_id: p.away,
              stage: "tercer_lugar",
            })),
          ];

    const { error } = await supabase.from("matches").insert(rows);
    if (error) {
      return actionError(error, "No pudimos generar la siguiente ronda.");
    }

    revalidateFixtures(orgSlug, tournamentId);
    return { ok: true };
  } catch (error) {
    return actionError(error, "No pudimos generar la siguiente ronda.");
  }
}

/** Borra el rol regular mientras ningún partido se haya jugado. */
export async function deleteRoundRobin(
  orgSlug: string,
  tournamentId: string,
  divisionId: string
): Promise<ActionResult> {
  try {
    const membership = await requireOrgRole(orgSlug, ["admin"]);
    const orgId = membership.organization_id;
    const supabase = await createClient();

    const { count, error: countError } = await supabase
      .from("matches")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("division_id", divisionId)
      .eq("stage", "regular")
      .in("status", ["en_vivo", "finalizado"]);
    if (countError) {
      return actionError(countError, "No pudimos revisar los partidos.");
    }
    if ((count ?? 0) > 0) {
      return {
        ok: false,
        error: "Ya hay partidos jugados; el rol no se puede borrar completo.",
      };
    }

    const { error } = await supabase
      .from("matches")
      .delete()
      .eq("organization_id", orgId)
      .eq("tournament_id", tournamentId)
      .eq("division_id", divisionId)
      .eq("stage", "regular");
    if (error) {
      return actionError(error, "No pudimos borrar el rol de juegos.");
    }

    revalidateFixtures(orgSlug, tournamentId);
    return { ok: true };
  } catch (error) {
    return actionError(error, "No pudimos borrar el rol de juegos.");
  }
}
